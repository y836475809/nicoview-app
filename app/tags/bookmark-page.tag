<bookmark-page>
    <style scoped>
        :scope {
            --page-width: 250px;
            --button-width: 30px;
            --button-height: 70px;
        }
        .sidebar {
            position: fixed;
            top: 0px;
            right: calc(-1 * var(--page-width));
            width: var(--page-width);
            height: 100%;
            z-index: 10;
            transition-property: all;
            transition-duration: 300ms;
            transition-delay: 0s;
            transition-timing-function: linear;
        }
        .sidebar > .button {
            position: relative;
            display: block;
            top: calc(50% - var(--button-height));
            left: calc(-1 * var(--button-width));   
            width: var(--button-width);
            height: var(--button-height);
            color: white;
            background-color: rgba(0, 0, 0, 0.5);
            text-align: center;
            text-decoration: none;
            line-height: var(--button-height);
            border-radius: 5px 0px 0px 5px;
        }
        .content {
            position: absolute;
            top: 0px;
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        .open {
            transform: translateX(calc(-1 * var(--page-width)));
        }
        .close {
            transform: translateX(0px);
        }
        .bookmark-item {
            color:royalblue;
        }
        .acdn-menu-container {
            width: 100%;
            height: calc(100% - var(--menubar-height) - 5px);
            overflow: auto;
        }
    </style>    

    <aside class="sidebar dialog-shadow close">
        <div class="button {sb_button_icon}" title="ブックマーク" onclick={onclickSideBar}></div>
        <accordion class="content"
            title="ブックマーク" 
            items={bookmark_data.items}
            expand={true} 
            obs={obs_bookmark}>
        </accordion>
    </aside>

    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { BookMark } = require(`${app_base_dir}/js/bookmark`);

        const self = this;

        const obs = this.opts.obs; 
        this.obs_bookmark = riot.observable();

        this.sb_button_icon = "fas fa-chevron-left";

        this.onclickSideBar = (e) => {
            const elm = this.root.querySelector(".sidebar");
            elm.classList.toggle("close");
            elm.classList.remove("open");
            if(!elm.classList.contains("close")){
                elm.classList.add("open");
                this.sb_button_icon = "fas fa-chevron-right";
            }else{
                this.sb_button_icon = "fas fa-chevron-left";
            }
        };

        const getBookmarkIcon = (item) => {
            let name = "fas fa-bookmark fa-lg fa-fw";
            if(BookMark.isSearch(item)){
                name = "fas fa-search fa-lg fa-fw";
            }
            return {
                name: name,
                class_name: "bookmark-item"
            };
        };

        const bookmark_file_path = SettingStore.getSettingFilePath("bookmark.json");
        try {
            this.bookmark_store = new JsonStore(bookmark_file_path);
            this.bookmark_data = this.bookmark_store.load();
            this.bookmark_data.items.forEach(value => {
                value.icon = getBookmarkIcon(value);
            });
        } catch (error) { 
            this.bookmark_data = {
                is_expand: false, 
                items: []
            };
            console.log(error);
        }
        this.obs_bookmark.on("state-changed", (data) => {
            try {
                this.bookmark_store.save(data);
                console.log(data);
            } catch (error) {
                console.log(error);
            }
        });

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

            if(type == "play" && BookMark.isVideo(item)){
                return true;
            }
            if(type == "go-to-library" && BookMark.isVideo(item)){
                return true;
            }
            if(type == "go-to-search" && BookMark.isSearch(item)){
                return true;
            }
            if(type == "delete"){
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

                    const video_id = items[0].data.video_id;
                    obs.trigger("library-page:exist-data-callback", { 
                        video_id: video_id, 
                        cb: (exist)=>{
                            if(exist===true){
                                obs.trigger("main-page:select-page", "library");
                                obs.trigger("library-page:scrollto", video_id);     
                            }
                        }
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
                id: "delete",
                label: "削除", click() {
                    self.obs_bookmark.trigger("delete-selected-items");
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

        this.obs_bookmark.on("item-dlbclicked", (item) => {  
            if(BookMark.isVideo(item)){
                const video_id = item.data.video_id;
                obs.trigger("main-page:play-by-videoid", video_id);
                return;
            }
            if(BookMark.isSearch(item)){
                const cond = item.data;
                obs.trigger("main-page:select-page", "search");
                obs.trigger("search-page:search", cond);
                return;
            }
        });
        
        obs.on("bookmark-page:add-items", items => {
            items.forEach(item => {
                item.icon = getBookmarkIcon(item);
            });
            this.obs_bookmark.trigger("add-items", items);
        });

    </script>
</bookmark-page>