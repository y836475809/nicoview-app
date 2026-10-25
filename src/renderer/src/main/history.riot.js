import { infoFormatter } from "@renderer/common/nico-grid-formatter.js";
import {mountNicoGrid} from "@renderer/common/nico-grid-mount.js";;
import { MyObservable, window_obs } from "@lib/my-observable.js";
import { logger } from "@lib/logger.js";

import NicoGrid from '@renderer/common/nico-grid.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "history-nico-grid";

export default {
    components: {
        'nico-grid': NicoGrid
    },

    async onBeforeMount() {
        window.electronAPI.on('download:addMark', async (videoId, mark) => {
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                if(videoId===item.video_id){
                    if(mark==='downloaded'){
                        item.saved = true;
                    }
                    if(mark==='reg'){
                        item.reg_download = true;
                    }
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props: item
                    });
                    break;
                }
            }   
        });
        window.electronAPI.on('download:deleteMark', async (videoId, mark) => {
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                if(videoId===item.video_id){
                    if(mark==='downloaded'){
                        item.saved = false;
                    }
                    if(mark==='reg'){
                        item.reg_download = false;
                    }
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props: item
                    });
                    break;
                }
            }   
        });
        window.electronAPI.on('library:addItem', async (item) => {
            const video_id = item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: true }
            });
        });
        window.electronAPI.on('library:deleteItem', async (item) => {
            const video_id = item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: false }
            });
        });
        window.electronAPI.on('history:addItem', async (item) => {
            await this.addData(item);
        });

        main_obs.on("history:reload-items", async ()=>{
            await this.loadItems();
        });

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
        this.nico_grid_obs = new MyObservable();
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            // await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                window.electronAPI.invoke('player:play', data.video_id, false);
            }
            if(cmd_id == "stack"){
                window.electronAPI.invoke('stack:addItem', {
                    video_id: data.video_id,
                    title: data.title, 
                    thumb_img:data.thumb_img,
                    time:0
                });
            }
            if(cmd_id == "bookmark"){
                window.electronAPI.invoke('bookmark:addItem', {
                    video_id: data.video_id,
                    title: data.title, 
                    time: 0,
                    marked: false
                });
            }
            if(cmd_id == "download"){
                window.electronAPI.invoke('download:addItem', {
                    video_id: data.video_id,
                    title: data.title, 
                    thumb_img:data.thumb_img,
                    state: 0
                });
            }
        });

        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }
            // await myapi.ipc.popupContextMenu("history", {items});  
        });
        const state = (await window.electronAPI.invoke('config:get')).history_nico_grid;
        if(state.columns.length === 0){
            state.columns = columns.map(col => {
                return {id:col.id, width:100};
            });
        }
        const gridData = mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        this.update({
            gridData:gridData
        });
    },
    async onMounted() {
        await this.loadItems();
    },
    async addData(item) {
        const items = await window.electronAPI.invoke('history:getItems');
        this.setData(items, true);
    },
    async setData(items, fix_scroll) {
        const video_ids = await window.electronAPI.invoke('download:getMarkedIds');
        for (let i=0; i<items.length; i++) {
            const item = items[i];
            const video_id = item.video_id;
            item.saved = await window.electronAPI.invoke('library:exists', video_id);
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
            const items = await window.electronAPI.invoke('history:getItems');
            this.setData(items, false);
        } catch (error) {
            logger.error(error);
            await await window.electronAPI.invoke(
                'showErrorMsgBox', `再生履歴の読み込み失敗\n${error.message}`);
        }
    }
};
