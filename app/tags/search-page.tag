<search-sidebar>
    <style scoped>
        .nico-search-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-search-sidebar">
        <accordion params={acdn_search}></accordion>
    </div>

    <script>
        /* globals app_base_dir obs */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const seach_file_path = SettingStore.getSystemFile("nico-search.json");

        const getIcon = (kind) => {
            return kind=="tag"? {
                name: "fas fa-tag fa-lg",
                style: "color:red;"
            } : undefined;  
        };

        try {
            this.store = new JsonStore(seach_file_path);
            const { is_expand, items } = this.store.load();
            this.nico_search_data = {
                is_expand: is_expand,
                items: items.map(value=>{
                    value.icon = getIcon(value.cond.search_kind);
                    return value;
                })
            };
        } catch (error) {
            this.nico_search_data = {
                is_expand: false, 
                items: []
            };
        }

        const save = (data) => {
            const copied_data = JSON.parse(JSON.stringify(data));
            copied_data.items.forEach(value=>{
                delete value.icon;
                delete value.cond.page;
            });
            try {
                this.store.save(copied_data);
            } catch (error) {
                console.log(error);
            }
        };

        const createMenu = (sender) => {
            const nemu_templete = [
                { 
                    label: "delete", click() {
                        obs.trigger(`${sender}-delete-selected-items`);
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.acdn_search = {
            title : "ニコニコ動画検索",
            name: "nico-search",
            expand: true,
            items: this.nico_search_data.items,
            oncontextmenu: ()=> {
                const menu = createMenu("nico-search");
                menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on(`${this.acdn_search.name}-dlbclick-item`, (item) => {
            obs.trigger("on_change_nico_search_cond", item.cond);
        });

        obs.on(`${this.acdn_search.name}-state-change`, (data) => {
            save(data);
        });
        
        obs.on("on_add_nico_search_cond", (cond) => {
            const icon = getIcon(cond.search_kind);
            obs.trigger(`${this.acdn_search.name}-add-items`, 
                [
                    { title: cond.query, cond: cond, icon: icon }
                ]
            );
            obs.trigger(`${this.acdn_search.name}-change-expand`, true);
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
            flex-wrap: wrap;
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
            /* position :relative;
            top:10%;
            left:5%; */
            /* position :relative; */

            font-size: 25px;
        }
        .search-sort-container i.fa-caret-down {
            /* position :relative;
            top:-10%;
            left:5%; */
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
            outline: 0;
        }

        .search-query-container .search-button {
            width: 30px;
            height: 30px;
            border-radius: 2px;
            background-color: #7fbfff;
        }
        .search-query-container .fa-search {
            font-size: 25px;
        }
        .search-query-container .add-search-cond-button {
            margin-left: 10px;
            width: 30px;
            height: 30px;
        }
        .search-query-container .fa-plus-square {
            font-size: 30px;
            color: darkgray;
        }
        .search-query-container .search-button:hover,
        .search-query-container .icon-button:hover { 
            opacity: 0.5;
            cursor: pointer; 
        } 

        .line-break {
            white-space: normal;
            word-wrap: break-word;
        }

        .state-content {
            display: inline-block;
            border-radius: 2px;
            padding: 3px;
            margin-right: 5px;        
        }
        .state-saved {
            background-color: #7fbfff;
        }
        .state-reg-download {
            background-color: hotpink;
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
            <input class="query-input" type="search" onkeydown={this.onkeydownSearchInput}>
            <span class="search-button center-hv" onclick={this.onclickSearch}>
                <i class="icon-button fas fa-search" ></i></span>
            <span class="add-search-cond-button center-hv" onclick={this.onclickAddNicoSearchCond}>
                <i class="icon-button far fa-plus-square"></i></span>
        </div>      
    </div>
    <pagination ref="page" onmovepage={this.onmovePage}></pagination>
    <div class="search-grid-container">
        <div class="search-grid"></div>
    </div>

    <modal-dialog ref="search-dialog" oncancel={this.onCancelSearch}></modal-dialog>

    <script>
        /* globals app_base_dir riot obs */
        const {remote} = require("electron");
        const {Menu, MenuItem, dialog} = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { NicoSearchParams, NicoSearch } = require(`${app_base_dir}/js/niconico-search`);

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
                content += "<div class='state-content state-saved'>Local</div>";
            }
            if(dataContext.reg_download){
                content += "<div class='state-content state-reg-download'>download</div>";
            }
            return content;
        };
        const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
            return `<div class="line-break">${value}</div>`;
        };

        const columns = [
            {id: "thumb_img", name: "image", width: 130},
            {id: "name", name: "名前", formatter:lineBreakFormatter},
            {id: "info", name: "info", formatter:htmlFormatter},
            {id: "pub_date", name: "投稿日"},
            {id: "play_time", name: "時間"},
            {id: "tags", name: "タグ", formatter:lineBreakFormatter},
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("search-grid", columns, options);

        this.search = async () => {
            this.refs["search-dialog"].showModal("検索中...", ["cancel"], result=>{
                this.onCancelSearch();
            });

            grid_table.clearSelected();
            try {
                const search_result = await nico_search.search(nico_search_params);
                setData(search_result);            
            } catch (error) {
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "error",
                    buttons: ["OK"],
                    message: error.message
                });
            }

            this.refs["search-dialog"].close();
            resizeGridTable(); //only first?
        };

        this.onmovePage = async (page) => {
            nico_search_params.page(page);
            this.search();
        };

        this.onCancelSearch = () => {
            nico_search.cancel();
        };

        const setData = async (search_result) => {     
            const total_count = search_result.meta.totalCount;
            this.refs.page.setTotaCount(total_count);
            if(total_count<search_offset+search_limit){
                this.refs.page.setTotalPages(Math.ceil(total_count/search_limit));
            }else{
                this.refs.page.setTotalPages(Math.ceil((search_offset+search_limit)/search_limit))
            }
            const video_ids = search_result.data.map(value => {
                return value.contentId;
            });

            if(process.env.NODE_ENV == "SEARCH-PAGE-DEBUG"){
                const items = search_result.data.map(value => {
                    return {
                        thumb_img: value.thumbnailUrl,
                        id: value.contentId,
                        name: value.title,
                        info: `ID:${value.contentId}<br>再生:${value.viewCounter}<br>コメント:${value.commentCounter}`,
                        play_time: value.lengthSeconds,
                        pub_date: value.startTime,
                        tags: value.tags,
                        saved: false,
                        reg_download: false,
                    };
                });
                grid_table.setData(items);
                grid_table.scrollToTop();
            }

            const download_id_set = await new Promise((resolve, reject) => {
                obs.trigger("get-download-item-callback", (id_set)=>{
                    resolve(id_set);
                });
            });

            obs.trigger("get-library-data-callback", { video_ids: video_ids, cb: (id_map)=>{
                const items = search_result.data.map(value => {
                    const saved = id_map.has(value.contentId);
                    const reg_download = download_id_set.has(value.contentId);
                    return {
                        thumb_img: value.thumbnailUrl,
                        id: value.contentId,
                        name: value.title,
                        info: `ID:${value.contentId}<br>再生:${value.viewCounter}<br>コメント:${value.commentCounter}`,
                        play_time: value.lengthSeconds,
                        pub_date: value.startTime,
                        tags: value.tags,
                        saved: saved,
                        reg_download: reg_download,
                    };
                });
                grid_table.setData(items);
                grid_table.grid.scrollRowToTop(0); //TODO      
            }});
        };

        //TODO
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

            nico_search_params.sortTarget(this.sort_items[index].name);
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

        this.onclickSearch = (e) => {
            const elm = this.root.querySelector(".search-query-container > .query-input");
            const query = elm.value;
            nico_search_params.query(query);
            this.search();

            this.refs.page.resetPage();
        };

        this.onkeydownSearchInput = (e) =>{
            if(e.keyCode===13){
                const param = e.target.value;
                nico_search_params.query(param);
                this.search();
                this.refs.page.resetPage();
            }
        };

        this.onclickAddNicoSearchCond = (e) => {
            const elm = this.root.querySelector(".search-query-container > .query-input");
            const cond = {
                query: elm.value,
                sort_order: nico_search_params._sort_order,
                sort_name: nico_search_params._sort_name,
                search_kind: nico_search_params.search_kind,
                page: 1
            };

            obs.trigger("on_add_nico_search_cond", cond);
        };

        obs.on("on_change_nico_search_cond", (cond)=> {
            const elm = this.root.querySelector(".search-query-container > .query-input");
            elm.value = cond.query;
            nico_search_params.cond(cond.search_kind);
            nico_search_params.query(cond.query);
            nico_search_params.page(cond.page);
            nico_search_params.sortTarget(cond.sort_name);
            nico_search_params.sortOder(cond.sort_order);

            setSearchCondState(cond.sort_name, cond.sort_order, cond.search_kind);

            this.search();
            this.refs.page.resetPage();
        });

        //TODO
        obs.on("search-page:search-tag", (args)=> {
            const { query, search_kind } = args;
            const elm = this.root.querySelector(".search-query-container > .query-input");
            elm.value = query;
            nico_search_params.cond(search_kind);
            nico_search_params.query(query);
            
            setSearchCondState(null, null, search_kind);

            this.search();
            this.refs.page.resetPage();
        });

        obs.on("search-page:delete-download-ids", (ids)=> {
            if(grid_table.dataView.getLength()===0){
                return;
            }
            ids.forEach(id => {
                const item = grid_table.dataView.getItemById(id);
                if(item!==undefined){
                    item.reg_download = false;
                    grid_table.dataView.updateItem(id, item);
                }
            });
            grid_table.grid.render();
        });

        obs.on("search-page:complete-download-ids", (ids)=> {
            if(grid_table.dataView.getLength()===0){
                return;
            }
            ids.forEach(id => {
                const item = grid_table.dataView.getItemById(id);
                if(item!==undefined){
                    item.saved = true;
                    grid_table.dataView.updateItem(id, item);
                }
            });
            grid_table.grid.render();
        });

        const resizeGridTable = () => {
            const container = this.root.querySelector(".search-grid-container");
            grid_table.resizeFitContainer(container);
        };

        obs.on("search-page:add-download-items", (video_ids)=> {
            setDownloadTag(video_ids);
        });

        const setDownloadTag = (video_ids) => {
            video_ids.forEach(video_id => {
                const item = grid_table.dataView.getItemById(video_id);
                item.reg_download = true;
                grid_table.dataView.updateItem(video_id, item);
            });
            grid_table.grid.render();
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "bookmark", click() {
                    //TODO
                }},
                { label: "download", click() {
                    const items = grid_table.getSelectedDatas();
                    obs.trigger("download-page:add-download-items", items);
                    const video_ids = items.map(value => {
                        return value.id;
                    });
                    setDownloadTag(video_ids);
                }},
                { label: "delete download", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_ids = items.map(value => {
                        return value.id;
                    });
                    obs.trigger("download-page:delete-download-items", video_ids);
                    items.forEach(value => {       
                        const item = grid_table.dataView.getItemById(value.id);
                        item.reg_download = false;
                        grid_table.dataView.updateItem(value.id, item);
                    });
                    grid_table.grid.render();
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        const context_menu = createMenu();
        this.on("mount", () => {
            grid_table.init(this.root.querySelector(".search-grid"));

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                obs.trigger("play-by-videoid", video_id);
            });
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            resizeGridTable();
        });

        obs.on("resizeEndEvent", (size)=>{
            resizeGridTable();
        });
        
    </script>
</search-content>

<search-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>      
    
    <split-page-templete>
        <yield to="sidebar">
            <search-sidebar></search-sidebar>
        </yield>
        <yield to="main-content">
            <search-content></search-content>
        </yield>
    </split-page-templete>
</search-page>