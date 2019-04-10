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

        .control-container{
            padding: 3px;
            background-color: var(--control-color);
        }
    </style>

    <div class="control-container">
        <button class="download-button" onclick={onclickStartDownload}>start</button>
        <button class="download-button" onclick={onclickStopDownload}>stop</button>
        <button class="download-button clear" onclick={onclickClearDownloadedItems}>clear</button>
    </div>
    <download-list contextmenu={this.context_menu}></download-list>

    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoNicoDownloader } = require(`${app_base_dir}/js/niconico-downloader`);

        require(`${app_base_dir}/tags/download-list.tag`);

        const library_dir = SettingStore.getLibraryDir();

        const createMenu = () => {
            const nemu_templete = [
                { label: "Play", click() {
                    //TODO
                }},
                { label: "delete", click() {
                    obs.trigger("download-list:delete-selected-items", (deleted_ids)=>{
                        if(nico_down!=null){
                            if(deleted_ids.includes(nico_down.video_id)){
                                nico_down.cancel();
                            }
                        }    
                        obs.trigger("search-page:delete-download-ids", deleted_ids);
                    });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        this.context_menu = createMenu();

        let nico_down = null;

        this.onclickStartDownload = (e) => {
            obs.trigger("start-download", async (video_id, on_progress)=>{
                nico_down = new NicoNicoDownloader(video_id, library_dir);
                const result = await nico_down.download((state)=>{
                    on_progress(state);
                });  
                if(result.state=="ok"){
                    const item = nico_down.getDownloadedItem();
                    obs.trigger("search-page:complete-download-ids", [item.video_id]);
                    obs.trigger("add-library-item", item);
                    return result.state;
                }else {
                    console.log("reason: ", result);
                    return result.state;
                }
            });
        };

        this.onclickStopDownload = (e) => {
            if(nico_down){
                nico_down.cancel();
            }
            obs.trigger("cancel-download");
        };

        this.onclickClearDownloadedItems = () => {
            obs.trigger("download-list:clear-downloaded-items");  
        };

        obs.on("download-page:add-download-items", (items) => {
            obs.trigger("download-list:add-download-items", items);  
        });

        obs.on("download-page:delete-download-items", (video_ids) => {
            if(nico_down!=null){
                if(video_ids.includes(nico_down.video_id)){
                    nico_down.cancel();
                }
            }   
            obs.trigger("download-list:delete-download-items", video_ids);  
        });

        this.on("mount", () => {
            
        });
    </script>
</download-page>