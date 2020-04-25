<main-page>
    <style scoped>
        :scope {
            --main-group-buttons-width: 55px;
            --page-margin: 1px;
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
            width: calc(100% - var(--main-group-buttons-width) * 2 - var(--page-margin)); 
            overflow-x: hidden;          
        }
        .page-container.right > * {
            position: absolute;
            top: 40px;
            right:  var(--main-group-buttons-width);
            overflow-x: hidden; 
            overflow-y: hidden; 
            height: calc(100vh - 60px);
        }
        .page-container.right > div {
            border: 1px solid gray;
            border-radius: 5px;
            padding: 5px;
            background-color: var(--control-color);
        }

        .main-group-buttons {
            width: var(--main-group-buttons-width);
            height: 100%;
            background-color: #1e2229;
        }
        .main-group-buttons input[type=radio] {
            display: none; 
        }
        .main-group-buttons input[type=radio]:checked + .button{
            border-left: 3px solid #2C7CFF;
        }
        .main-group-buttons .button {
            margin: 2px;
            text-align: center;
            box-sizing: border-box;
            width: 50px;
            height: 50px;      
        }
        .main-group-buttons .fas {
            font-size: 24px;
            color: grey;
        }
        .main-group-buttons.right {
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
            text-align: center;
        }
    </style>

    <div class="main-container">
        <div class="main-group-buttons left">
            <label class="label">
                <input type="radio" name="page_select" class="library-radio" onclick="{this.onclickPageSelect.bind(this,'library')}"> 
                <span title="ライブラリ" class="button center-hv"><span class="fas fa-book"></span></span>
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="search-radio" onclick="{this.onclickPageSelect.bind(this,'search')}"> 
                <span title="検索" class="button center-hv"><span class="fas fa-search"></span></span> 
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="mylist-radio" onclick="{this.onclickPageSelect.bind(this,'mylist')}"> 
                <span title="マイリスト" class="button center-hv"><span class="fas fa-list"></span></span> 
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="download-radio" onclick="{this.onclickPageSelect.bind(this,'download')}"> 
                <span title="ダウンロード" class="button download-badge center-hv">
                    <span class="fas fa-download"></span>
                    <span class="item-num">{this.donwnload_item_num}</span>
                </span> 
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="play-history-radio" onclick="{this.onclickPageSelect.bind(this,'play-history')}"> 
                <span title="履歴" class="button center-hv"><span class="fas fa-history"></span></span> 
            </label>
            <label class="label">
                <input type="radio" name="page_select" class="setting-radio" onclick="{this.onclickPageSelect.bind(this,'setting')}"> 
                <span title="設定" class="button center-hv"><span class="fas fa-cog"></span></span> 
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
        <div class="main-group-buttons right">
            <div class="button center-hv" title="ブックマーク" onclick="{this.onclickShowPage.bind(this,'bookmark')}">
                <i class="fas fa-bookmark"></i>
            </div>
        </div>
    </div>

    <script>
        /* globals logger */
        const { remote, ipcRenderer, shell } = window.electron;
        const {Menu} = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { DataIpcRenderer } = window.DataIpc;

        this.obs = this.opts.obs;

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            this.donwnload_item_num = video_ids.length;
            this.update();
        });

        ipcRenderer.on(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        this.donwnload_item_num = 0;

        let template = [];
        if(process.env.NODE_ENV == "DEBUG"){
            template.push({
                label: "ツール",
                submenu: [
                    { role: "reload" },
                    { role: "forcereload" },
                    { role: "toggledevtools" },
                ]
            });
        }else{
            template.push({
                label: "ツール",
                submenu: [
                    { role: "toggledevtools" },
                ]
            });
        }
        template.push({
            label: "ログ",
            submenu: [
                { label: "ログファイルを開く", click() {
                    shell.openExternal(logger.getPath());
                }},
                { label: "ログの場所を開く", click() {
                    shell.showItemInFolder(logger.getPath());
                }}
            ]
        });
        
        const menu = Menu.buildFromTemplate(template);
        remote.getCurrentWindow().setMenu(menu);

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

        this.onclickShowPage = (page_name, e) => {
            const page = this.root.querySelector(`.${page_name}-page`);
            const page_zIndex = page.style.zIndex;

            Array.from(this.root.querySelectorAll(".page-container.right > *"), 
                (elm) => {
                    elm.style.zIndex = -1;
                });

            if(page_zIndex > 0){
                page.style.zIndex = -1;
            }else{
                page.style.zIndex = 2;
            }
        };

        this.on("mount", async () => {
            select_page("library");

            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            this.donwnload_item_num = video_ids.length;
            this.update();
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
                const video_item = await DataIpcRenderer.action("library", "getItem", {video_id});
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
            this.obs.trigger("window-resized");
        });

        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.obs.trigger("window-resized");
            }, timeout);
        });
    </script>
</main-page>