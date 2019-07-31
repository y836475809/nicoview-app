<bookmark-page>
    <style scoped>
        :scope {
            position: absolute;
            top: 0px;
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        .bookmark-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>    

    <!-- <div class="bookmark-sidebar"> -->
        <accordion 
            title="ブックマーク" 
            items={bookmark_data.items}
            expand={true} 
            obs={obs_bookmark}>
        </accordion>
    <!-- </div> -->
    
    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const self = this;

        const obs = this.opts.obs; 
        this.obs_bookmark = riot.observable();
        const getBookmarkIcon = () => {
            return {
                name: "fas fa-bookmark fa-lg",
                class_name: "bookmark-item"
            };
        };

        const bookmark_file_path = SettingStore.getSettingFilePath("bookmark.json");
        try {
            this.bookmark_store = new JsonStore(bookmark_file_path);
            this.bookmark_data = this.bookmark_store.load();
            this.bookmark_data.items.forEach(value => {
                value.icon = getBookmarkIcon();
            });
        } catch (error) {
            this.bookmark_data = {
                is_expand: false, 
                items: []
                // items: [{
                //     title: "sm20", 
                //     type:"video",
                //     data:{
                //         video_id:"sm20",
                //         saved: true
                //     }
                // },
                // {
                //     title: "sm30", 
                //     type:"video",
                //     data:{
                //         video_id:"sm30",
                //         saved: false
                //     }
                // },
                // {
                //     title: "page1", 
                //     type:"search",
                //     data:{
                //         query: "testpage",
                //         sort_order: "-",
                //         sort_name: "startTime",
                //         search_kind: "tag",
                //         page: 5
                //     }
                // }]
            };
        }

        const getSelectedItems = async () => {
            return await new Promise((resolve, reject) => {
                self.obs_bookmark.trigger("get-selected-items", (items)=>{
                    resolve(items);
                });
            });
        };

        const getMenuEnable = (type, items) => {
            if(items.length === 0) {
                return false;
            }

            const item = items[0];
            if(type == "play"){
                if(item.type == "video"){
                    return true;
                } 
            }
            if(type == "go-to-library"){
                if(item.type == "video" && item.data.saved === true){
                    return true;
                } 
            }

            if(type == "go-to-search" && item.type == "search"){
                return true;
            }

            return false;
        };

        const context_menu = Menu.buildFromTemplate([
            { 
                id: "play",
                label: "再生", click: async () => {
                    const items = await getSelectedItems();
                    if(items.length==0){
                        return;
                    }
                    const video_id = items[0].data.video_id;
                    obs.trigger("main-page:play-by-videoid", video_id);
                }
            },
            { 
                id: "go-to-library",
                label: "ライブラリの項目へ移動", click: async () => {
                    const items = await getSelectedItems();
                    if(items.length==0){
                        return;
                    }
                    self.obs_bookmark.trigger("get-selected-items", (items)=>{
                        if(items.length==0){
                            return;
                        }
                        const video_id = items[0].data.video_id;
                        obs.trigger("main-page:select-page", "library");
                        obs.trigger("library-page:scrollto", video_id);
                    });
                }
            },
            { 
                id: "go-to-search",
                label: "ニコニコ検索のページへ移動", click: async () => {
                    const items = await getSelectedItems();
                    if(items.length==0){
                        return;
                    }
                    const cond = items[0].data;
                    obs.trigger("main-page:select-page", "search");
                    obs.trigger("search-page:search", cond);
                }
            },
            { 
                label: "削除", click() {
                    self.obs_search.trigger("delete-selected-items");
                }
            }
        ]);
        
        this.obs_bookmark.on("show-contextmenu", async (e) => {
            const items = await getSelectedItems();
            context_menu.items.forEach(menu => {
                const id = menu.id;
                menu.enabled =  getMenuEnable(id, items);
            });
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        obs.on("bookmark-page:sidebar:add-item", (item) => {
            this.obs_bookmark.trigger("add-items", [
                { 
                    title: item.title, 
                    video_id: item.video_id,
                    icon: getBookmarkIcon()
                }
            ]);
        });
    </script>
</bookmark-page>