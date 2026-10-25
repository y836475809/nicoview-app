import { buttonFormatter } from "@renderer/common/nico-grid-formatter.js";
import {mountNicoGrid} from "@renderer/common/nico-grid-mount.js";
import { ScheduledTask } from "@lib/scheduled-task.js";
import { MyObservable, window_obs } from "@lib/my-observable.js";
import { logger } from "@lib/logger.js";

import DownloadSchedule from '@renderer/main/download-schedule.riot';
import NicoGrid from '@renderer/common/nico-grid.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

const DownloadState = Object.freeze({
    wait: 0,
    downloading: 1,
    complete: 2,
    error: 3
});

const message_map = new Map([
    [DownloadState.wait, "待機"],
    [DownloadState.downloading, "ダウンロード中"],
    [DownloadState.complete, "ダウンロード完了"],
    [DownloadState.error, "ダウンロード失敗"],
]);

const nico_grid_name = "download-nico-grid";

export default {
    components: {
        'download-schedule': DownloadSchedule,
        'nico-grid': NicoGrid,
    },

    state:{
        dl_disabled:"",
    },

    /** @type {MyObservable} */
    obs_schedule:null,

    /** @type {DownloadSchedule} */
    download_schedule:null,

    /** @type {ScheduledTask} */
    scheduled_task:null,

    downloading: false,
    cancel_download:false,
    
    async onBeforeMount() {
        this.obs_schedule = new MyObservable();

        // main_obs.on("download:add-download-items", async (items) => {
        //     await this.addDownloadItems(items);
        // });

        main_obs.on("download:delete-download-items", async (video_ids) => {
            await this.deleteDownloadItems(video_ids);
        });

        const infoFormatter = (id, value, data)=> {
            const video_id = data.video_id;
            return `ID: ${video_id}`;
        }; 
        const htmlFormatter = (id, value, data)=> {
            const msg = message_map.get(value);
            const class_value = state==DownloadState.complete?
                'class="download-state-complete"':"";
            const content = `<div ${class_value}>${msg}</div><div>${data.progress}</div>`;
            return content;
        };
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 130},
            {id: "title", name: "名前"},
            {id: "command", name: "操作",  
                ft: buttonFormatter.bind(this,["play", "stack", "bookmark"])},
            {id: "info", name: "情報", ft: infoFormatter},
            {id: "state", name: "状態", ft: htmlFormatter}
        ];
        /** @type {NicoGridOptions} */
        const options = {
            view_margin_num: 10,
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
            await window.electronAPI.invoke('config:set', 'download_nico_grid', state);
        });
        this.nico_grid_obs.on("db-cliecked", async (args) => {
            const { data } = args;
            // Command.play(data, false);
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                // Command.play(data, false);
            }
            if(cmd_id == "stack"){
                // Command.addStackItems(main_obs, [data]);
            }
            if(cmd_id == "bookmark"){
                // Command.addBookmarkItems(main_obs, [data]);
            }
        });
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }
            const videoId = items[0].video_id;
            const cmd = await window.electronAPI.invoke('download:showContextMenu', videoId);
            if(cmd === 'delete'){
                 await this.deleteDownloadItems([videoId]);
            }
            // const menu_id = await myapi.ipc.popupContextMenu("download", {items});
            // if(!menu_id){
            //     return;
            // }
            // if(menu_id=="delete"){
            //     const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
            //         type: "info",
            //         message: "削除しますか?"
            //     });
            //     if(!ret){
            //         return;
            //     }
            //     const video_ids = items.map(value => {
            //         return value.video_id;
            //     });
            //     await this.deleteDownloadItems(video_ids);
            // }
        });
        const state = (await window.electronAPI.invoke('config:get')).download_nico_grid;
        if(state.columns.length === 0){
            state.columns = columns.map(col => {
                return {id:col.id, width:100};
            });
        }
        const gridData =mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        this.update({
            gridData:gridData
        });
        
    },
    async onMounted() {
        this.download_schedule = (await window.electronAPI.invoke('config:get')).download.schedule;
        this.obs_schedule.trigger("set-params", this.download_schedule);
        this.obs_schedule.on("change-params", async (args) => {
            /** @type {{date:{hour:number, minute:number}, enable:boolean}} */
            const { date, enable } = args;
            const downloadConfig = (await window.electronAPI.invoke('config:get')).download;
            downloadConfig.schedule.date = date;
            downloadConfig.schedule.enable = enable;
            await window.electronAPI.invoke('config:set', 'download', downloadConfig);

            this.download_schedule.date = date;
            this.download_schedule.enable = enable;

            if(enable==true){
                this.scheduled_task.stop();
                this.scheduled_task = new ScheduledTask(this.download_schedule.date, this.startDownload);
                this.scheduled_task.start();
            }else{
                this.scheduled_task.stop();
            }
        });

        try {
            const items = await window.electronAPI.invoke('download:getItems');
            const dl_items = items.map(value=>{
                const dl_item = Object.assign({...value});
                Object.assign(dl_item, {
                    progress: ""
                });
                return dl_item;
            });
            this.nico_grid_obs.triggerReturn("set-data", {
                key_id: "video_id",
                items: dl_items
            });
            
        } catch (error) {
            logger.error("download item load error: ", error);
            await window.electronAPI.invoke(
                'showErrorMsgBox', `ダウンロードリストの読み込み失敗\n${error.message}`);
        }

        this.scheduled_task = new ScheduledTask(this.download_schedule.date, this.startDownload);
        if(this.download_schedule.enable==true){
            this.scheduled_task.start();
        }

        window.electronAPI.on('download:addItem', async (item) => {
             await this.addDownloadItems([item]);
        });

        window.electronAPI.on('download:DownloadProgress', async (videoId, state, message) => {
            this.nico_grid_obs.trigger("update-item", {
                id: videoId,
                props:{
                    progress: `${message}`,  
                    state: state
                }
            });
        });
        window.electronAPI.on('download:DownloadResult', async (videoId, result, message) => {
            let msg = `終了: 画質${result.reason}`;
            if(result === 'skip'){
                msg = `スキップ: ${result.reason}`; 
            }
            if(result === 'error'){
                msg = `エラー: ${result.reason.message}`;
                logger.debug(`download video_id=${videoId}: `, msg);
            }
            if(result === 'cancel'){
                msg = `キャンセル}`; 
            }
            this.nico_grid_obs.trigger("update-item", {
                id: videoId,
                props:{
                    progress: msg, 
                    state: result
                }
            });
        });
    },
    async cancelDownload() {
        await window.electronAPI.invoke('download:cancelDownload');
    },
    async onclickStartDownload(e) { // eslint-disable-line no-unused-vars
        this.scheduled_task.stop();

        await this.startDownload();

        if(this.download_schedule.enable==true){
            this.scheduled_task.start();
        }
    },
    onclickStopDownload(e) { // eslint-disable-line no-unused-vars
        this.cancelDownload();
        this.cancel_download = true;
    },
    async onclickClearDownloadedItems() {
        await this.clearDownloadItems(DownloadState.complete);
    },
    async onChangeDownloadItem() {
        /** @type {RegDownloadItem[]} */
        const grid_data = await this.nico_grid_obs.triggerReturn("get-items");
        const items = grid_data.map(value => {
            let state = DownloadState.complete;
            if(value.state !== DownloadState.complete){
                state = DownloadState.wait;
            }
            return {
                thumb_img: value.thumb_img,
                video_id: value.video_id,
                title: value.title,
                state: state
            };
        });
        await window.electronAPI.invoke('download:saveItems', items);
    },
    /**
     * 
     * @param {{video_id:string, title:string, thumb_img:string}[]} items 
     */
    async addDownloadItems(items) {
        for(const item of items){
            /** @type {RegDownloadItem[]} */
            const dv_items = await this.nico_grid_obs.triggerReturn("get-items");
            const fd_item = dv_items.find(value=>{
                return value.video_id == item.video_id;
            });
            if(fd_item===undefined){
                item["state"] = DownloadState.wait;
                item["progress"] = "";
                await this.nico_grid_obs.triggerReturn("add-items", {
                    items: [item]
                });
            }else{
                await this.nico_grid_obs.triggerReturn("delete-items", {
                    ids: [fd_item.video_id]
                });
                fd_item["state"] = DownloadState.wait;
                fd_item["progress"] = "";
                await this.nico_grid_obs.triggerReturn("add-items", {
                    items: [fd_item]
                });
            }
        }

        await this.onChangeDownloadItem(); 
    },
    /**
     * 
     * @param {string[]} video_ids 
     */
    async deleteDownloadItems(video_ids) {
        if(this.downloading){
            await window.electronAPI.invoke(
                'showErrorMsgBox' ,`ダウンロード中`);
        }else{
            await this.nico_grid_obs.triggerReturn("delete-items", {
                ids: video_ids
            });
        }
        const videoId = video_ids[0];
        window.electronAPI.invoke('download:deleteMark', videoId);
        await this.onChangeDownloadItem();
    },
    /**
     * 
     * @param {number} state 
     */
    async clearDownloadItems(state) {
        const items = await this.nico_grid_obs.triggerReturn("get-items");
        const del_ids = items.filter(item => {
            return item.state === state;
        }).map(item => {
            return item.video_id;
        });
        await this.nico_grid_obs.triggerReturn("delete-items", {
            ids: del_ids
        });
        await this.onChangeDownloadItem();
    },
    /**
     * ダウンロード待ち、状態更新
     * @param {number} wait_time 
     * @param {string} video_id
     * @param {()=>Promise<boolean>} do_cancel 
     */
    async wait(wait_time, video_id, do_cancel) {
        for (let index = wait_time; index >= 0; index--) {
            if(await do_cancel()){
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props:{
                    progress: `待機中 ${index}秒`, 
                    state: DownloadState.wait
                }
            });
        }   
    },
    async startDownload() {
        const wait_time = 10;

        /** @type {string} */
        let video_id = null;
        try {
            this.cancel_download = false;
            /** @type {RegDownloadItem[]} */
            const donwload_items = await this.nico_grid_obs.triggerReturn("get-items");
            for(const item of donwload_items){
                if(item.state == DownloadState.complete){
                    continue;
                }
                if(item.state == DownloadState.downloading){
                    continue;
                }

                video_id = item.video_id;
                await this.wait(wait_time, video_id, async ()=>{ 
                    const has_item = await this.nico_grid_obs.triggerReturn("has-item", {
                        id: video_id
                    });
                    return this.cancel_download || !has_item;
                });
                const has_item = await this.nico_grid_obs.triggerReturn("has-item", {
                    id: video_id
                });
                if(!has_item){
                    continue;
                }
                if(this.cancel_download){
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: "キャンセル", 
                            state: DownloadState.wait
                        }
                    });
                    break;
                }
                this.downloading = true;
                await window.electronAPI.invoke('download:startDownload', video_id);
                await this.onChangeDownloadItem();
                this.downloading = false;
            }
        } catch (error) {
            logger.error(`download video_id=${video_id}: `, error);
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: error.message
            });
        } finally {
            this.event_em.emit("download-end");
            this.downloading = false;
        }    
    }
};
