<main-page>
    <style scoped>
        :scope {
            --main-sidebar-width: 75px;
            --margin: 5px;
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
        }

        .main-container {
            width: 100%;
            height: 100%;
            display: flex;
        }

        .page-container.left > * {
            position: absolute;
            height: calc(100% - var(--window-titlebar-height));
            width: calc(100% - var(--main-sidebar-width) * 2); 
            overflow-x: hidden;
            padding: var(--margin);
        }
        .page-container.right > * {
            position: absolute;
            top: calc(var(--window-titlebar-height) + var(--right-sidebar-page-top));
            right: calc(var(--main-sidebar-width) + var(--margin));
            /* max-height: calc(100% - var(--window-titlebar-height) - var(--right-sidebar-page-top) - 8px); */
            overflow-x: hidden; 
            overflow-y: hidden; 
            padding: var(--margin);
        }
        .page-container.right > div {
            border: 1px solid gray;
            border-radius: 5px;
            padding: 5px;
            background-color: var(--control-color);
        }

        .main-sidebar {
            width: var(--main-sidebar-width);
            height: 100%;
            background-color: #1e2229;
        }
        .main-sidebar input[type=radio] {
            display: none; 
        }
        .main-sidebar input[type=radio]:checked + .button{
            border-left: 3px solid #2C7CFF;
        }
        .main-sidebar .button {
            padding-top: 10px;
            margin: 2px;
            text-align: center;
            box-sizing: border-box;
            width: 70px;
            height: 60px;   
            display: block;
            cursor: pointer;
        }
        .main-sidebar .button-label {
            margin: 2px;
            text-align: center;
            color: white;   
            font-size: 10px;
            user-select: none;
        }
        .main-sidebar .fas {
            font-size: 24px;
            color: grey;
        }
        .main-sidebar.right {
            margin-left: auto;
        }

        .download-badge {
            position: relative;
        }
        .download-badge > .item-num {
            position: absolute;
            text-align: center;
            left: 50%;
            top: 0px;
            font-size: 12px;
            line-height: 20px;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: red;
            user-select: none;
        }
    </style>

    <div class="main-container">
        <div class="main-sidebar left">
            <label class="label">
                <input type="radio" name="page_select" class="library-radio" onclick="{onclickPageSelect.bind(this,'library')}"> 
                <div class="button">
                    <span class="center-hv fas fa-book"></span>
                    <div class="button-label">ライブラリ</div>
                </div>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="search-radio" onclick="{onclickPageSelect.bind(this,'search')}"> 
                <div class="button">
                    <span class="center-hv fas fa-search"></span> 
                    <div class="button-label">検索</div>
                </div>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="mylist-radio" onclick="{onclickPageSelect.bind(this,'mylist')}">
                <div class="button"> 
                    <span class="center-hv fas fa-list"></span> 
                    <div class="button-label">マイリスト</div>
                </div>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="download-radio" onclick="{onclickPageSelect.bind(this,'download')}"> 
                <div class="button"> 
                    <span class="download-badge center-hv">
                        <span class="fas fa-download"></span>
                        <span class="item-num">{donwnload_item_num}</span>
                    </span> 
                    <div class="button-label">ダウンロード</div>
                </div>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="play-history-radio" onclick="{onclickPageSelect.bind(this,'play-history')}"> 
                <div class="button"> 
                    <span class="center-hv fas fa-history"></span> 
                    <div class="button-label">履歴</div>
                </div>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="setting-radio" onclick="{onclickPageSelect.bind(this,'setting')}">
                <div class="button">  
                    <span class="center-hv fas fa-cog"></span> 
                    <div class="button-label">設定</div>
                </div>
            </label>     
        </div>
        <div class="page-container left">
            <library-page obs={obs}></library-page>
            <search-page obs={obs}></search-page>
            <mylist-page obs={obs}></mylist-page>
            <download-page obs={obs}></download-page>
            <play-history-page obs={obs}></play-history-page>
            <setting-page obs={obs}></setting-page>
        </div>
        <div class="page-container right">
            <div class="bookmark-page dialog-shadow">
                <bookmark-page obs={obs}></bookmark-page>
            </div>
        </div>
        <div class="main-sidebar right">
            <div class="button center-hv" onclick="{onclickShowPage.bind(this,'bookmark')}">
                <div class="button">
                    <i class="fas fa-bookmark"></i>
                    <div class="button-label">ブックマーク</div>
                </div>
            </div>
        </div>
    </div>
    <open-video-form obs={obs_open_video_form}></open-video-form>

    <script>
        /* globals riot logger */
        const { remote, ipcRenderer, shell } = window.electron;
        const {Menu} = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { IPCClient } = window.IPC;

        this.obs = this.opts.obs;
        this.obs_open_video_form = riot.observable();

        const updateDownloadBadge = async () => {
            const video_ids = await IPCClient.request("downloaditem", "getIncompleteIDs");
            const elm = this.root.querySelector(".download-badge > .item-num");
            if(video_ids.length === 0){
                elm.style.display = "none";
            }else{
                elm.style.display = "";
            }
            this.donwnload_item_num = video_ids.length;
            this.update();
        }

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            await updateDownloadBadge();
        });

        ipcRenderer.on(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        this.donwnload_item_num = 0;

        const select_page = (page_name)=>{
            Array.from(this.root.querySelectorAll(".page-container.left > *"), 
                (elm) => {
                    elm.style.zIndex = 0;
                });
            const page = this.root.querySelector(`${page_name}-page`);
            page.style.zIndex = 1;

            const radio = this.root.querySelector(`.${page_name}-radio`);
            radio.checked = true;
        };

        this.onclickPageSelect = (page_name, e) => {
            select_page(page_name);
        };

        const hideRightPage = ()=>{ 
            Array.from(this.root.querySelectorAll(".page-container.right > *"), 
                (elm) => {
                    elm.style.zIndex = -1;
                });
        };

        this.onclickShowPage = (page_name, e) => {
            const page = this.root.querySelector(`.${page_name}-page`);
            const page_zIndex = page.style.zIndex;

            hideRightPage();

            if(page_zIndex > 0){
                page.style.zIndex = -1;
            }else{
                page.style.zIndex = 2;
            }
        };

        const createMenu = (self) => {
            const menu_templete = [
                { 
                    label: "動画IDを指定して再生", 
                    click: () => {
                        self.obs_open_video_form.trigger("show");
                    }
                }, 
                { label: "ログ",
                    submenu: [
                        { label: "ログファイルを開く", click() {
                            shell.openExternal(logger.getPath());
                        }},
                        { label: "ログの場所を開く", click() {
                            shell.showItemInFolder(logger.getPath());
                        }}
                    ]
                },                
                { label: "ヘルプ",  
                    submenu: [
                        { role: "reload" },
                        { role: "forcereload" },
                        { role: "toggledevtools" },
                    ]
                },
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        this.on("mount", async () => {
            select_page("library");
            hideRightPage();

            await updateDownloadBadge();

            const menu = createMenu(this);
            this.obs.trigger("main-window-titlebar:set-menu", {menu});
        });

        this.obs.on("main-page:select-page", (page_name)=>{
            select_page(page_name);
        });  

        ipcRenderer.on(IPC_CHANNEL.SEARCH_TAG, (event, args)=>{
            this.obs.trigger("main-page:select-page", "search");
            this.obs.trigger("search-page:search-tag", args);
        });

        ipcRenderer.on(IPC_CHANNEL.LOAD_MYLIST, (event, args)=>{
            this.obs.trigger("main-page:select-page", "mylist");
            this.obs.trigger("mylist-page:load-mylist", args);
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, (event, args)=>{
            const item = args;
            this.obs.trigger("download-page:add-download-items", [item]);
        });

        ipcRenderer.on(IPC_CHANNEL.UPDATE_DATA, async (event, args) => {
            const { video_id, update_target } = args;

            const result = await new Promise((resolve, reject) => {
                this.obs.trigger("library-page:update-data", { 
                    video_id: video_id,
                    update_target: update_target,
                    cb: (result)=>{
                        resolve(result);
                    }
                });
            });
            
            if(result.state == "ok" || result.state == "404"){
                const video_item = await IPCClient.request("library", "getItem", {video_id});
                ipcRenderer.send(IPC_CHANNEL.RETURN_UPDATE_DATA, video_item);
            } 
        });

        ipcRenderer.on(IPC_CHANNEL.CANCEL_UPDATE_DATA, (event, args)=>{
            const video_id = args;
            this.obs.trigger("library-page:cancel-update-data", video_id);
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_BOOKMARK, (event, args)=>{
            const bk_item = args;
            this.obs.trigger("bookmark-page:add-items", [bk_item]);
        });

        ipcRenderer.on(IPC_CHANNEL.MAIN_CSS_LOADED, (event)=>{
            this.obs.trigger("css-loaded");
        });
    </script>
</main-page>