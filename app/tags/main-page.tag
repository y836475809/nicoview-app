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
            height: 100%;
            width: calc(100% - var(--main-sidebar-width) * 2); 
            overflow: hidden;
            padding: var(--margin);
            background-color: var(--control-color);
        }
        .page-container.right > * {
            position: absolute;
            top: var(--right-sidebar-page-top);
            right: calc(var(--main-sidebar-width) + var(--margin));
            overflow-x: hidden; 
            overflow-y: hidden; 
            padding: var(--margin);
            background-color: var(--control-color);
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
        .main-sidebar .button {
            margin-bottom: 5px;
            text-align: center;
            box-sizing: border-box;
            width: 100%;
            height: 60px;   
            display: flex;
            cursor: pointer;
        }
        .select-button {
            background-color: #303030 !important;
        }
        .main-sidebar .button-border {
            height: 100%;
            width: 3px;
            background-color: #2C7CFF;
            opacity: 0;
        }
        .select-button-border {
            opacity: 1 !important;
        }
        .main-sidebar .button-border + div {
            width: 100%;
        }
        .main-sidebar .button > div {
            pointer-events: none;
        }
        .main-sidebar .button-label {
            margin: 2px;
            text-align: center;
            color: white;   
            font-size: 10px;
            user-select: none;
        }
        .main-sidebar .fas {
            padding-top: 10px; 
            font-size: 24px;
            color: grey;
        }
        .select-icon {
            color: lightgray !important;
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
            <div class="button center-v library-button" onclick="{onclickPageSelect.bind(this,'library')}">
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-book"></i>
                    <div class="button-label">ライブラリ</div>
                </div>
            </div>
            <div class="button center-v search-button" onclick="{onclickPageSelect.bind(this,'search')}">
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-search"></i> 
                    <div class="button-label">検索</div>
                </div>
            </div>
            <div class="button center-v mylist-button" onclick="{onclickPageSelect.bind(this,'mylist')}"> 
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-list"></i> 
                    <div class="button-label">マイリスト</div>
                </div>
            </div>
            <div class="button center-v download-button" onclick="{onclickPageSelect.bind(this,'download')}"> 
                <div class="button-border"></div>
                <div>
                    <span class="download-badge center-hv">
                        <i class="fas fa-download"></i>
                        <span class="item-num">{donwnload_item_num}</span>
                    </span> 
                    <div class="button-label">ダウンロード</div>
                </div>
            </div>
            <div class="button center-v play-history-button" onclick="{onclickPageSelect.bind(this,'play-history')}"> 
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-history"></i> 
                    <div class="button-label">履歴</div>
                </div>
            </div>
            <div class="button center-v setting-button" onclick="{onclickPageSelect.bind(this,'setting')}">  
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-cog"></i> 
                    <div class="button-label">設定</div>
                </div>
            </div>
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
            <div class="play-stack-page dialog-shadow">
                <play-stack-page obs={obs}></play-stack-page>
            </div>
        </div>
        <div class="main-sidebar right">
            <div class="button bookmark-button center-hv" onclick="{onclickTogglePage.bind(this,'bookmark')}">
                <div class="button-border"></div>
                <div>
                    <i class="fas fa-bookmark"></i>
                    <div class="button-label">ブックマーク</div>
                </div>
            </div>
            <div class="button play-stack-button center-hv" onclick="{onclickTogglePage.bind(this,'play-stack')}">
                <div class="button-border"></div>
                <div>
                    <i class="fas fa-folder-plus"></i>
                    <div class="button-label">後で見る</div>
                </div>
            </div>
        </div>
    </div>
    <open-video-form obs={obs_open_video_form}></open-video-form>

    <script>
        /* globals riot logger */
        const { remote, ipcRenderer, shell } = window.electron;
        const ipc = window.electron.ipcRenderer;
        const {Menu} = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        this.obs = this.opts.obs;
        this.obs_open_video_form = riot.observable();

        const updateDownloadBadge = async () => {
            const video_ids = await ipc.invoke("download:getIncompleteIDs");
            const elm = this.root.querySelector(".download-badge > .item-num");
            if(video_ids.length === 0){
                elm.style.display = "none";
            }else{
                elm.style.display = "";
            }
            this.donwnload_item_num = video_ids.length;
            this.update();
        };

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            await updateDownloadBadge();
        });

        ipcRenderer.on(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        this.donwnload_item_num = 0;

        const changeClass = (remove_query, add_query, class_name) => {
            const elms = this.root.querySelectorAll(remove_query);
            elms.forEach(elm => {
                elm.classList.remove(class_name);
            });
            const elm = this.root.querySelector(add_query);
            elm.classList.add(class_name);
        };

        const select_page = (page_name)=>{
            Array.from(this.root.querySelectorAll(".page-container.left > *"), 
                (elm) => {
                    elm.style.zIndex = 0;
                });
            const page = this.root.querySelector(`${page_name}-page`);
            page.style.zIndex = 1;

            changeClass(
                ".main-sidebar.left > .button", 
                `.${page_name}-button`, 
                "select-button");

            changeClass(
                ".main-sidebar.left i.fas", 
                `.${page_name}-button i.fas`, 
                "select-icon");

            changeClass(
                ".main-sidebar.left .button-border", 
                `.${page_name}-button > .button-border`, 
                "select-button-border");
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

        const toggleRightSidebarClass = (elm, toggle_class, select_class) => {
            if(elm.classList.contains(toggle_class)===true){
                elm.classList.remove(toggle_class); 
            }else{
                const buttons = this.root.querySelectorAll(`.main-sidebar.right ${select_class}`);
                buttons.forEach(btn => {
                    btn.classList.remove(toggle_class); 
                });
                elm.classList.add(toggle_class); 
            } 
        };

        this.onclickTogglePage = (page_name, e) => {
            const page = this.root.querySelector(`.${page_name}-page`);
            const page_zIndex = page.style.zIndex;

            hideRightPage();

            if(page_zIndex > 0){
                page.style.zIndex = -1;
            }else{
                page.style.zIndex = 2;
            }

            toggleRightSidebarClass(e.target, "select-button", ".button");

            const icon_elm = this.root.querySelector(`.${page_name}-button i.fas`);
            toggleRightSidebarClass(icon_elm, "select-icon", "i.fas");

            const border_elm = this.root.querySelector(`.${page_name}-button > .button-border`);
            toggleRightSidebarClass(border_elm, "select-button-border", ".button-border");
        };

        this.on("mount", async () => {
            select_page("library");
            hideRightPage();

            await updateDownloadBadge();
        });

        this.obs.on("main-page:select-page", (page_name)=>{
            select_page(page_name);
        });  

        ipcRenderer.on("open-video-form", ()=>{
            this.obs_open_video_form.trigger("show");
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

        ipcRenderer.on(IPC_CHANNEL.ADD_STACK_ITEMS, (event, args)=>{
            this.obs.trigger("play-stack-page:add-items", args);
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