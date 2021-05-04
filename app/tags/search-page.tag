<search-sidebar>
    <style scoped>
        .nico-search-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        
        .nico-search-item-adjust {
            margin-right: 4px;
        }
    </style>

    <div class="nico-search-sidebar">
        <listview 
            obs={obs_listview}
            geticon={geticon}
            name={name}
            gettooltip={getTooltip}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;
        const { searchItems } = window.NicoSearch;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.name = "nico-search";
        this.geticon = (item) => {
            const search_target = item.cond.search_target;
            if(search_target == "keyword"){
                return "fas fa-ellipsis-h nico-search-item-adjust";
            }
            if(search_target == "tag"){
                return "fas fa-tag fa-lg";
            }
            return null;
        };

        const sort_map = new Map();
        const search_target_map = new Map();
        searchItems.sortItems.forEach(item => {
            sort_map.set(`${item.name}${item.order}`, item.title);
        });
        searchItems.searchTargetItems.forEach(item => {
            search_target_map.set(item.target, item.title);
        });
        this.getTooltip = (item) => {
            const cond = item.cond;
            const sort = sort_map.get(`${cond.sort_name}${cond.sort_order}`);
            const target = search_target_map.get(cond.search_target);
            return `${item.title}\n並び順: ${sort}\n種類: ${target}`;
        };

        const loadItems = async () => {
            const items = await myapi.ipc.Search.getItems();
            items.forEach(item => {
                item.type = item.cond.search_target;
            });
            this.obs_listview.trigger("loadData", { items });
        };

        this.on("mount", async () => {
            await loadItems();
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            items.forEach(item => {
                delete item.type;
            });
            await myapi.ipc.Search.updateItems(items);
        });

        this.obs_listview.on("show-contextmenu", (e, args) => {
            const { items, cb } = args; 
            cb(null);
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            obs.trigger("search-page:item-dlbclicked", item.cond);
        });

        obs.on("search-page:sidebar:add-item", (cond) => {
            const items = [
                { title: cond.query, type:cond.search_target , cond: cond }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        obs.on("search-page:sidebar:reload-items", async () => {
            await loadItems();
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

        .input-container {
            display: flex;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .input-container > input {
            margin-left: 5px;
            border-right-width: 0px !important;
            width: 250px;
            height: 30px;
            font-size: 1.2em;
            
            border-width: 1px;
            border-style: solid;
            border-color: gray;
        }
        .input-container > input:focus {
            outline: none;
        }
        .input-container > .add-button {
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .input-container > .search-button > i,
        .input-container > .add-button > i {
            font-size: 20px;
            color: gray;
        }
        .input-container > .search-button > i:hover,
        .input-container > .add-button > i:hover {
            color: black;
        }

        .input-container > .search-button > i {
            font-size: 1.2em;
        }
        .input-container > .search-button {
            border: 1px solid gray;
            border-left-width: 0px !important;
            width: 30px;
            height: 30px;
            background-color: white; 
            cursor: pointer;
        }

        .selected-container {
            display: flex;
            margin-left: 5px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .selected-container > div {
            user-select: none;
        }
        .selected-container > .title {
            height: 30px;
            border: 1px solid gray;
            border-radius: 3px;
            padding-left: 5px;
            padding-right: 5px;      
            margin-left: 5px;
            cursor: pointer;
            background-color: white;
        }

        .cond-menu-container1 {
            display: flex;
            height: 0px;
            overflow: hidden;
            transition: height 0.5s;
        }
        .cond-menu-container2 {
            display: flex;
            background-color: white;
            overflow: hidden;
            margin: 0 5px 5px 5px;
            padding: 5px;
            border: 1px solid gray;
            border-radius: 3px;
            transition: height 0.5s;
        }
        .cond-menu-container-expand {
            height: 160px;
        }

        .cond-menu-list {
            margin-right: 50px;
        }
        .cond-menu-list > .title {
            font-weight: bold;
            font-size: 1.2em;
        }
        .cond-menu-list > .item {
            color: black;
            cursor: pointer;
        }
        .cond-menu-list > .item:hover {
            text-decoration: underline;
        }
        .cond-menu-list > div {
            user-select: none;
        }

        .cond-menu-container2 > .close-btn {
            font-weight: bold;
            color: gray;
            user-select: none;
            cursor: pointer;
        }
        .cond-menu-container2 > .close-btn:hover {
            font-weight: bold;
            color: black;
        }

        pagination {
            margin: 0 0 5px 0;
        }

        .search-grid-container {
            width: 100%;
            height: calc(100% - 20px); 
            overflow: hidden;
        }

        .label-tag {
            background-color: lightpink
        }
    </style>
    
    <div style="display: flex;">
        <div class="selected-container center-v">
            <div>検索条件</div>
            <label style="margin: 0 5px 0 5px;" class="center-v" title="offの場合、ニコニコ動画内部APIで検索する(ログインが必要)" >
                <input class="check-search-api" type="checkbox" 
                    checked={api_checked} onclick={onclickCheckSearchAPI} />スナップショット検索
            </label>
            <div class="title center-v" onclick="{onclickToggleMenu}">
                {sort_title}
            </div>
            <div class="title center-v" onclick="{onclickToggleMenu}">
                {search_target_title}
            </div>
        </div>
        <div class="input-container center-v">
            <input placeholder="検索" onkeydown={onkeydownInput}>
            <div class="search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </div>
            <div class="add-button center-hv" title="検索条件を保存" onclick={onclickAddSearch}>
                <i class="far fa-star"></i>
            </div>
        </div> 
    </div>
    <div class="cond-menu-container1">
        <div class="cond-menu-container2">
            <div class="cond-menu-list">
                <div class="title">並び替え</div>
                <div class="item" each={index in [0,1,2]} 
                    onclick={onchangeSort.bind(this,sort_items[index])}>
                    {sort_items[index].title}
                </div>
                <div class="sc-separator" >&nbsp;</div>
                <div class="item" each={index in [3,4,5]} 
                    onclick={onchangeSort.bind(this,sort_items[index])}>
                    {sort_items[index].title}
                </div>
            </div>
            <div class="cond-menu-list">
                <div class="title">種類</div>
                <div class="item" each={item, i in search_target_items} 
                    onclick={onchangeTarget.bind(this,item)}>
                    {item.title}
                </div>
            </div>
            <div class="close-btn" title="閉じる" onclick={onclickToggleMenu}>
                <i class="fas fa-times"></i>
            </div>
        </div>
    </div>
    <pagination obs={pagination_obs}></pagination>
    <div class="search-grid-container">
        <div class="search-grid"></div>
    </div>

    <modal-dialog obs={obs_modal_dialog} oncancel={onCancelSearch}></modal-dialog>

    <script>
        /* globals riot logger */
        const myapi = window.myapi;
        const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { NicoSearchParams, NicoSearch, searchItems } = window.NicoSearch;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();
        this.pagination_obs = riot.observable();

        this.api_checked = "checked";
        this.sort_items = searchItems.sortItems;
        this.search_target_items = searchItems.searchTargetItems;

        const loadSearchCond = async () => {
            const { api, sort, search_target } = await myapi.ipc.Config.get("search.condition",  {
                api:"snapshot",
                sort:{ name:"startTime", order:"-" },
                search_target:{ target:"tag" }
            });
            const sort_item = this.sort_items.find(item => {
                return item.name == sort.name 
                    && item.order == sort.order;
            });
            const search_target_item = this.search_target_items.find(item => {
                return item.target == search_target.target;
            });

            return { api, sort_item, search_target_item };
        };

        const saveSearchCond = async () => {
            const api = nico_search_params.getAPI();
            const { sort_name, sort_order, search_target } = nico_search_params.getParams();
            await myapi.ipc.Config.set("search.condition", {
                api: api,
                sort:{ name:sort_name, order:sort_order },
                search_target:{ target:search_target } 
            });
        };

        this.onclickToggleMenu = (e) => {
            const elm = this.root.querySelector(".cond-menu-container1");
            elm.classList.toggle("cond-menu-container-expand");
        };

        this.onclickCheckSearchAPI = (e) => {
            const elm = this.root.querySelector(".check-search-api");
            const api = elm.checked?"snapshot":"ext";
            nico_search_params.api(api);
            
            saveSearchCond();
        };

        this.onchangeSort = async (item, e) => {
            const { title, name, order } = item;

            this.sort_title = title;
            this.update();

            nico_search_params.sortName(name);
            nico_search_params.sortOder(order);

            saveSearchCond();

            await this.search();
        };

        this.onchangeTarget = async (item, e) => {
            const { title, target } = item;

            this.search_target_title = title;
            this.update();

            nico_search_params.target(target);

            saveSearchCond();

            await this.search();
        };

        this.pagination_obs.on("move-page", async args => {
            const { page_num } = args;
            nico_search_params.page(page_num);
            await this.search();
        });

        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });

        const search_offset = 1600;
        const search_limit = 32;
        const search_context = myapi.getUserAgent();
        const nico_search_params = new NicoSearchParams(search_limit, search_context);
        const nico_search = new NicoSearch();

        const seach_infoFormatter = infoFormatter.bind(this, 
            (value, dataContext)=>{ return `<div>${value}</div>`; });

        const tagsFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(!value){
                return "";
            }

            const tags = value.split(" ");

            let content = "";
            tags.forEach(tag => {
                content += `<div class='tag-content label-tag'>${tag}</div>`;
            });
            const title = tags.join("\n");
            return `<div title="${title}" class='wrap-gridtable-cell'>${content}</div>`;
        };

        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 130},
            {id: "title", name: "名前", formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this, ["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報", formatter:seach_infoFormatter},
            {id: "pub_date", name: "投稿日"},
            {id: "play_time", name: "時間"},
            {id: "tags", name: "タグ, コメント", formatter:tagsFormatter},
        ];
        const options = {
            rowHeight: 100,
        };   
        const grid_table = new GridTable("search-grid", columns, options);

        const getSearchInputElm = () => {
            return this.root.querySelector(".input-container > input");
        };

        const canSearch = () => {
            return this.root.querySelector("modal-dialog").dataset.open!="true";
        };

        this.search = async () => {
            if(nico_search_params.isQueryEmpty()){
                return;
            }

            if(!canSearch()){
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
                let search_result = null;
                if(nico_search_params.getAPI()=="snapshot"){
                    search_result = await nico_search.search(nico_search_params);
                }                
                if(nico_search_params.getAPI()=="ext"){
                    const cookie = await myapi.ipc.getNicoLoginCookie();
                    if(!cookie){
                        throw new Error("内部APIで検索するにはニコニコ動画へのログインが必要");
                    }
                    search_result = await nico_search.searchExt(nico_search_params.getParamsExt(), cookie);
                }
                setData(search_result);
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }
            
            this.obs_modal_dialog.trigger("close");

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
                title: value.title,
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
                title: "",
                info: "",
                play_time: -1,
                pub_date: -1,
                tags: "",
                saved: false,
                reg_download: false,
            };
        };

        const setData = async (search_result) => {     
            const page_info = search_result.page_ifno;
            const search_list = search_result.list;
            const { page_num, total_page_num, search_result_num } = page_info;

            this.pagination_obs.trigger("set-data", {
                page_num, total_page_num, search_result_num
            });

            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = await Promise.all(
                search_list.map(async value => {
                    const video_id = value.contentId;
                    const saved = await myapi.ipc.Library.hasItem(video_id);
                    const reg_download = video_ids.includes(video_id);
                    return createItem(value, saved, reg_download);
                })
            );
            items.push(createEmptyItem());
            grid_table.setData(items);
            grid_table.scrollToTop();  
        };

        const setSearchCondState = (sort_name, sort_order, search_target) => {
            if(sort_name){
                const result = this.sort_items.find(item => {
                    return item.name == sort_name && item.order == sort_order;
                });
                if(result){
                    this.sort_title = result.title;
                }
            }     
            if(search_target){
                const result = this.search_target_items.find(item => {
                    return item.target == search_target;
                });
                if(result){
                    this.search_target_title = result.title;
                }
            }
            this.update();
        };

        this.onclickSearch = async (e) => {
            const elm = getSearchInputElm();
            const query = elm.value;
            nico_search_params.query(query);
            await this.search();
        };

        this.onkeydownInput = async (e) =>{
            if(e.keyCode===13){
                const query = e.target.value;
                nico_search_params.query(query);
                await this.search();
            }
        };

        this.onclickAddSearch = (e) => {
            const elm = getSearchInputElm();
            if(!elm.value){
                return;
            }

            const { sort_name, sort_order, search_target } = nico_search_params.getParams();
            const cond = {
                query: elm.value,
                sort_name: sort_name,
                sort_order: sort_order,
                search_target: search_target,
                page: 1
            };
            
            obs.trigger("search-page:sidebar:add-item", cond);
        };
        obs.on("search-page:item-dlbclicked", async (item) => {
            const cond = item;
            const elm = getSearchInputElm();
            elm.value = cond.query;
            nico_search_params.target(cond.search_target);
            nico_search_params.query(cond.query);
            nico_search_params.page(cond.page); //TODO move last?
            nico_search_params.sortName(cond.sort_name);
            nico_search_params.sortOder(cond.sort_order);

            setSearchCondState(cond.sort_name, cond.sort_order, cond.search_target);

            await this.search();
        });

        obs.on("search-page:search-tag", async (args)=> {
            const { query, search_target } = args;
            const elm = getSearchInputElm();
            elm.value = query;
            nico_search_params.target(search_target);
            nico_search_params.query(query);
            
            setSearchCondState(null, null, search_target);

            await this.search();
        });

        obs.on("search-page:search", async (args)=> {
            const { query, sort_order, sort_name, search_target, page } = args;
            const elm = getSearchInputElm();
            elm.value = query;
            nico_search_params.target(search_target);
            nico_search_params.query(query);
            nico_search_params.sortName(sort_name);
            nico_search_params.sortOder(sort_order);
            nico_search_params.page(page);
            
            setSearchCondState(sort_name, sort_order, search_target);
            this.pagination_obs.trigger("set-page-num", { page_num:page });

            await this.search();
        });
        
        obs.on("css-loaded", () => {
            grid_table.resizeGrid();
        });

        obs.on("search-page:forward-page", () => {
            if(!canSearch()){
                return;
            }

            this.pagination_obs.trigger("forward");
        });

        obs.on("search-page:back-page", () => {
            if(!canSearch()){
                return;
            }

            this.pagination_obs.trigger("back");
        });
        
        this.on("mount", async () => {
            const elm = this.root.querySelector(".cond-menu-container1");
            elm.addEventListener("transitionend", (event) => {
                if(event.propertyName == "height") {
                    grid_table.resizeGrid();
                }
            });

            const grid_container = this.root.querySelector(".search-grid");
            grid_table.init(grid_container);
            grid_table.setupResizer(".search-grid-container");
            grid_table.onDblClick((e, data)=>{
                if(data.id){
                    Command.play(data, false);
                }
            });
            grid_table.onButtonClick(async (e, cmd_id, data)=>{
                if(cmd_id == "play"){
                    Command.play(data, false);
                }
                if(cmd_id == "stack"){
                    Command.addStackItems(obs, [data]);
                }
                if(cmd_id == "bookmark"){
                    Command.addBookmarkItems(obs, [data]);
                }
                if(cmd_id == "download"){
                    Command.addDownloadItems(obs, [data]);
                }
            });
            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas().filter(value => {
                    return value.id!="";
                });
                if(items.length===0){
                    return;
                }
                await myapi.ipc.popupContextMenu("search", {items});
            });

            const { api, sort_item, search_target_item } = await loadSearchCond();
            this.api_checked = api=="snapshot"?"checked":"";
            this.sort_title = sort_item.title;
            this.search_target_title = search_target_item.title;
            nico_search_params.api(api);
            nico_search_params.page(0);
            nico_search_params.sortName(sort_item.name);
            nico_search_params.sortOder(sort_item.order);
            nico_search_params.target(search_target_item.target);

            this.update();
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