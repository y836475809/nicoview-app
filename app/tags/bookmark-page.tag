<bookmark-page>
    <style scoped>
        :scope {
            --page-width: 300px;
        }

        .sidebar {
            width: var(--page-width);
            max-height: calc(100vh 
                - var(--right-sidebar-page-top) - 30px);
        }

        .content {
            width: 100%;
            background-color: var(--control-color);
        }

        .bookmark-item {
            color:royalblue;
        }
    </style>    

    <aside class="sidebar">
        <listview class="content"
            obs={obs_listview}
            icon_class={icon_class}
            name={name}
            gettitle={getTitle}>
        </listview>
    </aside>

    <script>
        /* globals riot */
        const {remote} = window.electron;
        const ipc = window.electron.ipcRenderer;
        const {Menu} = remote;
        const time_format = window.TimeFormat;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.sb_button_icon = "fas fa-chevron-left";
        this.name = "bookmark";
        this.icon_class = {
            video :  "fas fa-bookmark fa-lg"
        };

        this.getTitle = (item) => {
            const { title, data } = item;
            if(data.time>0){
                return `[${time_format.toTimeString(data.time)}] ${title}`;
            }else{
                return title;
            }
        };

        const resizeHeight = (items) => {
            const sidebar = this.root.querySelector(".sidebar");
            const content = this.root.querySelector(".content");
            const item_height = 30;
            const new_height = items.length*item_height;
            sidebar.style.height = (new_height + 35) + "px";
            content.style.height = new_height + "px";
        };

        this.on("mount", async () => {
            // TODO error対応
            const items = await ipc.invoke("bookmark:getItems");
            this.obs_listview.trigger("loadData", { items });

            resizeHeight(items);
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            await ipc.invoke("bookmark:updateItems", { items });
            resizeHeight(items);
        });

        const getMenuEnable = (type, items) => {
            if(items.length === 0) {
                return false;
            }

            if(type == "play"){
                return true;
            }
            if(type == "go-to-library"){
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
                        const online = false;
                        ipc.send("app:play-video", {
                            video_id,
                            time,
                            online
                        });
                    }
                },
                { 
                    id: "play",
                    label: "オンラインで再生", click() {
                        const { video_id, time } = items[0].data;
                        const online = true;
                        ipc.send("app:play-video", {
                            video_id,
                            time,
                            online
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
                            const exist = await ipc.invoke("library:has", {video_id});
                            if(exist===true){
                                obs.trigger("main-page:select-page", "library");
                                obs.trigger("library-page:scrollto", video_id);     
                            } 
                        })();
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
            const { video_id, time } = item.data;
            const online = false;
            ipc.send("app:play-video", {
                video_id,
                time,
                online
            });
        });
        
        obs.on("bookmark-page:add-items", items => {
            const bk_items = items.map(item => {
                return {
                    title: item.title,
                    type: "video",
                    data: {
                        video_id: item.id,
                        time: item.time
                    }
                };
            });
            this.obs_listview.trigger("addList", { items:bk_items });
        });
    </script>
</bookmark-page>