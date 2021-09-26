<download-page>
    <style>
        :host {
            width: 100%;
            height: 100%;
            --control-height: 36px;
            background-color: var(--control-color);
        }

        .download-button { 
            width: 80px;
            height: 30px;
            cursor: pointer;
        }

        .download-button.start { 
            margin-right: 5px;
        }

        .download-button.clear {
            margin-left: 100px;
        } 

        .download-control-container{
            display: flex;
            width: 100%;
            height: var(--control-height);
            background-color: var(--control-color);         
        }
        
        .download-control-container .schedule-container {
            margin-left: auto;
        }

        .download-grid-container {
            width: 100%;
            height: calc(100% - var(--control-height));
            background-color: var(--control-color);
            overflow: hidden;
        }

        .download-state-complete {
            display: inline-block;
            border-radius: 2px;
            padding: 3px;
            background-color: #7fbfff;
        }
    </style>

    <div class="download-control-container">
        <button class="download-button start" disabled={dl_disabled} onclick={onclickStartDownload}>開始</button>
        <button class="download-button stop" onclick={onclickStopDownload}>停止</button>
        <button class="download-button clear" title="ダウンロード済みをクリア" onclick={onclickClearDownloadedItems}>クリア</button>
        <div class="schedule-container center-v">
            <setting-download-schedule obs={obs_schedule}></setting-download-schedule>
        </div>
    </div>
    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>

    <script>
        /* globals my_obs logger */
        export default {
            onBeforeMount(props) {
                const EventEmitter = window.EventEmitter;
                this.myapi = window.myapi;
                this.NicoDownloader = window.NicoDownloader.NicoDownloader;
                this.GridTableDownloadItem = window.GridTableDownloadItem.GridTableDownloadItem;
                this.DownloadState = window.GridTableDownloadItem.GridTableDownloadItem;
                this.Command = window.Command.Command;
                this.ScheduledTask = window.ScheduledTask.ScheduledTask;

                this.obs = props.obs; 
                this.obs_schedule = my_obs.createObs();

                this.download_schedule = null;

                this.dl_disabled = "";
                this.event_em = new EventEmitter(); 
                this.event_em.on("download-start", ()=>{
                    this.dl_disabled = "disabled";
                    this.update();
                });
                this.event_em.on("download-end", ()=>{
                    this.dl_disabled = "";
                    this.update();
                });

                this.scheduled_task = null;
                this.grid_table_dl = null;
                this.nico_down = null;
                this.cancel_download = false;

                this.obs.on("download-page:add-download-items", async (items) => {
                    await this.addDownloadItems(items);
                });

                this.obs.on("download-page:delete-download-items", async (video_ids) => {
                    await this.deleteDownloadItems(video_ids);
                });
            },
            async onMounted() {
                this.download_schedule = await this.myapi.ipc.Config.get("download.schedule", {
                    date: {hour:0, minute:0},
                    enable: false
                });
                this.obs_schedule.trigger("set-params", this.download_schedule);
                this.obs_schedule.on("change-params", (args) => {
                    const { date, enable } = args;

                    this.myapi.ipc.Config.set("download.schedule", {
                        date: date,
                        enable: enable
                    }).then();

                    this.download_schedule.date = date;
                    this.download_schedule.enable = enable;

                    if(enable==true){
                        this.scheduled_task.stop();
                        this.scheduled_task = new this.ScheduledTask(this.download_schedule.date, this.startDownload);
                        this.scheduled_task.start();
                    }else{
                        this.scheduled_task.stop();
                    }
                });

                const grid_container = this.root.querySelector(".download-grid");
                this.grid_table_dl = new this.GridTableDownloadItem(grid_container);

                try {
                    this.grid_table_dl.onContextMenu(async e=>{
                        const items = this.grid_table_dl.grid_table.getSelectedDatas();
                        if(items.length==0){
                            return;
                        }

                        const menu_id = await this.myapi.ipc.popupContextMenu("download", {items});
                        if(!menu_id){
                            return;
                        }
                        if(menu_id=="delete"){
                            const ret = await this.myapi.ipc.Dialog.showMessageBox({
                                message: "削除しますか?", 
                                okcancel: true
                            });
                            if(!ret){
                                return;
                            }
                            const video_ids = items.map(value => {
                                return value.id;
                            });
                            await this.deleteDownloadItems(video_ids);
                        }
                    });
                    this.grid_table_dl.onDblClick((e, data)=>{
                        this.Command.play(data, false);
                    });
                    this.grid_table_dl.onButtonClick((e, cmd_id, data)=>{
                        if(cmd_id == "play"){
                            this.Command.play(data, false);
                        }
                        if(cmd_id == "stack"){
                            this.Command.addStackItems(this.obs, [data]);
                        }
                        if(cmd_id == "bookmark"){
                            this.Command.addBookmarkItems(this.obs, [data]);
                        }
                    });
                    this.grid_table_dl.onMoveRows(async ()=>{
                        await this.onChangeDownloadItem();
                    });

                    this.grid_table_dl.grid_table.setupResizer(".download-grid-container");
                    const items = await this.myapi.ipc.Download.getItems();
                    this.grid_table_dl.setData(items);
                } catch (error) {
                    logger.error("download item load error: ", error);
                    await this.myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: `ダウンロードリストの読み込み失敗\n${error.message}`
                    });
                }

                this.scheduled_task = new this.ScheduledTask(this.download_schedule.date, this.startDownload);
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
            async onclickStartDownload(e) {
                this.scheduled_task.stop();

                await this.startDownload();

                if(this.download_schedule.enable==true){
                    this.scheduled_task.start();
                }
            },
            onclickStopDownload(e) {
                this.cancelDownload();
                this.cancel_download = true;
            },
            async onclickClearDownloadedItems() {
                await this.clearDownloadItems(this.DownloadState.complete);
            },
            async onChangeDownloadItem() {
                const items = this.grid_table_dl.getData().map(value => {
                    let state = this.DownloadState.complete;
                    if(value.state !== this.DownloadState.complete){
                        state = this.DownloadState.wait;
                    }
                    return {
                        thumb_img: value.thumb_img,
                        id: value.id,
                        title: value.title,
                        state: state
                    };
                });
                await this.myapi.ipc.Download.updateItems(items);
            },
            async addDownloadItems(items) {
                this.grid_table_dl.addItems(items, this.DownloadState.wait);

                await this.onChangeDownloadItem(); 
            },
            async deleteDownloadItems(video_ids) {
                if(this.nico_down!=null){
                    const del_ids = video_ids.filter(video_id=>{
                        return video_id != this.nico_down.video_id;
                    });
                    this.grid_table_dl.deleteItems(del_ids); 

                    if(video_ids.includes(this.nico_down.video_id)){
                        this.cancelDownload();

                        await this.myapi.ipc.Dialog.showMessageBox({
                            message: `${this.nico_down.video_id}のダウンロードをキャンセル`
                        });
                    }
                }else{
                    this.grid_table_dl.deleteItems(video_ids); 
                }

                await this.onChangeDownloadItem();
            },
            async clearDownloadItems(state) {
                this.grid_table_dl.clearItems(state);

                await this.onChangeDownloadItem();
            },
            async wait(wait_time, do_cancel, on_progress) {
                for (let index = wait_time; index >= 0; index--) {
                    if(do_cancel()){
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    on_progress(`待機中 ${index}秒`);
                }   
            },
            async startDownload() {
                // TODO check exist download_dir
                const download_dir = await this.myapi.ipc.Config.get("download.dir", "");
                this.event_em.emit("download-start");

                let wait_time = await this.myapi.ipc.Config.get("download.wait_time", 10);
                if(!wait_time || wait_time <= 0){
                    wait_time = 10;
                }

                let video_id = null;
                try {
                    this.cancel_download = false;
                    while(!this.cancel_download){
                        video_id = this.grid_table_dl.getNext(video_id);
                        if(!video_id){
                            break;
                        }

                        await this.wait(wait_time, ()=>{ 
                            return this.cancel_download || !this.grid_table_dl.hasItem(video_id);
                        }, (progress)=>{ 
                            this.grid_table_dl.updateItem(video_id, {
                                progress: progress, 
                                state: this.DownloadState.wait
                            });
                        });

                        if(!this.grid_table_dl.hasItem(video_id)){
                            continue;
                        }
                        
                        if(this.cancel_download){
                            this.grid_table_dl.updateItem(video_id, {
                                progress: "キャンセル", 
                                state: this.DownloadState.wait
                            });
                            break;
                        }

                        this.nico_down = new this.NicoDownloader(video_id, download_dir);
                        const result = await this.nico_down.download((progress)=>{
                            this.grid_table_dl.updateItem(video_id, {
                                progress: `${progress}`, 
                                state: this.DownloadState.downloading
                            });
                        });

                        if(result.type==this.NicoDownloader.ResultType.complete){
                            const download_item = this.nico_down.getDownloadedItem();
                            await this.myapi.ipc.Library.addDownloadItem(download_item);

                            this.grid_table_dl.updateItem(video_id, {
                                progress: "終了", 
                                state: this.DownloadState.complete
                            });
                            logger.debug(`download complete id=${video_id}`);
                        }else if(result.type==this.NicoDownloader.ResultType.cancel){
                            this.grid_table_dl.updateItem(video_id, {
                                progress: "キャンセル", 
                                state: this.DownloadState.wait
                            });
                            logger.debug(`download cancel id=${video_id}`);
                        }else if(result.type==this.NicoDownloader.ResultType.skip){ 
                            this.grid_table_dl.updateItem(video_id, {
                                progress: `スキップ: ${result.reason}`, 
                                state: this.DownloadState.wait
                            });
                            logger.debug(`download skip id=${video_id}: `, result.reason);
                        }else if(result.type==this.NicoDownloader.ResultType.error){ 
                            this.grid_table_dl.updateItem(video_id, {
                                progress: `エラー: ${result.reason.message}`, 
                                state: this.DownloadState.error
                            });
                            logger.debug(`download id=${video_id}: `, result.reason);
                        }
                
                        await this.onChangeDownloadItem();
                        this.nico_down = null;
                    }
                } catch (error) {
                    logger.error(`download id=${video_id}: `, error);
                    await this.myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                } finally {
                    this.event_em.emit("download-end");
                    this.nico_down = null;
                }    
            }
        };
    </script>
</download-page>