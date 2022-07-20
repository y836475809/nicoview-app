<main-page>
    <style>
        :host {
            --main-sidebar-width: 75px;
            --margin: 5px;
            --page-container-right-space: 20px;
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
            right: calc(var(--main-sidebar-width) + var(--margin) + var(--page-container-right-space));
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
            width: 8px;
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

    <div class="main-container" onmousedown={mousedown} onmouseup={mouseup}>
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
                        <span class="item-num">{state.donwnload_item_num}</span>
                    </span> 
                    <div class="button-label">ダウンロード</div>
                </div>
            </div>
            <div class="button center-v history-button" onclick="{onclickPageSelect.bind(this,'history')}"> 
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
            <history-page obs={obs}></history-page>
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
                    <i class="fas fa-stream"></i>
                    <div class="button-label">後で見る</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        /* globals logger */
        const myapi = window.myapi;
        const { MouseGesture } = window.MouseGesture;

        export default {
            state:{
                donwnload_item_num:0
            },
            obs:null,
            mouse_gesture:null,
            onBeforeMount(props) {
                this.obs = props.obs;

                this.mouse_gesture = new MouseGesture();
                this.obs.on("main-page:update-mousegesture-config", (args)=>{
                    const { config } = args;
                    this.mouse_gesture.config = config;
                });

                (async()=>{
                    const config = await  myapi.ipc.Config.get(
                        this.mouse_gesture.name,  this.mouse_gesture.defaultConfig);
                    this.mouse_gesture.config = config;
                })(); 
                
                this.mouse_gesture.setActionSearchBackPage(()=>{this.obs.trigger("search-page:back-page");});
                this.mouse_gesture.setActionSearchFowardPage(()=>{this.obs.trigger("search-page:forward-page");});
                this.mouse_gesture.setActionShowPalyer(()=>{
                    myapi.ipc.showyPlayer();
                });

                this.mouse_gesture.onGesture((gesture)=>{
                    if( this.mouse_gesture.action("all-page", gesture)){
                        return;
                    }
                    
                    const items = [...this.$$(".page-container.left > *")];
                    const cu_index = items.findIndex(item=>{
                        return item.style.zIndex > 0;
                    });
                    if(cu_index<0){
                        return;
                    }
                    const page_name = items[cu_index].tagName.toLowerCase();
                    if( this.mouse_gesture.action(page_name, gesture)){
                        return;
                    }
                });

                myapi.ipc.Download.onUpdateItem(async ()=>{
                    await  this.updateDownloadBadge();
                });

                myapi.ipc.Setting.onChangeLogLevel((args) => {
                    const { level } = args;
                    logger.setLevel(level);
                });

                this.obs.on("main-page:select-page", (page_name)=>{
                    this.select_page(page_name);
                });  

                myapi.ipc.Search.onSearchTag((args)=>{
                    this.obs.trigger("main-page:select-page", "search");
                    this.obs.trigger("search-page:search-tag", args);
                });

                myapi.ipc.MyList.onLoad((args)=>{
                    this.obs.trigger("main-page:select-page", "mylist");
                    this.obs.trigger("mylist-page:load-mylist", args);
                });

                myapi.ipc.Download.onAddItems((args)=>{
                    const items = args;
                    this.obs.trigger("download-page:add-download-items", items);
                });
                myapi.ipc.Download.onDeleteItems((args)=>{
                    const items = args;
                    this.obs.trigger("download-page:delete-download-items", items);
                });

                myapi.ipc.Stack.onAddItems((args)=>{
                    this.obs.trigger("play-stack-page:add-items", args);
                });

                myapi.ipc.Bookmark.onAddItems((args)=>{
                    const bk_items = args;
                    this.obs.trigger("bookmark-page:add-items", bk_items);
                });
            },
            async onMounted() {
                this.select_page("library");
                this.hideRightPage();

                await this.updateDownloadBadge();
            },
            mousedown(e) {
                this.mouse_gesture.mouseDown(e);
            },
            mouseup(e) {
                this.mouse_gesture.mouseUp(e);
            },
            async updateDownloadBadge() {
                const video_ids = await  myapi.ipc.Download.getIncompleteIDs();
                const elm = this.$(".download-badge > .item-num");
                if(video_ids.length === 0){
                    elm.style.display = "none";
                }else{
                    elm.style.display = "";
                }
                this.state.donwnload_item_num = video_ids.length;
                this.update();
            },
            changeClass(remove_query, add_query, class_name) {
                const elms = this.$$(remove_query);
                elms.forEach(elm => {
                    elm.classList.remove(class_name);
                });
                const elm = this.$(add_query);
                elm.classList.add(class_name);
            },
            select_page(page_name){
                Array.from(this.$$(".page-container.left > *"), 
                    (elm) => {
                        elm.style.zIndex = 0;
                    });
                const page = this.$(`${page_name}-page`);
                page.style.zIndex = 1;

                this.changeClass(
                    ".main-sidebar.left > .button", 
                    `.${page_name}-button`, 
                    "select-button");

                this.changeClass(
                    ".main-sidebar.left i.fas", 
                    `.${page_name}-button i.fas`, 
                    "select-icon");

                this.changeClass(
                    ".main-sidebar.left .button-border", 
                    `.${page_name}-button > .button-border`, 
                    "select-button-border");
            },
            onclickPageSelect(page_name, e) { // eslint-disable-line no-unused-vars
                this.select_page(page_name);
            },
            hideRightPage() { 
                Array.from(this.$$(".page-container.right > *"), 
                    (elm) => {
                        elm.style.zIndex = -1;
                    });
            },
            toggleRightSidebarClass(elm, toggle_class, select_class) {
                if(elm.classList.contains(toggle_class)===true){
                    elm.classList.remove(toggle_class); 
                }else{
                    const buttons = this.$$(`.main-sidebar.right ${select_class}`);
                    buttons.forEach(btn => {
                        btn.classList.remove(toggle_class); 
                    });
                    elm.classList.add(toggle_class); 
                } 
            },
            onclickTogglePage(page_name, e) {
                const page = this.$(`.${page_name}-page`);
                const page_zIndex = page.style.zIndex;

                this.hideRightPage();

                if(page_zIndex > 0){
                    page.style.zIndex = -1;
                }else{
                    page.style.zIndex = 2;
                }

                this.toggleRightSidebarClass(e.target, "select-button", ".button");

                const icon_elm = this.$(`.${page_name}-button i.fas`);
                this.toggleRightSidebarClass(icon_elm, "select-icon", "i.fas");

                const border_elm = this.$(`.${page_name}-button > .button-border`);
                this.toggleRightSidebarClass(border_elm, "select-button-border", ".button-border");
            }
        };
    </script>
</main-page>