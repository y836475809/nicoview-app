<download-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }

        .download-button { 
            margin: auto;
            width: 100px;
            height: 30px;
        }

        .download-button.clear {
            margin-left: 100px;
        } 

        .download-control-container{
            padding: 3px;
            background-color: var(--control-color);
        }

        .download-state-complete {
            display: inline-block;
            border-radius: 2px;
            padding: 3px;
            background-color: #7fbfff;
        }
    </style>

    <div class="download-control-container">
        <button class="download-button" onclick={onclickStartDownload}>start</button>
        <button class="download-button" onclick={onclickStopDownload}>stop</button>
        <button class="download-button clear" onclick={onclickClearDownloadedItems}>clear</button>
    </div>
    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>

    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoNicoDownloader } = require(`${app_base_dir}/js/niconico-downloader`);
        const { GridTableDownloadItem } = require(`${app_base_dir}/js/gridtable-downloaditem`);

        const library_dir = SettingStore.getLibraryDir();

        const wait_time = 5;
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

        let grid_table_dl = null;
        let nico_down = null;
        let cancel_donwload = false;

        this.onclickStartDownload = (e) => {
            startDownload();
        };

        this.onclickStopDownload = (e) => {
            if(nico_down){
                nico_down.cancel();
            }
            cancel_donwload = true;
        };

        this.onclickClearDownloadedItems = () => {
            grid_table_dl.clearItems(donwload_state.complete);
        }; 

        const resizeGridTable = () => {
            const container = this.root.querySelector(".download-grid-container");
            grid_table_dl.resizeFitContainer(container);
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "delete", click() {
                    const deleted_ids = grid_table_dl.deleteSelectedItems();
                    if(nico_down!=null){
                        if(deleted_ids.includes(nico_down.video_id)){
                            nico_down.cancel();
                        }
                    } 
                    obs.trigger("search-page:delete-download-ids", deleted_ids);
                }},
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
            cancel_donwload = false;
            const first_item = grid_table_dl.getItemByIdx(0);
            let video_id = first_item.id;
            while(!cancel_donwload){
                if(!grid_table_dl.canDownload(video_id, donwload_state.wait)){
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
                    grid_table_dl.updateItem(video_id, progress, donwload_state.wait);
                });

                if(!grid_table_dl.hasItem(video_id)){
                    video_id = grid_table_dl.getNextVideoID(video_id);
                    if(video_id===undefined){
                        break;
                    }
                    continue;
                }
                if(cancel_donwload){
                    grid_table_dl.updateItem(video_id, "キャンセル", donwload_state.wait);
                    break;
                }

                nico_down = new NicoNicoDownloader(video_id, library_dir);
                const result = await nico_down.download((progress)=>{
                    grid_table_dl.updateItem(video_id, `${progress}`, donwload_state.downloading);
                });

                if(result.type==NicoNicoDownloader.ResultType.complete){
                    grid_table_dl.updateItem(video_id, "終了", donwload_state.complete);
                    const item = nico_down.getDownloadedItem();
                    obs.trigger("search-page:complete-download-ids", [item.video_id]);
                    obs.trigger("add-library-item", item);   
                }else if(result.type==NicoNicoDownloader.ResultType.cancel){
                    grid_table_dl.updateItem(video_id, "キャンセル", donwload_state.wait);
                }else if(result.type==NicoNicoDownloader.ResultType.skip){ 
                    grid_table_dl.updateItem(video_id, `スキップ: ${result.reason}`, donwload_state.wait);
                }else if(result.type==NicoNicoDownloader.ResultType.error){
                    console.log("reason: ", result.reason);
                    grid_table_dl.updateItem(video_id, `エラー: ${result.reason.message}`, donwload_state.error);
                }

                grid_table_dl.save();

                if(cancel_donwload){
                    break;
                }

                video_id = grid_table_dl.getNextVideoID(video_id);
                if(video_id===undefined){
                    break;
                }
            }
        };

        obs.on("download-page:add-download-items", (items) => {
            grid_table_dl.addItems(items, donwload_state.wait);
        });

        obs.on("download-page:delete-download-items", (video_ids) => {
            if(nico_down!=null){
                if(video_ids.includes(nico_down.video_id)){
                    nico_down.cancel();
                }
            }
            grid_table_dl.deleteItems(video_ids);  
        });

        this.on("mount", () => {
            grid_table_dl = new GridTableDownloadItem(
                this.root.querySelector(".download-grid"), htmlFormatter);
            
            const context_menu = createMenu();
            try {
                grid_table_dl.init((e)=>{
                    context_menu.popup({window: remote.getCurrentWindow()});
                },(e, data)=>{
                    obs.trigger("main-page:play-by-videoid", data.id);
                });                
            } catch (error) {
                console.log("donwload item load error=", error);
            }

            resizeGridTable();
        });

        obs.on("get-download-item-callback", (cb) => { 
            const id_set = grid_table_dl.getItemIDSet();
            cb(id_set);
        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });
    </script>
</download-page>