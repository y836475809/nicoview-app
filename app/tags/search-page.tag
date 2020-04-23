<search-sidebar>
    <style scoped>
        .nico-search-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        
        .nico-search-item {
            color:royalblue;
        }
    </style>

    <div class="nico-search-sidebar">
        <accordion 
            title="ニコニコ動画検索" 
            expand={true} 
            obs={obs_accordion}
            icon_class={icon_class}
            name={name}>
        </accordion>
    </div>

    <script>
        /* globals riot */
        const { remote } = window.electron;
        const {Menu} = remote;
        const { DataIpcRenderer } = window.DataIpc;

        const obs = this.opts.obs; 
        this.obs_accordion = riot.observable();
        this.name = "nico-search";
        this.icon_class = {
            tag :  "fas fa-tag fa-lg"
        };

        this.on("mount", async () => {
            const name = this.name;
            const items = await DataIpcRenderer.action("bookmark", "getData", { name });
            this.obs_accordion.trigger("loadData", { items });
        });

        this.obs_accordion.on("changed", async (args) => {
            const { items } = args;
            const name = this.name;
            await DataIpcRenderer.action("bookmark", "update", { name, items });
        });

        const createMenu = (self) => {
            const nemu_templete = [
                { 
                    label: "削除", click() {
                        self.obs_accordion.trigger("deleteList");
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.obs_accordion.on("show-contextmenu", (e) => {
            const context_menu = createMenu(this);
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_accordion.on("item-dlbclicked", (item) => {
            obs.trigger("search-page:item-dlbclicked", item.cond);
        });

        obs.on("search-page:sidebar:add-item", (cond) => {
            const items = [
                { title: cond.query, type:cond.search_kind , cond: cond }
            ];
            this.obs_accordion.trigger("addList", { items });
        });
    </script>
</search-sidebar>

<search-content>
    <style scoped>
        :scope{
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }

        .search-cond-container .radio-input[type=radio] {
            display: none; 
        }
        .search-cond-container .radio-input[type=radio]:checked + .radio-label {
            background: gray;
            color: lightgray;
        }

        .search-cond-container,
        .search-cond-container > * {
            display: flex;
        }
        .search-cond-container {
            overflow-x: hidden;
        }

        .search-cond-container .label {   
            height: 30px;
            width: 100px;
            user-select: none;
        }
        .search-cond-container .radio-label {
            border: 1px solid gray;
            border-radius: 2px;
            height: 100%;
            width: 100%;
        }
        .search-cond-container .label + .label {
            border-left: none;  
            margin-left: -1px;
        }

        .search-sort-container i.fa-caret-up {
            font-size: 25px;
        }
        .search-sort-container i.fa-caret-down {
            font-size: 25px;
        }
        .search-cond-container .label:hover{
            cursor: pointer; 
        }  

        .search-target-container {
            margin-left: 30px;
        }

        .search-query-container input {
            width: 150px;
            height: 30px;
            font-size: 1.2em;
            
            border-width: 1px;
            border-right-width: 0px !important;
            border-style: solid;
            border-color: gray;
        }
        .search-query-container input:focus {
            outline: none;
        }

        .search-query-container > .search-button {
            width: 30px;
            height: 30px;

            background-color: white;
            border-width: 1px;  
            border-left-width: 0px !important;
            border-style: solid;
            border-color: gray;
        }
        .search-query-container > .search-button > i  {
            font-size: 20px;
            color: gray;   
        }
        .search-query-container > .search-button > i:hover {
            color: black;
        }

        .search-query-container > .add-search-cond-button {
            width: 30px;
            height: 30px;
        }
        .search-query-container > .add-search-cond-button > i {
            font-size: 20px;
            color: gray;
        }
        .search-query-container > .add-search-cond-button > i:hover {
            color: black;
        }

        .search-grid-container {
            width: 100%;
            height: calc(100vh - 70px);
            overflow: hidden;
        }
        
        .label-tag {
            background-color: lightpink
        }
    </style>

    <div class="search-cond-container">
        <div class="search-sort-container">
            <label class="label" each="{item, i in this.sort_items}">
                <input class="radio-input" type="radio" name="sort" checked={item.select} 
                    onclick="{ this.onclickSort.bind(this, i) }"> 
                <span class="radio-label center-hv">{item.title}
                    <i class="fas fa-fw fa-{item.order=='+'?'caret-up':'caret-down'}"></i></span>
            </label>
        </div>
        <div class="search-target-container">
            <label class="label" each="{item, i in this.search_items}">
                <input class="radio-input" type="radio" name="target" checked={item.select} 
                    onclick="{ this.onclickSearchTarget.bind(this, i) }"> 
                <span class="radio-label center-hv">{item.title}</span>
            </label>
        </div>
        <div class="search-query-container">
            <input class="query-input" type="search" onkeydown={onkeydownSearchInput}>
            <div class="search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </div>
            <div class="add-search-cond-button center-hv" title="検索条件を保存" onclick={onclickAddNicoSearchCond}>
                <i class="fas fa-plus"></i>
            </div>
        </div>      
    </div>
    <pagination obs={pagination_obs}></pagination>
    <div class="search-grid-container">
        <div class="search-grid"></div>
    </div>

    <modal-dialog obs={obs_modal_dialog} oncancel={this.onCancelSearch}></modal-dialog>

    <script>
        /* globals riot */
        const {remote, ipcRenderer} = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const { NicoSearchParams, NicoSearch } = window.NicoSearch;
        const { showMessageBox } = window.RemoteDailog;
        const { BookMark } = window.BookMark;
        const { DataIpcRenderer } = window.DataIpc;
        const { IPC_CHANNEL } =  window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();
        this.pagination_obs = riot.observable();

        this.pagination_obs.on("move-page", async args => {
            const { page_num } = args;
            nico_search_params.page(page_num);
            await this.search();
        });

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await DataIpcRenderer.action("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        ipcRenderer.on("libraryItemAdded", async (event, args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        ipcRenderer.on("libraryItemDeleted", async (event, args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });

        this.sort_items = [
            { kind: "startTime",    order:"-", select: true, title:"投稿日" },
            { kind: "commentCounter", order:"-", select: false, title:"コメント数" },
            { kind: "viewCounter",    order:"-", select: false, title:"再生数" }
        ];
        this.search_items = [
            { kind: "keyword", select: false, title:"キーワード" },
            { kind: "tag",     select: true,  title:"タグ" }
        ];

        const search_offset = 1600;
        const search_limit = 32;
        const nico_search_params = new NicoSearchParams(search_limit);
        nico_search_params.page(0);
        nico_search_params.sortTarget("startTime");
        nico_search_params.sortOder("-");
        nico_search_params.cond("tag");

        const nico_search = new NicoSearch();

        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
            let content = `<div>${value}</div>`;
            if(dataContext.saved){
                content += "<div class='state-content state-saved'>ローカル</div>";
            }
            if(dataContext.reg_download){
                content += "<div class='state-content state-reg-download'>ダウンロード追加</div>";
            }
            return content;
        };
        const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
            return `<div class="line-break">${value}</div>`;
        };
        const tagsFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(!value){
                return "";
            }

            let content = "";
            value.split(" ").forEach(tag => {
                content += `<div class='state-content label-tag'>${tag}</div>`;
            });
            return `<div class='line-break'>${content}</div>`;
        };

        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 130},
            {id: "name", name: "名前", formatter:lineBreakFormatter},
            {id: "info", name: "情報", formatter:htmlFormatter},
            {id: "pub_date", name: "投稿日"},
            {id: "play_time", name: "時間"},
            {id: "tags", name: "タグ", formatter:tagsFormatter},
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("search-grid", columns, options);

        const getSearchInputElm = () => {
            return this.root.querySelector(".search-query-container > .query-input");
        };

        this.search = async () => {
            if(nico_search_params.isQueryEmpty()){
                return;
            }

            this.obs_modal_dialog.trigger("show", {
                message: "検索中...",
                buttons: ["cancel"],
                cb: result=>{
                    this.onCancelSearch();
                }
            });

            grid_table.clearSelected();
            try {
                const search_result = await nico_search.search(nico_search_params);
                setData(search_result);
            } catch (error) {
                await showMessageBox("error", error.message);
            }
            
            this.obs_modal_dialog.trigger("close");
            resizeGridTable(); //only first?

            const elm = getSearchInputElm();
            elm.focus();
        };

        this.onCancelSearch = () => {
            nico_search.cancel();
        };

        const createItem = (value, saved, reg_download) => {
            return {
                thumb_img: value.thumbnailUrl,
                id: value.contentId,
                name: value.title,
                info: `ID:${value.contentId}<br>
                        再生:${value.viewCounter.toLocaleString()}<br>
                        コメント:${value.commentCounter.toLocaleString()}`,
                play_time: value.lengthSeconds,
                pub_date: value.startTime,
                tags: value.tags,
                saved: saved,
                reg_download: reg_download,
            };
        };

        const createEmptyItem = () => {
            return {
                thumb_img: "",
                id: "",
                name: "",
                info: "",
                play_time: -1,
                pub_date: -1,
                tags: "",
                saved: false,
                reg_download: false,
            };
        };

        const setData = async (search_result) => {     
            const page_num = search_result.meta.page;
            const total_count = search_result.meta.totalCount;
            let total_page_num = 0;
            if(total_count<search_offset+search_limit){
                total_page_num = Math.ceil(total_count/search_limit);
            }else{
                total_page_num = Math.ceil((search_offset+search_limit)/search_limit);
            }
            this.pagination_obs.trigger("set-data", {
                page_num, total_page_num, total_count
            });

            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            const items = await Promise.all(
                search_result.data.map(async value => {
                    const video_id = value.contentId;
                    const saved = await DataIpcRenderer.action("library", "existItem", {video_id});
                    const reg_download = video_ids.includes(video_id);
                    return createItem(value, saved, reg_download);
                })
            );
            items.push(createEmptyItem());
            grid_table.setData(items);
            grid_table.scrollToTop();  
        };

        const setSearchCondState = (sort_kind, sort_order, search_kind) => {
            if(sort_kind){
                const index = this.sort_items.findIndex(value=>{
                    return value.kind == sort_kind;
                });
                if(index!==-1){
                    this.sort_items.forEach((value) => {
                        value.select = false;
                    });

                    this.sort_items[index].select = true;
                    this.sort_items[index].order = sort_order;
                }
            }     
            if(search_kind){
                const index = this.search_items.findIndex(value=>{
                    return value.kind == search_kind;
                });
                if(index!==-1){
                    this.search_items.forEach((value) => {
                        value.select = false;
                    });
                    this.search_items[index].select = true;
                    this.search_items[index].kind = search_kind;
                }
            }
            this.update();
        };

        this.onclickSort = (index, e) => {
            const pre_selected = this.sort_items.findIndex(value=>{
                return value.select === true;
            });

            this.sort_items.forEach((value) => {
                value.select = false;
            });
            this.sort_items[index].select = true;

            if(pre_selected===index){
                const pre_order = this.sort_items[index].order; 
                this.sort_items[index].order = pre_order=="+"?"-":"+";
            }

            nico_search_params.sortTarget(this.sort_items[index].kind);
            nico_search_params.sortOder(this.sort_items[index].order);

            this.update();
        };
        
        this.onclickSearchTarget = (index, e) => {
            this.search_items.forEach((value) => {
                value.select = false;
            });
            this.search_items[index].select = true; 

            nico_search_params.cond(this.search_items[index].kind);
        };

        this.onclickSearch = async (e) => {
            const elm = getSearchInputElm();
            const query = elm.value;
            nico_search_params.query(query);
            await this.search();
        };

        this.onkeydownSearchInput = async (e) =>{
            if(e.keyCode===13){
                const param = e.target.value;
                nico_search_params.query(param);
                await this.search();
            }
        };

        this.onclickAddNicoSearchCond = (e) => {
            const elm = getSearchInputElm();
            const cond = {
                query: elm.value,
                sort_order: nico_search_params._sort_order,
                sort_name: nico_search_params._sort_name,
                search_kind: nico_search_params.search_kind,
                page: 1
            };
            
            obs.trigger("search-page:sidebar:add-item", cond);
        };
        obs.on("search-page:item-dlbclicked", async (item) => {
            const cond = item;
            const elm = getSearchInputElm();
            elm.value = cond.query;
            nico_search_params.cond(cond.search_kind);
            nico_search_params.query(cond.query);
            nico_search_params.page(cond.page); //TODO move last?
            nico_search_params.sortTarget(cond.sort_name);
            nico_search_params.sortOder(cond.sort_order);

            setSearchCondState(cond.sort_name, cond.sort_order, cond.search_kind);

            await this.search();
        });

        obs.on("search-page:search-tag", async (args)=> {
            const { query, search_kind } = args;
            const elm = getSearchInputElm();
            elm.value = query;
            nico_search_params.cond(search_kind);
            nico_search_params.query(query);
            
            setSearchCondState(null, null, search_kind);

            await this.search();
        });

        obs.on("search-page:search", async (args)=> {
            const { query, sort_order, sort_name, search_kind, page } = args;
            const elm = getSearchInputElm();
            elm.value = query;
            nico_search_params.cond(search_kind);
            nico_search_params.query(query);
            nico_search_params.sortTarget(sort_name);
            nico_search_params.sortOder(sort_order);
            nico_search_params.page(page);
            
            setSearchCondState(sort_name, sort_order, search_kind);
            this.pagination_obs.trigger("set-page-num", { page_num:page });

            await this.search();
        });

        const resizeGridTable = () => {
            const container = this.root.querySelector(".search-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id : video_id,
                        time : 0
                    });
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
                }},
                { label: "ダウンロードに追加", click() {
                    const items = grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    obs.trigger("download-page:add-download-items", items);
                }},
                { label: "ダウンロードから削除", click() {
                    const items = grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    const video_ids = items.map(value => {
                        return value.id;
                    });
                    obs.trigger("download-page:delete-download-items", video_ids);
                }},
                { label: "動画をブックマーク", click() {
                    const items = grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.name, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }},
                { label: "ページをブックマーク", click() {
                    const bk_item = BookMark.createSearchItem(nico_search_params);
                    obs.trigger("bookmark-page:add-items", [bk_item]);
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        const context_menu = createMenu();
        this.on("mount", () => {
            grid_table.init(this.root.querySelector(".search-grid"));

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                if(video_id){
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id : video_id,
                        time : 0
                    });
                }
            });
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            resizeGridTable();
        });

        obs.on("window-resized", ()=>{
            resizeGridTable();
        });
        
    </script>
</search-content>

<search-page>
    <div class="split-page">
        <div class="left">
            <search-sidebar obs={obs}></search-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <search-content obs={obs}></search-content>
        </div>
    </div>
    <script>
        this.obs = this.opts.obs;
    </script>
</search-page>