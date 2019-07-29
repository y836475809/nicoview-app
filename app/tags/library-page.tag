<library-sidebar>
    <style scoped>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        .bookmark-item {
            color:royalblue;
        }
    </style>

    <div class="library-sidebar">
        <accordion 
            title="ライブラリ検索" 
            items={search_data.items}
            expand={true} 
            obs={obs_accordion}>
        </accordion>
        <accordion 
            title="ブックマーク" 
            items={bookmark_data.items}
            expand={true} 
            obs={obs_bookmark}>
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
        this.obs_bookmark = riot.observable();

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

        const getBookmarkIcon = () => {
            return {
                name: "fas fa-bookmark fa-lg",
                class_name: "bookmark-item"
            };
        };

        const bookmark_file_path = SettingStore.getSettingFilePath("library-bookmark.json");
        try {
            this.bookmark_store = new JsonStore(bookmark_file_path);
            this.bookmark_data = this.bookmark_store.load();
            this.bookmark_data.items.forEach(value => {
                value.icon = getBookmarkIcon();
            });
        } catch (error) {
            this.bookmark_data = {
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
                    label: "削除", click() {
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

        obs.on("library-page:sidebar:boolmark:add-item", (item) => {
            this.obs_bookmark.trigger("add-items", [
                { 
                    title: item.title, 
                    video_id: item.video_id,
                    icon: getBookmarkIcon()
                }
            ]);
        });

        this.obs_bookmark.on("item-dlbclicked", (item) => {
            obs.trigger("library-page:bookmark:item-dlbclicked", item);
        });

        this.obs_bookmark.on("state-changed", (data) => {
            try {
                this.bookmark_store.save(data);
                console.log(data);
            } catch (error) {
                console.log(error);
            }
        });

        const self = this;
        const bookmark_context_memu = Menu.buildFromTemplate([
            { 
                label: "再生", click() {
                    self.obs_bookmark.trigger("get-selected-items", (items)=>{
                        if(items.length==0){
                            return;
                        }
                        const video_id = items[0].video_id;
                        obs.trigger("main-page:play-by-videoid", video_id);
                    });
                }
            },
            { 
                label: "この項目へスクロール", click() {
                    self.obs_bookmark.trigger("get-selected-items", (items)=>{
                        if(items.length==0){
                            return;
                        }
                        const video_id = items[0].video_id;
                        obs.trigger("library-page:scrollto", video_id);
                    });
                }
            },
            { 
                label: "削除", click() {
                    self.obs_bookmark.trigger("delete-selected-items");
                }
            },
        ]);

        this.obs_bookmark.on("show-contextmenu", (e) => {
            bookmark_context_memu.popup({window: remote.getCurrentWindow()}); 
        }); 
    </script>
</library-sidebar>

<library-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            --search-input-width: 200px;
            --search-button-size: 30px;
        }

        .library-controls-container,
        .library-controls-container .search-container {
            display: flex;
        }
        .library-controls-container .item-info{
            width: 150px;
            height: 30px;
            vertical-align: middle;
            user-select: none;
            padding-left: 5px;
        }
        .library-controls-container .search-container {
            margin-left: auto;
            margin-bottom: 4px;
        }
        
        .library-controls-container .search-input {
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
        <div class="item-info center-v">項目数 {this.num_items.toLocaleString()}</div>
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
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals app_base_dir */
        const {remote} = require("electron");
        const {Menu, MenuItem} = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { Library } = require(`${app_base_dir}/js/library`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoXMLFile, NicoJsonFile } = require(`${app_base_dir}/js/nico-data-file`);
        const { NicoUpdate } = require(`${app_base_dir}/js/nico-update`);

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        let library = null;
        this.num_items = 0;
    
        const libraryImageFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(dataContext.thumbnail_size=="L"){
                return `<img class="thumbnail-L" src="${value}"/>`;
            }
            return `<div class="thumbnail-wrap"><img class="thumbnail-S" src="${value}"></div>`;
        };
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 180, formatter: libraryImageFormatter},
            {id: "id", name: "id",sortable: true},
            {id: "name", name: "名前", sortable: true},
            {id: "creation_date", name: "作成日", sortable: true},
            {id: "pub_date", name: "投稿日", sortable: true},
            {id: "play_count", name: "再生回数", sortable: true},
            {id: "play_time", name: "時間", sortable: true},
            {id: "last_play_date", name: "最終再生日", sortable: true},
            {id: "state", name: "状況"}
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

        obs.on("library-page:bookmark:item-dlbclicked", (item) => {
            const video_id = item.video_id;
            obs.trigger("main-page:play-by-videoid", video_id);        
        });
    
        const loadLibraryItems = (items)=>{
            grid_table.setData(items);
            this.num_items = items.length;
    
            this.update();
        };

        const wait = async (msec) => {
            await new Promise(resolve => setTimeout(resolve, msec)); 
        };

        //TODO
        const updateNicoData = async (items, func) => {
            let update_cancel = false;
            let nico_update = null;
            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    if(nico_update){
                        nico_update.cancel();
                    }
                    update_cancel = true;
                }
            });
            
            try {
                let cur_update = 1;
                for(let item of items) {
                    if(update_cancel===true){
                        const error = new Error("cancel");
                        error.cancel=true;   
                        throw error;
                    }
                    
                    this.obs_modal_dialog.trigger("update-message", `更新中 ${cur_update}/${items.length}`);

                    grid_table.updateCell(item.id, "state", "更新中");
                    try {
                        nico_update = new NicoUpdate(item.id, library);
                        nico_update.on("updated-thumbnail", (thumbnail_size, img_src) => {
                            grid_table.updateCell(item.id, "thumbnail_size", thumbnail_size);
                            grid_table.updateCell(item.id, "thumb_img", `${img_src}?${new Date().getTime()}`);
                        });
                        await func(nico_update);

                        grid_table.updateCell(item.id, "state", "更新完了");
                    } catch (error) {
                        console.log(error);
                        if(error.cancel===true){   
                            grid_table.updateCell(item.id, "state", "更新キャンセル");
                            throw error;
                        }else{
                            this.obs_modal_dialog.trigger("update-message", `更新失敗 ${cur_update}/${items.length}`);
                            grid_table.updateCell(item.id, "state", `更新失敗: ${error.message}`);
                        }
                    }
                    if(cur_update < items.length){
                        await wait(1000);
                    }
                    cur_update++;
                }                
            } catch (error) {
                this.obs_modal_dialog.trigger("update-message", "更新キャンセル");
            }

            this.obs_modal_dialog.trigger("close");
        };
       
        //TODO
        const createMenu = () => {
            const nemu_templete = [
                { label: "ブックマークに追加", click() {
                    const items = grid_table.getSelectedDatas();
                    const item = items[0];
                    obs.trigger("library-page:sidebar:boolmark:add-item", {
                        title:item.name,
                        video_id:item.id
                    });
                }},
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs.trigger("main-page:play-by-videoid", video_id);
                }},
                { label: "コメント更新", click() {
                    const items = grid_table.getSelectedDatas();
                    updateNicoData(items, async (nico_update)=>{
                        await nico_update.updateComment();
                    });
                }},
                { label: "画像更新", click() {
                    const items = grid_table.getSelectedDatas();
                    updateNicoData(items, async (nico_update)=>{
                        await nico_update.updateThumbnail();
                    });
                }},
                { label: "動画以外を更新", click() {
                    const items = grid_table.getSelectedDatas();
                    updateNicoData(items, async (nico_update)=>{
                        await nico_update.update();
                    });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
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
            
            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
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

        obs.on("library-page:scrollto", async (video_id) => { 
            const rows = grid_table.getRowsByIds([video_id]);
            if(rows.length > 0){
                grid_table.scrollRow(rows[0], true);
                grid_table.setSelectedRows(rows);
            }
        });

        this.nico_update = null;
        obs.on("library-page:update-data", async (args) => { 
            const { video_id, update_target, cb } = args;
            try {
                //TODO
                this.nico_update = new NicoUpdate(video_id, library);
                
                if(update_target=="thumbinfo"){
                    await this.nico_update.updateThumbInfo();
                }else if(update_target=="comment"){
                    await this.nico_update.updateComment();
                }

                cb({ state:"ok", reason:null });
            } catch (error) {
                console.log(error);
                if(error.cancel===true){
                    cb({ state:"cancel", reason:null });
                }else if(/404:/.test(error.message)){
                    cb({ state:"404", reason:error });
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
            try {
                library = new Library();
                await library.init(SettingStore.getSettingDir());
                await library.setData(dir_list, video_list, mode); 
                loadLibraryItems(await library.getLibraryItems()); 
                cb(null);
            } catch (error) {
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