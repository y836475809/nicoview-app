const EventEmitter = require("events");
const { ipcRenderer } = require("electron");
const myapi = require("../../lib/my-api");
const { NicoDownloader } = require("../../lib/nico-downloader");
const { buttonFormatter } = require("../common/nico-grid-formatter");
const { mountNicoGrid } = require("../common/nico-grid-mount");
const { Command } = require("../../lib/command");
const { ScheduledTask } = require("../../lib/scheduled-task");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

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

module.exports = {
    state:{
        dl_disabled:""
    },

    /** @type {MyObservable} */
    obs_schedule:null,

    /** @type {DownloadSchedule} */
    download_schedule:null,

    /** @type {EventEmitter} */
    event_em:null,

    /** @type {ScheduledTask} */
    scheduled_task:null,

    /** @type {NicoDownloader} */
    nico_down:null,
    cancel_download:false,
    onBeforeMount() {
        this.obs_schedule = new MyObservable();

        this.event_em = new EventEmitter(); 
        this.event_em.on("download-start", ()=>{
            this.state.dl_disabled = "disabled";
            this.update();
        });
        this.event_em.on("download-end", ()=>{
            this.state.dl_disabled = "";
            this.update();
        });

        main_obs.on("download:add-download-items", async (items) => {
            await this.addDownloadItems(items);
        });

        main_obs.on("download:delete-download-items", async (video_ids) => {
            await this.deleteDownloadItems(video_ids);
        });
    },
    async onMounted() {
        this.download_schedule = await myapi.ipc.Config.get("download.schedule", {
            date: {hour:0, minute:0},
            enable: false
        });
        this.obs_schedule.trigger("set-params", this.download_schedule);
        this.obs_schedule.on("change-params", (args) => {
            /** @type {{date:{hour:number, minute:number}, enable:boolean}} */
            const { date, enable } = args;

            myapi.ipc.Config.set("download.schedule", {
                date: date,
                enable: enable
            }).then();

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
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", async (args) => {
            const { data } = args;
            Command.play(data, false);
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
        });
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }

            const menu_id = await myapi.ipc.popupContextMenu("download", {items});
            if(!menu_id){
                return;
            }
            if(menu_id=="delete"){
                const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
                    type: "info",
                    message: "削除しますか?"
                });
                if(!ret){
                    return;
                }
                const video_ids = items.map(value => {
                    return value.video_id;
                });
                await this.deleteDownloadItems(video_ids);
            }
        });

        try {
            const items = await myapi.ipc.Download.getItems();
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
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: `ダウンロードリストの読み込み失敗\n${error.message}`
            });
        }

        this.scheduled_task = new ScheduledTask(this.download_schedule.date, this.startDownload);
        if(this.download_schedule.enable==true){
            this.scheduled_task.start();
        }

    },
    cancelDownload() {
        if(this.nico_down){
            try {
                this.nico_down.cancel();
            } catch (error) {
                if(!error.cancel){
                    throw error;
                }
            }
        }
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
        await myapi.ipc.Download.updateItems(items);
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
        if(this.nico_down!=null){
            const del_ids = video_ids.filter(video_id=>{
                return video_id != this.nico_down.video_id;
            });
            await this.nico_grid_obs.triggerReturn("delete-items", {
                ids: del_ids
            });

            if(video_ids.includes(this.nico_down.video_id)){
                this.cancelDownload();

                await myapi.ipc.Dialog.showMessageBoxOK({
                    type: "info",
                    message: `${this.nico_down.video_id}のダウンロードをキャンセル`
                });
            }
        }else{
            await this.nico_grid_obs.triggerReturn("delete-items", {
                ids: video_ids
            });
        }

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
        // TODO check exist download_dir
        /** @type {string} */
        const download_dir = await myapi.ipc.Config.get("download.dir", "");
        this.event_em.emit("download-start");

        /** @type {number} */
        let wait_time = await myapi.ipc.Config.get("download.wait_time", 10);
        if(!wait_time || wait_time <= 0){
            wait_time = 10;
        }

        /** @type {string} */
        let video_id = null;
        try {
            const tmp_dir = await ipcRenderer.invoke("get-temp-path");
            const ffmpeg_path = await myapi.ipc.Config.get("ffmpeg_path", "");

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
                
                this.nico_down = new NicoDownloader(video_id, download_dir, tmp_dir, ffmpeg_path);
                const result = await this.nico_down.download((progress)=>{
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: `${progress}`,  
                            state: DownloadState.downloading
                        }
                    });
                });

                if(result.type==NicoDownloader.ResultType.complete){
                    const downloaded_item = this.nico_down.getDownloadedItem();
                    await myapi.ipc.Library.addDownloadItem(downloaded_item);
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: "終了", 
                            state: DownloadState.complete
                        }
                    });
                    logger.debug(`download complete video_id=${video_id}`);
                }else if(result.type==NicoDownloader.ResultType.cancel){
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: "キャンセル",  
                            state: DownloadState.wait
                        }
                    });
                    logger.debug(`download cancel video_id=${video_id}`);
                }else if(result.type==NicoDownloader.ResultType.skip){ 
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: `スキップ: ${result.reason}`,  
                            state: DownloadState.wait
                        }
                    });
                    logger.debug(`download skip video_id=${video_id}: `, result.reason);
                }else if(result.type==NicoDownloader.ResultType.error){ 
                    this.nico_grid_obs.trigger("update-item", {
                        id: video_id,
                        props:{
                            progress: `エラー: ${result.reason.message}`, 
                            state: DownloadState.error
                        }
                    });
                    logger.debug(`download video_id=${video_id}: `, result.reason);
                }

                await this.onChangeDownloadItem();
                this.nico_down = null;
            }
        } catch (error) {
            logger.error(`download video_id=${video_id}: `, error);
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: error.message
            });
        } finally {
            this.event_em.emit("download-end");
            this.nico_down = null;
        }    
    }
};
