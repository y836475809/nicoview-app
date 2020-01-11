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
        /* globals rootRequire */
        const EventEmitter = require("events");
        const { remote } = require("electron");
        const { Menu } = remote;
        const { SettingStore } = rootRequire("app/js/setting-store");
        const { NicoDownloader } = rootRequire("app/js/nico-downloader");
        const { GridTableDownloadItem } = rootRequire("app/js/gridtable-downloaditem");
        const { ScheduledTask } = rootRequire("app/js/scheduled-task");
        const { showMessageBox } = rootRequire("app/js/remote-dialogs");
        const { BookMark } = rootRequire("app/js/bookmark");
        const { obsTrigger } = rootRequire("app/js/riot-obs");

        const obs = this.opts.obs; 

        const obs_trigger = new obsTrigger(obs);
        const main_store = storex.get("main");

        const download_dir = SettingStore.getDownloadDir();

        const donwload_schedule = {
            date: SettingStore.getValue("donwload-schedule-date", {hour:0, minute:0}),
            enable: SettingStore.getValue("donwload-schedule-enable", false)
        };

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

        this.onclickClearDownloadedItems = () => {
            clearDownloadItems(donwload_state.complete);
        }; 

        this.onclickScheduleDialog = () => {
            const date = donwload_schedule.date;
            const enable = donwload_schedule.enable;
            this.refs["schedule-dialog"].showModal(date, enable, result=>{
                if(result.type=="ok"){
                    SettingStore.setValue("donwload-schedule-date", result.date);
                    SettingStore.setValue("donwload-schedule-enable", result.enable);

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

        // TODO
        const onChangeDownloadItem = () => {
            const download_Items = [];
            grid_table_dl.filterItems([
                donwload_state.wait,
                donwload_state.downloading,
                donwload_state.error,
            ]).forEach(item => {
                download_Items.push({video_id: item.id, state:"incomplete"});
            });
            grid_table_dl.filterItems([
                donwload_state.complete
            ]).forEach(item => {
                download_Items.push({video_id: item.id, state:"complete"});
            });
            main_store.action("updateDownloadItem", download_Items);
        };

        const addDownloadItems = (items) => {
            grid_table_dl.addItems(items, donwload_state.wait);

            onChangeDownloadItem(); 
        };

        const deleteDownloadItems = (video_ids) => {
            if(nico_down!=null){
                if(video_ids.includes(nico_down.video_id)){
                    nico_down.cancel();
                }
            } 
            grid_table_dl.deleteItems(video_ids); 

            onChangeDownloadItem();
        };

        const clearDownloadItems = (state) => {
            grid_table_dl.clearItems(state);

            onChangeDownloadItem();
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.playOnline(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }},
                { label: "削除", click() {
                    const deleted_ids = grid_table_dl.deleteSelectedItems();
                    deleteDownloadItems(deleted_ids);
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
                        const item = nico_down.getDownloadedItem();
                        // obs.trigger("library-page:add-item", item); 
                        main_store.action("addDownloadedItem", item);
                        
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

                    grid_table_dl.save();
               
                    onChangeDownloadItem();

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

        obs.on("download-page:add-download-items", (items) => {
            addDownloadItems(items);
        });

        obs.on("download-page:delete-download-items", (video_ids) => {
            deleteDownloadItems(video_ids);
        });

        this.on("mount", () => {
            grid_table_dl = new GridTableDownloadItem(
                this.root.querySelector(".download-grid"), htmlFormatter);
            
            const context_menu = createMenu();
            try {
                grid_table_dl.init((e)=>{
                    context_menu.popup({window: remote.getCurrentWindow()});
                },(e, data)=>{
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, data.id); 
                });
            } catch (error) {
                console.log("donwload item load error=", error);
            }

            onChangeDownloadItem();

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