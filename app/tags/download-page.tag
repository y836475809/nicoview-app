<download-page>
    <style scoped>
        :scope {
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
            display: flex;
            margin-left: auto;
        }

        .download-control-container .schedule-container .label {
            margin-right: 10px;
            user-select: none;
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
        <div class="schedule-container">
            <div class="label center-hv">{download_schedule_label}</div>
            <button class="download-button" disabled={dl_disabled} title="ダウンロードの定期実行日時を設定する" 
                onclick={onclickScheduleDialog}>設定</button>
        </div>
    </div>
    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>
    <download-schedule-dialog obs={obs_schedule_dialog}></download-schedule-dialog>

    <script>
        /* globals riot logger */
        const EventEmitter = window.EventEmitter;
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { NicoDownloader } = window.NicoDownloader;
        const { GridTableDownloadItem } = window.GridTableDownloadItem;
        const { ScheduledTask } = window.ScheduledTask;
        const { showMessageBox, showOKCancelBox } = window.RendererDailog;
        const { BookMark } = window.BookMark;
        const { IPCClient } = window.IPC;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        this.obs_schedule_dialog = riot.observable();

        let download_schedule = null;

        const updateDonwloadScheduleLabel = () =>{
            const enable = download_schedule.enable;
            if(enable==false){
                this.download_schedule_label = "ダウンロード実行 なし";
            }else{
                const date = download_schedule.date;
                const hour = ("0" + date.hour).slice(-2);
                const minute = ("0" + date.minute).slice(-2);
                this.download_schedule_label = `ダウンロード実行 ${hour}:${minute}`;
            }      
            this.update();
        };

        const download_state = Object.freeze({
            wait: 0,
            downloading: 1,
            complete: 2,
            error: 3
        });

        const message_map = new Map([
            [download_state.wait, "待機"],
            [download_state.downloading, "ダウンロード中"],
            [download_state.complete, "ダウンロード完了"],
            [download_state.error, "ダウンロード失敗"],
        ]);

        const getDlStateClass = (state) => {
            if(state==download_state.complete){
                return 'class="download-state-complete"'; // eslint-disable-line
            }

            return "";
        };

        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
            const msg = message_map.get(value);
            const class_value = getDlStateClass(value);
            const content = `<div ${class_value}>${msg}</div><div>${dataContext.progress}</div>`;
            return content;
        };

        this.dl_disabled = "";
        const event_em = new EventEmitter(); 
        event_em.on("download-start", ()=>{
            this.dl_disabled = "disabled";
            this.update();
        });
        event_em.on("download-end", ()=>{
            this.dl_disabled = "";
            this.update();
        });

        let scheduled_task = null;
        let grid_table_dl = null;
        let nico_down = null;
        let cancel_download = false;

        this.onclickStartDownload = async(e) => {
            scheduled_task.stop();

            await startDownload();

            if(download_schedule.enable==true){
                scheduled_task.start();
            }
        };

        this.onclickStopDownload = (e) => {
            if(nico_down){
                nico_down.cancel();
            }
            cancel_download = true;
        };

        this.onclickClearDownloadedItems = async () => {
            await clearDownloadItems(download_state.complete);
        }; 

        this.onclickScheduleDialog = () => {
            const date = download_schedule.date;
            const enable = download_schedule.enable;

            this.obs_schedule_dialog.trigger("show", {
                date: date,
                enable: enable,
                cb: result => {
                    if(result.type!="ok"){
                        return;
                    }
                    IPCClient.request("config", "set", { 
                        key:"download.schedule", 
                        value: {
                            date:result.date,
                            enable:result.enable
                        }
                    }).then();
                    download_schedule.date = result.date;
                    download_schedule.enable = result.enable;
                    
                    if(download_schedule.enable==true){
                        scheduled_task.stop();
                        scheduled_task = new ScheduledTask(download_schedule.date, ()=>{
                            startDownload();
                        });
                        scheduled_task.start();
                    }else{
                        scheduled_task.stop();
                    }

                    updateDonwloadScheduleLabel();
                }
            });
        };

        const onChangeDownloadItem = async () => {
            const items = grid_table_dl.getData().map(value => {
                let state = download_state.complete;
                if(value.state !== download_state.complete){
                    state = download_state.wait;
                }
                return {
                    thumb_img: value.thumb_img,
                    id: value.id,
                    name: value.name,
                    state: state
                };
            });
            await IPCClient.request("downloaditem", "updateData", {items});
        };

        const addDownloadItems = async (items) => {
            grid_table_dl.addItems(items, download_state.wait);

            await onChangeDownloadItem(); 
        };

        const deleteDownloadItems = async (video_ids) => {
            if(nico_down!=null){
                if(video_ids.includes(nico_down.video_id)){
                    nico_down.cancel();
                }
            } 
            grid_table_dl.deleteItems(video_ids); 

            await onChangeDownloadItem();
        };

        const clearDownloadItems = async (state) => {
            grid_table_dl.clearItems(state);

            await onChangeDownloadItem();
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                        video_id : video_id,
                        time : 0,
                        online: false
                    });
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                        video_id: video_id,
                        time: 0,
                        online: true
                    });
                }},
                { label: "後で見る", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const stack_items = items.map(item => {
                        return {
                            id: item.id,
                            name: item.name, 
                            thumb_img:item.thumb_img
                        };
                    });
                    obs.trigger("play-stack-page:add-items", {items:stack_items});
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.name, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }},
                { type: "separator" },
                { label: "削除", async click() {
                    if(!await showOKCancelBox("info", "削除しますか?")){
                        return;
                    }
                    const deleted_ids = grid_table_dl.deleteSelectedItems();
                    await deleteDownloadItems(deleted_ids);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const wait = async (wait_time, do_cancel, on_progress) => {
            for (let index = wait_time; index >= 0; index--) {
                if(do_cancel()){
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                on_progress(`待機中 ${index}秒`);
            }   
        };

        const startDownload = async() => {
            // TODO check exist download_dir
            const download_dir = await IPCClient.request("config", "get", { key:"download.dir", value:"" });
            event_em.emit("download-start");

            let wait_time = await IPCClient.request("config", "get", { key:"download.wait_time", value:10 });
            if(!wait_time || wait_time <= 0){
                wait_time = 10;
            }

            let video_id = null;
            try {
                cancel_download = false;
                const first_item = grid_table_dl.getItemByIdx(0);
                if(!first_item){
                    event_em.emit("download-end");
                    return;
                }

                video_id = first_item.id;
                while(!cancel_download){
                    if(!grid_table_dl.canDownload(video_id, [download_state.wait, download_state.error])){
                        video_id = grid_table_dl.getNextVideoID(video_id);
                        if(video_id===undefined){
                            break;
                        }
                        if(video_id===false){
                            continue;
                        }   
                    }

                    await wait(wait_time, ()=>{ 
                        return cancel_download || !grid_table_dl.hasItem(video_id);
                    }, (progress)=>{ 
                        grid_table_dl.updateItem(video_id, {
                            progress: progress, 
                            state: download_state.wait
                        });
                    });

                    if(!grid_table_dl.hasItem(video_id)){
                        video_id = grid_table_dl.getNextVideoID(video_id);
                        if(video_id===undefined){
                            break;
                        }
                        continue;
                    }
                    if(cancel_download){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: download_state.wait
                        });
                        break;
                    }

                    nico_down = new NicoDownloader(video_id, download_dir);
                    const result = await nico_down.download((progress)=>{
                        grid_table_dl.updateItem(video_id, {
                            progress: `${progress}`, 
                            state: download_state.downloading
                        });
                    });

                    if(result.type==NicoDownloader.ResultType.complete){
                        const download_item = nico_down.getDownloadedItem();
                        await IPCClient.request("library", "addDownloadedItem", {download_item});
                        
                        grid_table_dl.updateItem(video_id, {
                            progress: "終了", 
                            state: download_state.complete
                        });
                        logger.debug(`download complete id=${video_id}`);
                    }else if(result.type==NicoDownloader.ResultType.cancel){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: download_state.wait
                        });
                        logger.debug(`download cancel id=${video_id}`);
                    }else if(result.type==NicoDownloader.ResultType.skip){ 
                        grid_table_dl.updateItem(video_id, {
                            progress: `スキップ: ${result.reason}`, 
                            state: download_state.wait
                        });
                        logger.debug(`download skip id=${video_id}: `, result.reason);
                    }else if(result.type==NicoDownloader.ResultType.error){ 
                        grid_table_dl.updateItem(video_id, {
                            progress: `エラー: ${result.reason.message}`, 
                            state: download_state.error
                        });
                        logger.debug(`download id=${video_id}: `, result.reason);
                    }
               
                    await onChangeDownloadItem();

                    if(cancel_download){
                        break;
                    }

                    video_id = grid_table_dl.getNextVideoID(video_id);
                    if(video_id===undefined){
                        break;
                    }
                }
            } catch (error) {
                logger.error(`download id=${video_id}: `, error);
                await showMessageBox("error", error.message);
            } finally {
                event_em.emit("download-end");
            }    
        };

        obs.on("download-page:add-download-items", async (items) => {
            await addDownloadItems(items);
        });

        obs.on("download-page:delete-download-items", async (video_ids) => {
            await deleteDownloadItems(video_ids);
        });

        obs.on("css-loaded", () => {
            grid_table_dl.grid_table.resizeGrid();
        });

        this.on("mount", async () => {
            download_schedule = await IPCClient.request("config", "get", { 
                key:"download.schedule", 
                value:  {
                    date: {hour:0, minute:0},
                    enable: false
                }
            });

            grid_table_dl = new GridTableDownloadItem(".download-grid", htmlFormatter);
            
            const context_menu = createMenu();
            try {
                grid_table_dl.init((e)=>{
                    context_menu.popup({window: remote.getCurrentWindow()});
                },(e, data)=>{
                    ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                        video_id : data.id,
                        time : 0,
                        online: false
                    });
                });
                grid_table_dl.grid_table.setupResizer(".download-grid-container");
                const items = await IPCClient.request("downloaditem", "getData");
                grid_table_dl.setData(items);
            } catch (error) {
                logger.error("download item load error: ", error);
                obs.trigger("main-page:toastr", {
                    type: "error",
                    title: "ダウンロードリストの読み込み失敗",
                    message: error.message,
                });
            }

            // await onChangeDownloadItem();

            scheduled_task = new ScheduledTask(download_schedule.date, ()=>{
                startDownload();
            });
            if(download_schedule.enable==true){
                scheduled_task.start();
            }

            updateDonwloadScheduleLabel();
        });
    </script>
</download-page>