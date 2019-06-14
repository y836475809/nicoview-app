<library-sidebar>
    <style scoped>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <accordion 
            title="ライブラリ検索" 
            items={search_data.items}
            expand={true} 
            obs={obs_accordion}>
        </accordion>
    </div>

    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const obs = this.opts.obs; 
        this.obs_accordion = riot.observable();

        const seach_file_path = SettingStore.getSettingFilePath("library-search.json");
        try {
            this.store = new JsonStore(seach_file_path);
            this.search_data = this.store.load();
        } catch (error) {
            this.search_data = {
                is_expand: false, 
                items: []
            };
        }

        const save = (data) => {
            try {
                this.store.save(data);
            } catch (error) {
                console.log(error);
            }
        };

        const createMenu = (self) => {
            const nemu_templete = [
                { 
                    label: "delete", click() {
                        self.obs_accordion.trigger("delete-selected-items");
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        
        this.obs_accordion.on("show-contextmenu", (e) => {
            const context_menu = createMenu(this);
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        obs.on("library-page:sidebar:add-item", (query) => {
            this.obs_accordion.trigger("add-items", [
                { title: query, query: query }
            ]);
        });

        this.obs_accordion.on("item-dlbclicked", (item) => {
            obs.trigger("library-page:item-dlbclicked", item.query);
        });

        this.obs_accordion.on("state-changed", (data) => {
            save(data);
        });
    </script>
</library-sidebar>

<library-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            /* --right-width: 200px; */
            /* --search-input-width: 200px; */
            --search-button-size: 30px;
            /* display: flex; */
        }

        .library-controls-container,
        .library-controls-container .search-container {
            display: flex;
        }
        .library-controls-container .item-info{
            height: 30px;
            vertical-align: middle;
            user-select: none;
        }
        .library-controls-container .search-container {
            width: calc(var(--search-input-width) + var(--search-button-size) + 6px);
            margin: 0;
            margin-left: auto;
            margin-right: 15px;
            margin-bottom: 4px;     
        }
        
        .library-controls-container .filter-input {
            width: var(--search-input-width);
            height: var(--search-button-size);
        }

        .search-container > button {
            width: var(--search-button-size);
            height: var(--search-button-size);  
        }

        .search-container > button > i {
            font-size: 20px;
        }

        .add-button {
            margin-left: 30px;
        }

        .library-grid-container {
            width: 100%;
            height: calc(100vh - var(--search-button-size) - 4px);
            overflow: hidden;
        }

        .library-grid-container .slick-cell.l2.r2 {
            white-space: normal;
        }

        .thumbnail-wrap {
            height: 135px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .thumbnail-S {
            object-fit: contain;
            width: 130px;
            height: 100px;
        }
        .thumbnail-L {
            object-fit: contain;
            width: 180px;
            height: 135px;
        }
    </style>

    <div class="library-controls-container">
        <div class="item-info center-hv">項目数 {this.num_items}</div>
        <div class="search-container">
            <input class="search-input" type="search" onkeydown={onkeydownSearchInput} />
            <button class="search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </button>
            <button class="clear-button center-hv" title="検索条件クリア" onclick={onclickClear}>
                <i class="fas fa-ban"></i>
            </button>
            <button class="add-button center-hv" title="検索条件に追加" onclick={onclickAdd}>
                <i class="fas fa-plus"></i>
            </button>
        </div>
    </div>
    <div class="library-grid-container">
        <div class="library-grid"></div>
    </div>
    
    <script>
        /* globals app_base_dir */
        const {remote} = require("electron");
        const {Menu, MenuItem} = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { Library } = require(`${app_base_dir}/js/library`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoXMLFile, NicoJsonFile } = require(`${app_base_dir}/js/nico-data-file`);
        const { NicoUpdate } = require(`${app_base_dir}/js/nico-update`);
        const { XMLDataConverter } = require(`${app_base_dir}/js/xml-data-converter`);

        const obs = this.opts.obs; 
    
        let library = null;
        this.num_items = 0;
    
        const libraryImageFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(dataContext.db_type=="xml"){
                return `<div class="thumbnail-wrap"><img class="thumbnail-S" src="${value}"></div>`;
            }
            return `<img class="thumbnail-L" src="${value}"/>`;
        };
        const columns = [
            {id: "thumb_img", name: "image", width: 180, formatter: libraryImageFormatter},
            {id: "id", name: "id",sortable: true},
            {id: "name", name: "名前", sortable: true},
            {id: "creation_date", name: "作成日", sortable: true},
            {id: "pub_date", name: "投稿日", sortable: true},
            {id: "play_count", name: "再生回数", sortable: true},
            {id: "play_time", name: "時間", sortable: true},
            {id: "last_play_date", name: "最終再生日", sortable: true},
            {id: "state", name: "state"}
        ];
        const options = {
            rowHeight: 135,
            _saveColumnWidth: true,
            _saveSort: true,
        };   
        const grid_table = new GridTable("library-grid", columns, options);
    
        const getSearchInputElm = () => {
            return this.root.querySelector(".search-container > .search-input");
        };
        this.onclickSearch = (e) => {
            const elm = getSearchInputElm();
            const query = elm.value; 
            grid_table.filterData(query); 
        };

        this.onkeydownSearchInput = (e) => {
            if(e.keyCode===13){
                const param = e.target.value;
                grid_table.filterData(param);
            }
        };

        this.onclickClear = (e) => {
            const search_elm = getSearchInputElm();
            search_elm.value = "";
            grid_table.filterData(""); 
        };
    
        this.onclickAdd = () => {
            const search_elm = getSearchInputElm();
            const param = search_elm.value;
            if(!param){
                return;
            }
            obs.trigger("library-page:sidebar:add-item", param);
        };
        
        obs.on("library-page:item-dlbclicked", (item) => {
            const search_elm = getSearchInputElm();
            search_elm.value = item;
            grid_table.filterData(item);         
        });
    
        const loadLibraryItems = (items)=>{
            grid_table.setData(items);
            this.num_items = items.length;
    
            this.update();
        };
    
        const menu = new Menu();
        menu.append(new MenuItem({
            label: "Play", click() {
                const items = grid_table.getSelectedDatas();
                console.log("lib context menu data=", items);
            }
        }));
        menu.append(new MenuItem({ type: "separator" }));
        menu.append(new MenuItem({
            label: "Update", click() {
                const cnv_data = new XMLDataConverter();
                const items = grid_table.getSelectedDatas();
                items.forEach(async item => {   
                    grid_table.updateCell(item.id, "state", "更新中");
                    try {
                        await cnv_data.convert(library, item.id);
                        const nico_update = new NicoUpdate(item.id, library);
                        await nico_update.update();
                        grid_table.updateCell(item.id, "state", "更新完了");
                    } catch (error) {
                        console.log(error);
                        grid_table.updateCell(item.id, "state", "更新失敗");
                    }
                });
            }
        }));

        this.on("mount", async () => {    
            grid_table.init(this.root.querySelector(".library-grid"));
    
            grid_table.setFilter((column_id, value, word) => { 
                if(column_id=="thumb_img"){
                    //画像のパスは対象外
                    return false;
                }
                if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                    return true;
                }   
                return false; 
            });
    
            grid_table.onDblClick(async (e, data)=>{
                console.log("onDblClick data=", data);
                const video_id = data.id;
                obs.trigger("main-page:play-by-videoid", video_id);
            });
            
            grid_table.onContextMenu((e)=>{
                menu.popup({window: remote.getCurrentWindow()});
            });
            
            resizeGridTable();
            
            try {
                library = new Library();
                await library.init(SettingStore.getSettingDir());
                loadLibraryItems(await library.getLibraryItems());
            } catch (error) {
                console.log("library.getLibraryItems error=", error);
                loadLibraryItems([]);
            }
        });
    
        obs.on("library-page:refresh", async () => {     
            try {
                library = new Library();
                await library.init(SettingStore.getSettingDir());
                loadLibraryItems(await library.getLibraryItems());
            } catch (error) {
                console.log("library.getLibraryItems error=", error);
                loadLibraryItems([]);
            }
        });
    
        obs.on("library-page:get-data-callback", async (args) => { 
            const { video_ids, cb } = args;
            const ret = new Map();
            for (let index = 0; index < video_ids.length; index++) {
                const id = video_ids[index];
                try {
                    const library_data = await library.getPlayData(id); 
                    ret.set(id, library_data);
                } catch (error) {
                    //pass
                }            
            }
            cb(ret);
        }); 
    
        obs.on("library-page:add-item", async (item) => { 
            //TODO
            await library.addItem(item);
            const library_item = await library.getLibraryItem(item.video_id);
            grid_table.updateItem(library_item, library_item.id);
        });  

        obs.on("library-page:play", async (item) => { 
            const video_id = item.id;
            const library_item = await library.getLibraryItem(video_id);
            if(library_item===null){
                return;
            }

            const last_play_date = new Date().getTime();
            const play_count = library_item.play_count + 1;
            library_item.last_play_date = last_play_date; 
            library_item.play_count = play_count;
            grid_table.updateItem(library_item, video_id);
            await library.setFieldValue(video_id, "last_play_date", last_play_date);
            await library.setFieldValue(video_id, "play_count", play_count);
        });

        this.nico_update = null;
        obs.on("library-page:update-data", async (args) => { 
            const { video_id, cb } = args;
            try {
                const cnv_data = new XMLDataConverter();
                await cnv_data.convert(library, video_id);
                this.nico_update = new NicoUpdate(video_id, library);
                await this.nico_update.update();
                cb({ state:"ok", reason:null });
            } catch (error) {
                console.log(error);
                if(error.cancel===true){
                    cb({ state:"cancel", reason:null });
                }else{
                    cb({ state:"error", reason:error });
                }     
            }
        });  

        obs.on("library-page:cancel-update-data", (args) => { 
            if(this.nico_update){
                this.nico_update.cancel();
            }
        });
    
        obs.on("library-page:import-data", async (args) => { 
            const { data, cb } = args;
            const { dir_list, video_list, mode } = data; 
            console.log("mode=", mode)
            try {
                library = new Library();
                await library.init(SettingStore.getSettingDir());
                await library.setData(dir_list, video_list, mode); 
                loadLibraryItems(await library.getLibraryItems()); 
                cb(null);
            } catch (error) {
                loadLibraryItems([]);
                cb(error);
            }
        }); 
    
        const resizeGridTable = () => {
            const container = this.root.querySelector(".library-grid-container");
            grid_table.resizeFitContainer(container);
        };
    
        obs.on("window-resized", ()=> {
            resizeGridTable();
        });
    </script>
</library-content>

<library-page>
    <div class="split-page">
        <div class="left">
            <library-sidebar obs={obs}></library-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <library-content obs={obs}></library-content>
        </div>
    </div>
    <script>
        this.obs = this.opts.obs;
    </script>
</library-page>