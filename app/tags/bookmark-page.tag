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
            expand={true} 
            obs={obs_bookmark}
            storname={storname}>
        </accordion>
    </aside>

    <script>
        /* globals riot */
        const path = window.path;
        const {remote, ipcRenderer} = window.electron;
        const {Menu} = remote;
        const JsonStore = window.JsonStore;
        const { BookMark } = window.BookMark;
        const { ConfigRenderer } = window.ConfigRenderer;
        const { DataIpcRenderer } = window.DataIpcRenderer;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        this.obs_bookmark = riot.observable();
        this.sb_button_icon = "fas fa-chevron-left";
        this.storname = "bookmark";
        const store = window.storex.get(this.storname);

        this.on("mount", async () => {
            const file_path = path.join(await ConfigRenderer.get("data_dir"), `${this.storname}.json`);
            try {
                this.json_store = new JsonStore(file_path);
                const items = this.json_store.load();
                store.commit("loadData", {items});
            } catch (error) { 
                const items = [];
                store.commit("loadData", {items});
                console.log(error);
            }
        });

        store.change("changed", (state, store) => {
            this.json_store.save(state.items);
        });

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

        const createMenu = (items) => {
            return Menu.buildFromTemplate([
                { 
                    id: "play",
                    label: "再生", click() {
                        if(items.length==0){
                            return;
                        }
                        const { video_id, time } = items[0].data;
                        ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                            video_id,
                            time
                        });
                    }
                },
                { 
                    id: "play",
                    label: "オンラインで再生", click() {
                        const { video_id, time } = items[0].data;
                        ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                            video_id,
                            time
                        });
                    }
                },
                { 
                    id: "go-to-library",
                    label: "ライブラリの項目へ移動", click() {
                        if(items.length==0){
                            return;
                        }

                        const video_id = items[0].data.video_id;
                        (async ()=>{
                            const exist = await DataIpcRenderer.action("library", "existItem", {video_id});
                            if(exist===true){
                                obs.trigger("main-page:select-page", "library");
                                obs.trigger("library-page:scrollto", video_id);     
                            } 
                        })();
                    }
                },
                { 
                    id: "go-to-search",
                    label: "ニコニコ検索のページへ移動", click() {
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
                        store.action("deleteList");
                    }
                }
            ]);
        };
        
        this.obs_bookmark.on("show-contextmenu", async (e) => {
            const items = store.getter("state").selected_items;
            const context_menu = createMenu(items);
            context_menu.items.forEach(menu => {
                const id = menu.id;
                menu.enabled =  getMenuEnable(id, items);
            });
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_bookmark.on("item-dlbclicked", (item) => {  
            if(BookMark.isVideo(item)){
                const { video_id, time } = item.data;
                ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                    video_id,
                    time
                });
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
            store.action("addList", {items});
        });
    </script>
</bookmark-page>