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
            margin-right: 5px;
        }

        .download-button.clear {
            margin-left: 100px;
        } 

        .download-control-container{
            display: flex;
            width: 100%;
            height: var(--control-height);
            padding: 3px;
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
            height: calc(100vh - var(--control-height));
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
        <button class="download-button" disabled={this.dl_disabled} onclick={onclickStartDownload}>開始</button>
        <button class="download-button" onclick={onclickStopDownload}>停止</button>
        <button class="download-button clear" onclick={onclickClearDownloadedItems}>クリア</button>
        <div class="schedule-container">
            <div class="label center-hv">{this.download_schedule_label}</div>
            <button class="download-button" disabled={this.dl_disabled} title="ダウンロードの定期実行日時を設定する" 
                onclick={onclickScheduleDialog}>設定</button>
        </div>
    </div>
    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>
    <download-schedule-dialog ref="schedule-dialog" ></download-schedule-dialog>

    <script>
        /* globals */
        const EventEmitter = window.EventEmitter;
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { NicoDownloader } = window.NicoDownloader;
        const { GridTableDownloadItem } = window.GridTableDownloadItem;
        const { ScheduledTask } = window.ScheduledTask;
        const { showMessageBox } = window.RemoteDailog;
        const { BookMark } = window.BookMark;
        const { ConfigRenderer } = window.ConfigRenderer;
        const { DataIpcRenderer } = window.DataIpc;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        const main_store = window.storex.get("main");

        let donwload_schedule = null;

        const updateDonwloadScheduleLabel = () =>{
            const enable = donwload_schedule.enable;
            if(enable==false){
                this.download_schedule_label = "ダウンロード実行 なし";
            }else{
                const date = donwload_schedule.date;
                const hour = ("0" + date.hour).slice(-2);
                const minute = ("0" + date.minute).slice(-2);
                this.download_schedule_label = `ダウンロード実行 ${hour}:${minute}`;
            }      
            this.update();
        };

        let wait_time = 10;
        if(process.env.NODE_ENV == "DEBUG"){
            wait_time = 1;
        }

        const donwload_state = Object.freeze({
            wait: 0,
            downloading: 1,
            complete: 2,
            error: 3
        });

        const message_map = new Map([
            [donwload_state.wait, "待機"],
            [donwload_state.downloading, "ダウンロード中"],
            [donwload_state.complete, "ダウンロード完了"],
            [donwload_state.error, "ダウンロード失敗"],
        ]);

        const getDlStateClass = (state) => {
            if(state==donwload_state.complete){
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
        event_em.on("donwload-start", ()=>{
            this.dl_disabled = "disabled";
            this.update();
        });
        event_em.on("donwload-end", ()=>{
            this.dl_disabled = "";
            this.update();
        });

        let scheduled_task = null;
        let grid_table_dl = null;
        let nico_down = null;
        let cancel_donwload = false;

        this.onclickStartDownload = async(e) => {
            scheduled_task.stop();

            await startDownload();

            if(donwload_schedule.enable==true){
                scheduled_task.start();
            }
        };

        this.onclickStopDownload = (e) => {
            if(nico_down){
                nico_down.cancel();
            }
            cancel_donwload = true;

            if(process.env.NODE_ENV == "DEBUG"){
                obs.trigger("main-page:cancel-download");
            }
        };

        this.onclickClearDownloadedItems = async () => {
            await clearDownloadItems(donwload_state.complete);
        }; 

        this.onclickScheduleDialog = () => {
            const date = donwload_schedule.date;
            const enable = donwload_schedule.enable;
            this.refs["schedule-dialog"].showModal(date, enable, result=>{
                if(result.type=="ok"){
                    ConfigRenderer.set("donwload.schedule", {
                        date:result.date,
                        enable:result.enable
                    });
                    donwload_schedule.date = result.date;
                    donwload_schedule.enable = result.enable;
                    
                    if(donwload_schedule.enable==true){
                        scheduled_task.stop();
                        scheduled_task = new ScheduledTask(donwload_schedule.date, ()=>{
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

        const resizeGridTable = () => {
            const container = this.root.querySelector(".download-grid-container");
            grid_table_dl.resizeFitContainer(container);
        };

        const onChangeDownloadItem = async () => {
            const items = grid_table_dl.getData().map(value => {
                let state = donwload_state.complete;
                if(value.state !== donwload_state.complete){
                    state = donwload_state.wait;
                }
                return {
                    thumb_img: value.thumb_img,
                    id: value.id,
                    name: value.name,
                    state: state
                };
            });
            await DataIpcRenderer.action("downloaditem", "updateData", {items});
        };

        const addDownloadItems = async (items) => {
            grid_table_dl.addItems(items, donwload_state.wait);

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
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id : video_id,
                        time : 0
                    });
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
                }},
                { label: "削除", async click() {
                    const deleted_ids = grid_table_dl.deleteSelectedItems();
                    await deleteDownloadItems(deleted_ids);
                }},
                { label: "ブックマーク", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.name, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        const wait = async (do_cancel, on_progress) => {
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
            const download_dir = await ConfigRenderer.get("download.dir", "");
            event_em.emit("donwload-start");
            try {
                cancel_donwload = false;
                const first_item = grid_table_dl.getItemByIdx(0);
                if(!first_item){
                    event_em.emit("donwload-end");
                    return;
                }

                let video_id = first_item.id;
                while(!cancel_donwload){
                    if(!grid_table_dl.canDownload(video_id, [donwload_state.wait, donwload_state.error])){
                        video_id = grid_table_dl.getNextVideoID(video_id);
                        if(video_id===undefined){
                            break;
                        }
                        if(video_id===false){
                            continue;
                        }   
                    }

                    await wait(()=>{ 
                        return cancel_donwload || !grid_table_dl.hasItem(video_id);
                    }, (progress)=>{ 
                        grid_table_dl.updateItem(video_id, {
                            progress: progress, 
                            state: donwload_state.wait
                        });
                    });

                    if(!grid_table_dl.hasItem(video_id)){
                        video_id = grid_table_dl.getNextVideoID(video_id);
                        if(video_id===undefined){
                            break;
                        }
                        continue;
                    }
                    if(cancel_donwload){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: donwload_state.wait
                        });
                        break;
                    }

                    nico_down = new NicoDownloader(video_id, download_dir);
                    const result = await nico_down.download((progress)=>{
                        grid_table_dl.updateItem(video_id, {
                            progress: `${progress}`, 
                            state: donwload_state.downloading
                        });
                    });

                    if(result.type==NicoDownloader.ResultType.complete){
                        const download_item = nico_down.getDownloadedItem();
                        await DataIpcRenderer.action("library", "addDownloadedItem", {download_item});
                        
                        const thumb_img = nico_down.nico_json.thumbImgPath;
                        grid_table_dl.updateItem(video_id, {
                            progress: "終了", 
                            state: donwload_state.complete,
                            thumb_img: thumb_img
                        });
                    }else if(result.type==NicoDownloader.ResultType.cancel){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: donwload_state.wait
                        });
                    }else if(result.type==NicoDownloader.ResultType.skip){ 
                        grid_table_dl.updateItem(video_id, {
                            progress: `スキップ: ${result.reason}`, 
                            state: donwload_state.wait
                        });
                    }else if(result.type==NicoDownloader.ResultType.error){
                        console.log("reason: ", result.reason);
                        grid_table_dl.updateItem(video_id, {
                            progress: `エラー: ${result.reason.message}`, 
                            state: donwload_state.error
                        });
                    }
               
                    await onChangeDownloadItem();

                    if(cancel_donwload){
                        break;
                    }

                    video_id = grid_table_dl.getNextVideoID(video_id);
                    if(video_id===undefined){
                        break;
                    }
                }
            } catch (error) {
                console.log(error);
                await showMessageBox("error", error.message);
            } finally {
                event_em.emit("donwload-end");
            }    
        };

        obs.on("download-page:add-download-items", async (items) => {
            await addDownloadItems(items);
        });

        obs.on("download-page:delete-download-items", async (video_ids) => {
            await deleteDownloadItems(video_ids);
        });

        this.on("mount", async () => {
            donwload_schedule = await ConfigRenderer.get("donwload.schedule", {
                date: {hour:0, minute:0},
                enable: false
            });

            grid_table_dl = new GridTableDownloadItem(
                this.root.querySelector(".download-grid"), htmlFormatter);
            
            const context_menu = createMenu();
            try {
                grid_table_dl.init((e)=>{
                    context_menu.popup({window: remote.getCurrentWindow()});
                },(e, data)=>{
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id : data.id,
                        time : 0
                    });
                });
                const items = await DataIpcRenderer.action("downloaditem", "getData");
                grid_table_dl.setData(items);
            } catch (error) {
                console.log("donwload item load error=", error);
            }

            // await onChangeDownloadItem();

            resizeGridTable();

            scheduled_task = new ScheduledTask(donwload_schedule.date, ()=>{
                startDownload();
            });
            if(donwload_schedule.enable==true){
                scheduled_task.start();
            }

            updateDonwloadScheduleLabel();
        });

        obs.on("window-resized", ()=> {
            resizeGridTable();
        });
    </script>
</download-page>