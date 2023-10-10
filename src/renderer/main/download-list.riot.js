const EventEmitter = require("events");
const myapi = require("../../lib/my-api");
const { NicoDownloader } = require("../../lib/nico-downloader");
const { GridTableDownloadItem, DownloadState } = require("../../lib/gridtable-downloaditem");
const { Command } = require("../../lib/command");
const { ScheduledTask } = require("../../lib/scheduled-task");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

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

    /** @type {GridTableDownloadItem} */
    grid_table_dl:null,

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

        const grid_container = this.$(".download-grid");
        this.grid_table_dl = new GridTableDownloadItem(grid_container);

        try {
            this.grid_table_dl.onContextMenu(async e=>{ // eslint-disable-line no-unused-vars
                /** @type {RegDownloadItem[]} */
                const items = this.grid_table_dl.grid_table.getSelectedDatas();
                if(items.length==0){
                    return;
                }

                const menu_id = await myapi.ipc.popupContextMenu("download", {items});
                if(!menu_id){
                    return;
                }
                if(menu_id=="delete"){
                    const ret = await myapi.ipc.Dialog.showMessageBox({
                        message: "削除しますか?", 
                        okcancel: true
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
            this.grid_table_dl.onDblClick((e, data)=>{
                Command.play(data, false);
            });
            this.grid_table_dl.onButtonClick((e, cmd_id, data)=>{
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

            this.grid_table_dl.grid_table.setupResizer(".download-grid-container");
            const items = await myapi.ipc.Download.getItems();
            this.grid_table_dl.setData(items);
        } catch (error) {
            logger.error("download item load error: ", error);
            await myapi.ipc.Dialog.showMessageBox({
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
        const grid_data = this.grid_table_dl.getData();
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
        this.grid_table_dl.addItems(items, DownloadState.wait);

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
            this.grid_table_dl.deleteItems(del_ids); 

            if(video_ids.includes(this.nico_down.video_id)){
                this.cancelDownload();

                await myapi.ipc.Dialog.showMessageBox({
                    message: `${this.nico_down.video_id}のダウンロードをキャンセル`
                });
            }
        }else{
            this.grid_table_dl.deleteItems(video_ids); 
        }

        await this.onChangeDownloadItem();
    },
    /**
     * 
     * @param {number} state 
     */
    async clearDownloadItems(state) {
        this.grid_table_dl.clearItems(state);

        await this.onChangeDownloadItem();
    },
    /**
     * ダウンロード待ち、状態更新
     * @param {number} wait_time 
     * @param {string} video_id
     * @param {()=>boolean} do_cancel 
     */
    async wait(wait_time, video_id, do_cancel) {
        for (let index = wait_time; index >= 0; index--) {
            if(do_cancel()){
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.grid_table_dl.updateItem(video_id, {
                progress: `待機中 ${index}秒`, 
                state: DownloadState.wait
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
            this.cancel_download = false;
            /** @type {RegDownloadItem[]} */
            const donwload_items = this.grid_table_dl.getData();
            for(const item of donwload_items){
                if(item.state == DownloadState.complete){
                    continue;
                }
                if(item.state == DownloadState.downloading){
                    continue;
                }

                video_id = item.video_id;
                await this.wait(wait_time, video_id, ()=>{ 
                    return this.cancel_download 
                        || !this.grid_table_dl.hasItem(video_id);
                });
                if(!this.grid_table_dl.hasItem(video_id)){
                    continue;
                }
                if(this.cancel_download){
                    this.grid_table_dl.updateItem(video_id, {
                        progress: "キャンセル", 
                        state: DownloadState.wait
                    });
                    break;
                }
                
                this.nico_down = new NicoDownloader(video_id, download_dir);
                const result = await this.nico_down.download((progress)=>{
                    this.grid_table_dl.updateItem(video_id, {
                        progress: `${progress}`, 
                        state: DownloadState.downloading
                    });
                });

                if(result.type==NicoDownloader.ResultType.complete){
                    const downloaded_item = this.nico_down.getDownloadedItem();
                    await myapi.ipc.Library.addDownloadItem(downloaded_item);

                    this.grid_table_dl.updateItem(video_id, {
                        progress: "終了", 
                        state: DownloadState.complete
                    });
                    logger.debug(`download complete video_id=${video_id}`);
                }else if(result.type==NicoDownloader.ResultType.cancel){
                    this.grid_table_dl.updateItem(video_id, {
                        progress: "キャンセル", 
                        state: DownloadState.wait
                    });
                    logger.debug(`download cancel video_id=${video_id}`);
                }else if(result.type==NicoDownloader.ResultType.skip){ 
                    this.grid_table_dl.updateItem(video_id, {
                        progress: `スキップ: ${result.reason}`, 
                        state: DownloadState.wait
                    });
                    logger.debug(`download skip video_id=${video_id}: `, result.reason);
                }else if(result.type==NicoDownloader.ResultType.error){ 
                    this.grid_table_dl.updateItem(video_id, {
                        progress: `エラー: ${result.reason.message}`, 
                        state: DownloadState.error
                    });
                    logger.debug(`download video_id=${video_id}: `, result.reason);
                }
        
                await this.onChangeDownloadItem();
                this.nico_down = null;
            }
        } catch (error) {
            logger.error(`download video_id=${video_id}: `, error);
            await myapi.ipc.Dialog.showMessageBox({
                type: "error",
                message: error.message
            });
        } finally {
            this.event_em.emit("download-end");
            this.nico_down = null;
        }    
    }
};
