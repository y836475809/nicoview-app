<bookmark-page>
    <style scoped>
        :scope {
            --page-width: 300px;
        }

        .sidebar {
            width: var(--page-width);
            height: 100%;
        }

        .content {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }

        .bookmark-item {
            color:royalblue;
        }

        .listview-menu-container {
            width: 100%;
            height: calc(100% - var(--menubar-height) - 5px);
            overflow: auto;
        }
    </style>    

    <aside class="sidebar">
        <listview class="content"
            title="ブックマーク" 
            obs={obs_listview}
            icon_class={icon_class}
            name={name}>
        </listview>
    </aside>

    <script>
        /* globals riot */
        const {remote, ipcRenderer} = window.electron;
        const {Menu} = remote;
        const { BookMark } = window.BookMark;
        const { DataIpcRenderer } = window.DataIpc;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const time_format = window.TimeFormat;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.sb_button_icon = "fas fa-chevron-left";
        this.name = "bookmark";
        this.icon_class = {
            video :  "fas fa-bookmark fa-lg fa-fw",
            search : "fas fa-search fa-lg fa-fw"
        };

        this.on("mount", async () => {
            // TODO error対応
            const name = this.name;
            const items = await DataIpcRenderer.action("bookmark", "getData", { name });
            this.obs_listview.trigger("loadData", { items });
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            const name = this.name;
            await DataIpcRenderer.action("bookmark", "update", { name, items });
        });

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

        const createMenu = (items, self) => {
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
                        self.obs_listview.trigger("deleteList");
                    }
                }
            ]);
        };
        
        this.obs_listview.on("show-contextmenu", async (e, args) => {
            const { items } = args;
            const context_menu = createMenu(items, this);
            context_menu.items.forEach(menu => {
                const id = menu.id;
                menu.enabled =  getMenuEnable(id, items);
            });
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_listview.on("item-dlbclicked", (item) => {  
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
            items.forEach(item => {
                const time = item.data.time;
                if (time > 0) {
                    item.title = `${item.title} ${time_format.toTimeString(time)}`;
                }
            });
            this.obs_listview.trigger("addList", { items });
        });
    </script>
</bookmark-page>