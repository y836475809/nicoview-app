<library-sidebar>
    <style scoped>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <accordion params={acdn_search}></accordion>
    </div>

    <script>
        /* globals app_base_dir obs */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const seach_file_path = SettingStore.getSystemFile("library-search.json");

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
            title : "ライブラリ検索",
            name: "search",
            expand: true,
            items: this.search_data.items,
            oncontextmenu: ()=> {
                const menu = createMenu("search");
                menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on(`${this.acdn_search.name}-dlbclick-item`, (item) => {
            obs.trigger("on_change_search_item", item.query);
        });

        obs.on(`${this.acdn_search.name}-state-change`, (data) => {
            save(data);
        });
        
        obs.on("on_add_search_item", (query) => {
            obs.trigger(`${this.acdn_search.name}-add-items`, 
                [
                    { title: query, query: query }
                ]
            );
            obs.trigger(`${this.acdn_search.name}-change-expand`, true);
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
        .library-controls-container .filter-button { 
            margin: auto;
            width: var(--search-button-size);
            height: var(--search-button-size);
        }
        .library-controls-container .filter-input {
            width: var(--search-input-width);
            height: var(--search-button-size);
        }

        .library-controls-container .filter-button {
            color: darkgray;
            font-size: 30px;
        }
        .library-controls-container .filter-button > i:hover {
            opacity: 0.5;
            cursor: pointer; 
        } 

        .library-grid-container .slick-cell.l2.r2 {
            white-space: normal;
        }
    </style>

    <div class="library-controls-container">
        <div class="item-info center-hv">項目数 {this.num_items}</div>
        <div class="search-container">
            <input class="filter-input" type="search" onkeydown={onkeydownSearchInput} />
            <span class="filter-button" onclick={onclickAdd}>
                <i class="far fa-fw fa-plus-square center-hv"></i></span>
        </div>
    </div>
    <div class="library-grid-container">
        <div class="library-grid"></div>
    </div>
    
    <script>
        /* globals app_base_dir obs */
        const {remote} = require("electron");
        const {Menu, MenuItem} = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const Library = require(`${app_base_dir}/js/library`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const DBConverter = require(`${app_base_dir}/js/db-converter`);
        const { NicoXMLFile, NicoJsonFile } = require(`${app_base_dir}/js/nico-data-file`);
        const { XMLDataConverter } = require(`${app_base_dir}/js/xml-data-converter`);
        const fs = require("fs");
    
        let library = null;
        this.num_items = 0;
    
        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130},
            {id: "id", name: "id",sortable: true},
            {id: "name", name: "名前", sortable: true},
            {id: "creation_date", name: "作成日", sortable: true},
            {id: "pub_date", name: "投稿日", sortable: true},
            {id: "play_count", name: "再生回数", sortable: true},
            {id: "play_time", name: "時間", sortable: true},
            {id: "state", name: "state"}
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
            _saveSort: true,
        };   
        const grid_table = new GridTable("library-grid", columns, options);
    
        this.onkeydownSearchInput = (e) => {
            if(e.keyCode===13){
                const param = e.target.value;
                grid_table.filterData(param);
            }
        };
    
        this.onclickAdd = () => {
            const search_elm = this.root.querySelector(".filter-input");
            const param = search_elm.value;
            if(!param){
                return;
            }          
            obs.trigger("on_add_search_item", param);
        };
        
        obs.on("on_change_search_item", (param)=> {
            const search_elm = this.root.querySelector(".filter-input");
            search_elm.value = param;
            grid_table.filterData(param);
        });
    
        const loadLibraryItems = (items)=>{
            grid_table.setData(items);
            this.num_items = items.length;
    
            this.update();
        };

        //TODO
        const convertData = async(video_id) => {
            try {
                const cnv_data = new XMLDataConverter();
                await cnv_data.convert(library, video_id);
            } catch (error) {
                throw error;
            }
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
                const items = grid_table.getSelectedDatas();
                items.forEach(async item => {   
                    grid_table.updateCell(item.id, "state", "更新中");
                    try {
                        await convertData(item.id);
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
                obs.trigger("play-by-videoid", video_id);
            });
            
            grid_table.onContextMenu((e)=>{
                menu.popup({window: remote.getCurrentWindow()});
            });
            
            resizeGridTable();
            
            try {
                library = new Library();
                await library.init(SettingStore.getSystemFile("library.db"));
                loadLibraryItems(await library.getLibraryData());
            } catch (error) {
                console.log("library.getLibraryData error=", error);
                loadLibraryItems([]);
            }
        });
    
        obs.on("refresh_library", async () => {     
            try {
                library = new Library();
                await library.init(SettingStore.getSystemFile("library.db"));
                loadLibraryItems(await library.getLibraryData());
            } catch (error) {
                console.log("library.getLibraryData error=", error);
                loadLibraryItems([]);
            }
        });
    
        obs.on("get-library-data-callback", async (args) => { 
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
    
        obs.on("get-library-items-from-file", async (db_file_path) => { 
            try {
                library = new Library();
                await library.init(db_file_path);
                loadLibraryItems(await library.getLibraryData());
            } catch (error) {
                console.log("library.getLibraryData error=", error);
                loadLibraryItems([]);
            }
        });  
    
        obs.on("add-library-item", async (item) => { 
            //TODO
            await library.addItem(item);
            const library_item = await library.getLibraryItem(item.video_id);
            grid_table.updateItem(library_item, library_item.id);
        });  
    
        const importDB = async (sqlite_file_path)=>{
            const system_dir = SettingStore.getSystemDir();
            try {
                fs.statSync(system_dir);
            } catch (error) {
                if (error.code === "ENOENT") {
                    fs.mkdirSync(system_dir);
                }
            }
    
            const db_converter = new DBConverter();
            db_converter.init(sqlite_file_path);
            db_converter.read();
            const dir_list = db_converter.get_dirpath();
            const video_list = db_converter.get_video();
    
            library = new Library();
            await library.init(SettingStore.getSystemFile("library.db"));
            await library.setData(dir_list, video_list);  
        };
    
        obs.on("import-library-from-sqlite", async (sqlite_file_path) => { 
            try {
                await importDB(sqlite_file_path);
                loadLibraryItems(await library.getLibraryData());
                obs.trigger("import-library-from-sqlite-rep", null);
            } catch (error) {
                console.log("library.getLibraryData error=", error);
                loadLibraryItems([]);
                obs.trigger("import-library-from-sqlite-rep", error);
            }
        });  
    
        const resizeGridTable = () => {
            const container = this.root.querySelector(".library-grid-container");
            grid_table.resizeFitContainer(container);
        };
    
        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });
    
        obs.on("library_dt_search", (param)=> {
            grid_table.filterData(param);
        });
    </script>
</library-content>

<library-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>

    <split-page-templete>
        <yield to="sidebar">
            <library-sidebar></library-sidebar>
        </yield>
        <yield to="main-content">
            <library-content></library-content>
        </yield>
    </split-page-templete>
</library-page>