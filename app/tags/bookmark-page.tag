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
            obs={obs_accordion}
            icon_class={icon_class}
            name={name}>
        </accordion>
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
        this.obs_accordion = riot.observable();
        this.sb_button_icon = "fas fa-chevron-left";
        this.name = "bookmark";
        this.icon_class = {
            video :  "fas fa-bookmark fa-lg fa-fw",
            search : "fas fa-search fa-lg fa-fw"
        };

        this.on("mount", async () => {
            const name = this.name;
            const items = await DataIpcRenderer.action("bookmark", "getData", { name });
            this.obs_accordion.trigger("loadData", { items });
        });

        this.obs_accordion.on("changed", async (args) => {
            const { items } = args;
            const name = this.name;
            await DataIpcRenderer.action("bookmark", "save", { name, items });
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
                        self.obs_accordion.trigger("deleteList");
                    }
                }
            ]);
        };
        
        this.obs_accordion.on("show-contextmenu", async (e, args) => {
            const { items } = args;
            const context_menu = createMenu(items, this);
            context_menu.items.forEach(menu => {
                const id = menu.id;
                menu.enabled =  getMenuEnable(id, items);
            });
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_accordion.on("item-dlbclicked", (item) => {  
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
            this.obs_accordion.trigger("addList", { items });
        });
    </script>
</bookmark-page>