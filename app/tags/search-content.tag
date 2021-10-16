<search-content>
    <style>
        :host {
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
            position: absolute;
            display: flex;
            height: 160px;
            z-index: 2;
        }
        .cond-menu-container2 {
            display: flex;
            background-color: white;
            margin: 0 5px 5px 5px;
            padding: 5px;
            border: 1px solid gray;
            border-radius: 3px;
            z-index: 2;
        }
        .cond-menu-container-expand {
            height: 160px;
        }
        .cond-menu-container-non {
            display: none;
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
            font-size: 20px;
            margin-right: 5px;
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
            <label style="margin: 0 5px 0 5px;" class="center-v" title="offでニコニコ動画検索ページ使用" >
                <input class="check-search-api" type="checkbox" 
                    checked={state.api_checked} onclick={onclickCheckSearchAPI} />スナップショット検索
            </label>
            <div class="cond-sort title center-v" onclick="{onclickToggleMenu}">
                {state.sort_title}
            </div>
            <div class="title center-v" onclick="{onclickToggleMenu}">
                {state.search_target_title}
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
    <div class="cond-menu-container1 cond-menu-container-non">
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
                <div class="item" each={(item, i) in search_target_items} 
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

    <script>
        /* globals my_obs logger ModalDialog */
        const myapi = window.myapi;
        const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { NicoSearchParams, NicoSearch, searchItems } = window.NicoSearch;

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

        export default {
            state:{
                api_checked:"checked",
                sort_title:"",
                search_target_title:"",
            },
            sort_items:searchItems.sortItems,
            search_target_items:searchItems.searchTargetItems,
            obs:null,
            obs_modal_dialog:null,
            pagination_obs:null,
            nico_search_params:null,
            nico_search:null,
            grid_table:null,
            onBeforeMount(props) {
                this.obs = props.obs; 
                this.obs_modal_dialog = my_obs.createObs();
                this.modal_dialog = null;

                this.pagination_obs = my_obs.createObs();

                const search_limit = 32;
                const search_context = myapi.getUserAgent();
                this.nico_search_params = new NicoSearchParams(search_limit, search_context);
                this.nico_search = new NicoSearch();

                const seach_infoFormatter = infoFormatter.bind(this, 
                    (value, dataContext)=>{ return `<div>${value}</div>`; }); // eslint-disable-line no-unused-vars

                const tagsFormatter = (row, cell, value, columnDef, dataContext)=> { // eslint-disable-line no-unused-vars
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
                this.grid_table = new GridTable("search-grid", columns, options);

                this.pagination_obs.on("move-page", async args => {
                    const { page_num } = args;
                    this.nico_search_params.page(page_num);
                    await this.search();
                });

                myapi.ipc.Download.onUpdateItem(async ()=>{
                    const video_ids = await myapi.ipc.Download.getIncompleteIDs();
                    const items = this.grid_table.dataView.getItems();

                    for (let i=0; i<items.length; i++) {
                        const item = items[i];
                        const video_id = item.id;
                        item.saved = await myapi.ipc.Library.hasItem(video_id);
                        item.reg_download = video_ids.includes(video_id);
                        this.grid_table.dataView.updateItem(video_id, item);    
                    }
                });

                myapi.ipc.Library.onAddItem((args) => {
                    const {video_item} = args;
                    const video_id = video_item.id;
                    this.grid_table.updateCells(video_id, { saved:true });
                });

                myapi.ipc.Library.onDeleteItem((args) => {
                    const { video_id } = args;
                    this.grid_table.updateCells(video_id, { saved:false });
                });

                this.obs.on("search-page:item-dlbclicked", async (item) => {
                    const cond = item;
                    const elm = this.getSearchInputElm();
                    elm.value = cond.query;
                    this.nico_search_params.target(cond.search_target);
                    this.nico_search_params.query(cond.query);
                    this.nico_search_params.page(cond.page); //TODO move last?
                    this.nico_search_params.sortName(cond.sort_name);
                    this.nico_search_params.sortOder(cond.sort_order);

                    this.setSearchCondState(cond.sort_name, cond.sort_order, cond.search_target);

                    await this.search();
                });

                this.obs.on("search-page:search-tag", async (args)=> {
                    const { query, search_target } = args;
                    const elm = this.getSearchInputElm();
                    elm.value = query;
                    this.nico_search_params.target(search_target);
                    this.nico_search_params.query(query);
                    
                    this.setSearchCondState(null, null, search_target);

                    await this.search();
                });

                this.obs.on("search-page:search", async (args)=> {
                    const { query, sort_order, sort_name, search_target, page } = args;
                    const elm = this.getSearchInputElm();
                    elm.value = query;
                    this.nico_search_params.target(search_target);
                    this.nico_search_params.query(query);
                    this.nico_search_params.sortName(sort_name);
                    this.nico_search_params.sortOder(sort_order);
                    this.nico_search_params.page(page);
                    
                    this.setSearchCondState(sort_name, sort_order, search_target);
                    this.pagination_obs.trigger("set-page-num", { page_num:page });

                    await this.search();
                });

                this.obs.on("search-page:forward-page", () => {
                    if(!this.canSearch()){
                        return;
                    }
                    this.pagination_obs.trigger("forward");
                });

                this.obs.on("search-page:back-page", () => {
                    if(!this.canSearch()){
                        return;
                    }
                    this.pagination_obs.trigger("back");
                });
            },
            async onMounted() {
                const elm = this.$(".cond-menu-container1");
                elm.addEventListener("transitionend", (event) => {
                    if(event.propertyName == "height") {
                        this.grid_table.resizeGrid();
                    }
                });

                const grid_container = this.$(".search-grid");
                this.grid_table.init(grid_container);
                this.grid_table.setupResizer(".search-grid-container");
                this.grid_table.onDblClick((e, data)=>{
                    if(data.id){
                        Command.play(data, false);
                    }
                });
                this.grid_table.onButtonClick(async (e, cmd_id, data)=>{
                    if(cmd_id == "play"){
                        Command.play(data, false);
                    }
                    if(cmd_id == "stack"){
                        Command.addStackItems(this.obs, [data]);
                    }
                    if(cmd_id == "bookmark"){
                        Command.addBookmarkItems(this.obs, [data]);
                    }
                    if(cmd_id == "download"){
                        Command.addDownloadItems(this.obs, [data]);
                    }
                });
                this.grid_table.onContextMenu(async (e)=>{ // eslint-disable-line no-unused-vars
                    const items = this.grid_table.getSelectedDatas().filter(value => {
                        return value.id!="";
                    });
                    if(items.length===0){
                        return;
                    }
                    await myapi.ipc.popupContextMenu("search", {items});
                });

                const { api, sort_item, search_target_item } = await this.loadSearchCond();
                this.state.api_checked = api=="snapshot"?"checked":"";
                this.state.sort_title = sort_item.title;
                this.state.search_target_title = search_target_item.title;
                this.nico_search_params.api(api);
                this.nico_search_params.page(0);
                this.nico_search_params.sortName(sort_item.name);
                this.nico_search_params.sortOder(sort_item.order);
                this.nico_search_params.target(search_target_item.target);

                this.update();

                this.modal_dialog = new ModalDialog(this.root, "search-md", {
                    obs:this.obs_modal_dialog,
                    oncancel: this.onCancelSearch
                });
            },
            async loadSearchCond() {
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
            },
            async saveSearchCond() {
                const api = this.nico_search_params.getAPI();
                const { sort_name, sort_order, search_target } = this.nico_search_params.getParams();
                await myapi.ipc.Config.set("search.condition", {
                    api: api,
                    sort:{ name:sort_name, order:sort_order },
                    search_target:{ target:search_target } 
                });
            },
            onclickToggleMenu(e) { // eslint-disable-line no-unused-vars
                const elm = this.$(".cond-menu-container1");
                elm.classList.toggle("cond-menu-container-non");
                
                if(!elm.classList.contains("cond-menu-container-non")){
                    const sort_elm = this.$(".selected-container .cond-sort");
                    const x = sort_elm.offsetLeft - 5;
                    const y = sort_elm.offsetTop + sort_elm.clientHeight + 5;
                    elm.style.left = x + "px";
                    elm.style.top = y + "px";
                }
            },
            onclickCheckSearchAPI(e) { // eslint-disable-line no-unused-vars
                const elm = this.$(".check-search-api");
                const api = elm.checked?"snapshot":"html";
                this.nico_search_params.api(api);
                
                this.saveSearchCond();
            },
            async onchangeSort(item, e) { // eslint-disable-line no-unused-vars
                const { title, name, order } = item;

                this.state.sort_title = title;
                this.update();

                this.nico_search_params.sortName(name);
                this.nico_search_params.sortOder(order);

                this.saveSearchCond();

                await this.search();
            },
            async onchangeTarget(item, e) { // eslint-disable-line no-unused-vars
                const { title, target } = item;

                this.state.search_target_title = title;
                this.update();

                this.nico_search_params.target(target);

                this.saveSearchCond();

                await this.search();
            },
            getSearchInputElm() {
                return this.$(".input-container > input");
            },
            canSearch() {
                return !this.modal_dialog.isOpend();
            },
            async search() {
                if(this.nico_search_params.isQueryEmpty()){
                    return;
                }

                if(!this.canSearch()){
                    return;
                }
                
                this.obs_modal_dialog.trigger("show", {
                    message: "検索中...",
                    buttons: ["cancel"],
                    cb: ()=>{
                        this.onCancelSearch();
                    }
                });

                this.grid_table.clearSelected();
                try {
                    let search_result = null;
                    if(this.nico_search_params.getAPI()=="snapshot"){
                        search_result = await this.nico_search.search(this.nico_search_params);
                    }                
                    if(this.nico_search_params.getAPI()=="html"){
                        search_result = await this.nico_search.searchHtml(this.nico_search_params.getParamsExt());
                    }
                    this.setData(search_result);
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

                const elm = this.getSearchInputElm();
                elm.focus();
            },
            onCancelSearch() {
                this.nico_search.cancel();
            },
            async setData(search_result) {     
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
                this.grid_table.setData(items);
                this.grid_table.scrollToTop();  
            },
            setSearchCondState(sort_name, sort_order, search_target) {
                if(sort_name){
                    const result = this.sort_items.find(item => {
                        return item.name == sort_name && item.order == sort_order;
                    });
                    if(result){
                        this.state.sort_title = result.title;
                    }
                }     
                if(search_target){
                    const result = this.search_target_items.find(item => {
                        return item.target == search_target;
                    });
                    if(result){
                        this.state.search_target_title = result.title;
                    }
                }
                this.update();
            },
            async onclickSearch(e){ // eslint-disable-line no-unused-vars
                const elm = this.getSearchInputElm();
                const query = elm.value;
                this.nico_search_params.query(query);
                await this.search();
            },
            async onkeydownInput(e){
                if(e.keyCode===13){
                    const query = e.target.value;
                    this.nico_search_params.query(query);
                    await this.search();
                }
            },
            onclickAddSearch(e) { // eslint-disable-line no-unused-vars
                const elm = this.getSearchInputElm();
                if(!elm.value){
                    return;
                }

                const { sort_name, sort_order, search_target } = this.nico_search_params.getParams();
                const cond = {
                    query: elm.value,
                    sort_name: sort_name,
                    sort_order: sort_order,
                    search_target: search_target,
                    page: 1
                };
                
                this.obs.trigger("search-page:sidebar:add-item", cond);
            }
        };
    </script>
</search-content>