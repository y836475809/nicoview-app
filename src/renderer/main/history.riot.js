const myapi = require("../../lib/my-api");
const { infoFormatter } = require("../common/nico-grid-formatter");
const { mountNicoGrid } = require("../common/nico-grid-mount");
const { Command } = require("../../lib/command");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "history-nico-grid";

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
            this.setData(items, true);
        });

        main_obs.on("history:reload-items", async ()=>{
            await this.loadItems();
        });
    },
    async onMounted() {
        const histroy_infoFormatter =  infoFormatter.bind(this, (id, value, data) => { 
            return `<div>ID: ${data.video_id}</div>`;
        });
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 130},
            {id: "title", name: "名前", sortable: false},
            {id: "command", name: "操作"},
            {id: "info", name: "情報",sortable: false, ft: histroy_infoFormatter},
            {id: "play_date", name: "再生日", sortable: false}
        ];
        /** @type {NicoGridOptions} */
        const options = {
            sort_param: {
                id: "",
                asc: true,
                enable: false
            }
        };
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);

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
    async setData(items, fix_scroll) {
        const video_ids = await myapi.ipc.Download.getIncompleteIDs();
        for (let i=0; i<items.length; i++) {
            const item = items[i];
            const video_id = item.video_id;
            item.saved = await myapi.ipc.Library.hasItem(video_id);
            item.reg_download = video_ids.includes(video_id);  
        }
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "video_id",
            items: items,
            fix_scroll: fix_scroll
        });
    },
    async loadItems() {
        try {
            const items = await myapi.ipc.History.getItems();
            this.setData(items, false);
        } catch (error) {
            logger.error(error);
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: `再生履歴の読み込み失敗\n${error.message}`
            });
        }
    }
};