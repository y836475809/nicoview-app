const myapi = require("../../js/my-api");
const { infoFormatter } = require("../../pages/common/nico-grid-formatter");
const { mountNicoGrid } = require("../../pages/common/nico-grid-mount");
const { Command } = require("../../js/command");
const { MyObservable, window_obs } = require("../../js/my-observable");
const { logger } = require("../../js/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "nico_grid_history";

module.exports = {
    onBeforeMount() {
        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = await this.nico_grid_obs.triggerReturn("get-items");

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                this.nico_grid_obs.trigger("update-item", {
                    id: video_id,
                    props: item
                });
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: true }
            });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            /** @type {{video_id:string}} */
            const { video_id } = args;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: false }
            });
        });

        myapi.ipc.History.onUpdateItem(async ()=>{
            const items = await myapi.ipc.History.getItems();
            this.setData(items);
        });

        main_obs.on("history-page:reload-items", async ()=>{
            await this.loadItems();
        });
    },
    async onMounted() {
        const histroy_infoFormatter =  infoFormatter.bind(this, (value, data) => { 
            return `<div>ID: ${data.video_id}</div>`;
        });
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 130},
            {id: "title", name: "名前", sortable: false},
            {id: "command", name: "操作"},
            {id: "info", name: "情報",sortable: false, ft: histroy_infoFormatter},
            {id: "play_date", name: "再生日", sortable: false}
        ];
        const options = {
            header_height: 30,
            row_height: 100,
            img_cache_capacity:50,
            view_margin_num: 5
        };
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid("#history-nico-grid", state, this.nico_grid_obs, columns, options);

        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", (args) => {
            const { data } = args;
            if(data.video_id){
                Command.play(data, false);
            }
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                Command.play(data, false);
            }
            if(cmd_id == "stack"){
                Command.addStackItems(main_obs, [data]);
            }
            if(cmd_id == "bookmark"){
                Command.addBookmarkItems(main_obs, [data]);
            }
            if(cmd_id == "download"){
                Command.addDownloadItems(main_obs, [data]);
            }
        });
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }
            await myapi.ipc.popupContextMenu("history", {items});  
        });
        
        await this.loadItems();
    },
    async setData(items) {
        const video_ids = await myapi.ipc.Download.getIncompleteIDs();
        for (let i=0; i<items.length; i++) {
            const item = items[i];
            const video_id = item.video_id;
            item.saved = await myapi.ipc.Library.hasItem(video_id);
            item.reg_download = video_ids.includes(video_id);  
        }
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "video_id",
            items: items
        });
    },
    async loadItems() {
        try {
            const items = await myapi.ipc.History.getItems();
            this.setData(items);
        } catch (error) {
            logger.error(error);
            await myapi.ipc.Dialog.showMessageBox({
                type: "error",
                message: `再生履歴の読み込み失敗\n${error.message}`
            });
        }
    }
};