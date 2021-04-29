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
        /* globals riot logger */
        const EventEmitter = window.EventEmitter;
        const ipc = window.electron.ipcRenderer;
        const { NicoDownloader } = window.NicoDownloader;
        const { GridTableDownloadItem, DownloadState } = window.GridTableDownloadItem;
        const { Command } = window.Command;
        const { ScheduledTask } = window.ScheduledTask;

        const obs = this.opts.obs; 
        this.obs_schedule = riot.observable();

        let download_schedule = null;

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

        const cancelDownload = () => {
            if(nico_down){
                try {
                    nico_down.cancel();
                } catch (error) {
                    if(!error.cancel){
                        throw error;
                    }
                }
            }
        };

        this.onclickStartDownload = async(e) => {
            scheduled_task.stop();

            await startDownload();

            if(download_schedule.enable==true){
                scheduled_task.start();
            }
        };

        this.onclickStopDownload = (e) => {
            cancelDownload();
            cancel_download = true;
        };

        this.onclickClearDownloadedItems = async () => {
            await clearDownloadItems(DownloadState.complete);
        }; 

        const onChangeDownloadItem = async () => {
            const items = grid_table_dl.getData().map(value => {
                let state = DownloadState.complete;
                if(value.state !== DownloadState.complete){
                    state = DownloadState.wait;
                }
                return {
                    thumb_img: value.thumb_img,
                    id: value.id,
                    title: value.title,
                    state: state
                };
            });
            await ipc.invoke("download:updateItems", { items });
        };

        const addDownloadItems = async (items) => {
            grid_table_dl.addItems(items, DownloadState.wait);

            await onChangeDownloadItem(); 
        };

        const deleteDownloadItems = async (video_ids) => {
            if(nico_down!=null){
                const del_ids = video_ids.filter(video_id=>{
                    return video_id != nico_down.video_id;
                });
                grid_table_dl.deleteItems(del_ids); 

                if(video_ids.includes(nico_down.video_id)){
                    cancelDownload();

                    await ipc.invoke("app:show-message-box", {
                        type:"info",
                        message:`${nico_down.video_id}のダウンロードをキャンセル`,
                        okcancel:false
                    });
                }
            }else{
                grid_table_dl.deleteItems(video_ids); 
            }

            await onChangeDownloadItem();
        };

        const clearDownloadItems = async (state) => {
            grid_table_dl.clearItems(state);

            await onChangeDownloadItem();
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
            const download_dir = await ipc.invoke("config:get", { key:"download.dir", value:"" });
            event_em.emit("download-start");

            let wait_time = await ipc.invoke("config:get", { key:"download.wait_time", value:10 });
            if(!wait_time || wait_time <= 0){
                wait_time = 10;
            }

            let video_id = null;
            try {
                cancel_download = false;
                while(!cancel_download){
                    video_id = grid_table_dl.getNext(video_id);
                    if(!video_id){
                        break;
                    }

                    await wait(wait_time, ()=>{ 
                        return cancel_download || !grid_table_dl.hasItem(video_id);
                    }, (progress)=>{ 
                        grid_table_dl.updateItem(video_id, {
                            progress: progress, 
                            state: DownloadState.wait
                        });
                    });

                    if(!grid_table_dl.hasItem(video_id)){
                        continue;
                    }
                    
                    if(cancel_download){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: DownloadState.wait
                        });
                        break;
                    }

                    nico_down = new NicoDownloader(video_id, download_dir);
                    const result = await nico_down.download((progress)=>{
                        grid_table_dl.updateItem(video_id, {
                            progress: `${progress}`, 
                            state: DownloadState.downloading
                        });
                    });

                    if(result.type==NicoDownloader.ResultType.complete){
                        const download_item = nico_down.getDownloadedItem();
                        await ipc.invoke("library:addDownloadItem", {download_item});
                        
                        grid_table_dl.updateItem(video_id, {
                            progress: "終了", 
                            state: DownloadState.complete
                        });
                        logger.debug(`download complete id=${video_id}`);
                    }else if(result.type==NicoDownloader.ResultType.cancel){
                        grid_table_dl.updateItem(video_id, {
                            progress: "キャンセル", 
                            state: DownloadState.wait
                        });
                        logger.debug(`download cancel id=${video_id}`);
                    }else if(result.type==NicoDownloader.ResultType.skip){ 
                        grid_table_dl.updateItem(video_id, {
                            progress: `スキップ: ${result.reason}`, 
                            state: DownloadState.wait
                        });
                        logger.debug(`download skip id=${video_id}: `, result.reason);
                    }else if(result.type==NicoDownloader.ResultType.error){ 
                        grid_table_dl.updateItem(video_id, {
                            progress: `エラー: ${result.reason.message}`, 
                            state: DownloadState.error
                        });
                        logger.debug(`download id=${video_id}: `, result.reason);
                    }
               
                    await onChangeDownloadItem();
                    nico_down = null;
                }
            } catch (error) {
                logger.error(`download id=${video_id}: `, error);
                await ipc.invoke("app:show-message-box", {
                    type:"error",
                    message:error.message
                });
            } finally {
                event_em.emit("download-end");
                nico_down = null;
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
            download_schedule = await ipc.invoke("config:get", { 
                key:"download.schedule", 
                value:  {
                    date: {hour:0, minute:0},
                    enable: false
                }
            });
            this.obs_schedule.trigger("set-params", download_schedule);
            this.obs_schedule.on("change-params", (args) => {
                const { date, enable } = args;

                ipc.invoke("config:set", { 
                    key:"download.schedule", 
                    value: {
                        date: date,
                        enable: enable
                    }
                }).then();

                download_schedule.date = date;
                download_schedule.enable = enable;

                if(enable==true){
                    scheduled_task.stop();
                    scheduled_task = new ScheduledTask(download_schedule.date, startDownload);
                    scheduled_task.start();
                }else{
                    scheduled_task.stop();
                }
            });

            const grid_container = this.root.querySelector(".download-grid");
            grid_table_dl = new GridTableDownloadItem(grid_container);

            try {
                grid_table_dl.onContextMenu(async e=>{
                    const items = grid_table_dl.grid_table.getSelectedDatas();
                    if(items.length==0){
                        return;
                    }

                    const menu_id = await ipc.invoke("app:popup-download-contextmenu", {items});
                    if(!menu_id){
                        return;
                    }
                    if(menu_id=="delete"){
                        const ret = await ipc.invoke("app:show-message-box", {
                            type:"info",
                            message:"削除しますか?",
                            okcancel:true
                        });
                        if(!ret){
                            return;
                        }
                        const video_ids = items.map(value => {
                            return value.id;
                        });
                        await deleteDownloadItems(video_ids);
                    }
                });
                grid_table_dl.onDblClick((e, data)=>{
                    Command.play(data, false);
                });
                grid_table_dl.onButtonClick((e, cmd_id, data)=>{
                    if(cmd_id == "play"){
                        Command.play(data, false);
                    }
                    if(cmd_id == "stack"){
                        Command.addStackItems(obs, [data]);
                    }
                    if(cmd_id == "bookmark"){
                        Command.addBookmarkItems(obs, [data]);
                    }
                });
                grid_table_dl.onMoveRows(async ()=>{
                    await onChangeDownloadItem();
                });

                grid_table_dl.grid_table.setupResizer(".download-grid-container");
                const items = await ipc.invoke("download:getItems");
                grid_table_dl.setData(items);
            } catch (error) {
                logger.error("download item load error: ", error);
                await ipc.invoke("app:show-message-box", {
                    type: "error",
                    message: `ダウンロードリストの読み込み失敗\n${error.message}`,
                });
            }

            scheduled_task = new ScheduledTask(download_schedule.date, startDownload);
            if(download_schedule.enable==true){
                scheduled_task.start();
            }
        });
    </script>
</download-page>