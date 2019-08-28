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
            expand={true} 
            obs={obs_search}
            storname={storname}>
        </accordion>
    </div>

    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const obs = this.opts.obs; 
        this.obs_search = riot.observable();
        this.storname = "library-search";
        const store = this.riotx.get(this.storname);

        this.on("mount", () => {
            const file_path = SettingStore.getSettingFilePath(`${this.storname}.json`);
            try {
                this.json_store = new JsonStore(file_path);
                const items = this.json_store.load();
                store.commit("loadData", {items});
            } catch (error) { 
                const items = [];
                store.commit("loadData", {items});
                console.log(error);
            }
        });

        store.change("changed", (state, store) => {
            this.json_store.save(state.items);
        });

        const search_context_menu = Menu.buildFromTemplate([
            { 
                label: "削除", click() {
                    store.action("deleteList");
                }
            }
        ]);
        
        this.obs_search.on("show-contextmenu", (e) => {
            search_context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        obs.on("library-page:sidebar:add-search-item", (query) => {
            const items = [
                { title: query, query: query }
            ];
            store.action("addList", {items});
        });

        this.obs_search.on("item-dlbclicked", (item) => {
            obs.trigger("library-page:search-item-dlbclicked", item.query);
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
        <div class="item-info center-v">項目数 {this.num_filtered_items.toLocaleString()}/{this.num_items.toLocaleString()}</div>
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
        const { BookMark } = require(`${app_base_dir}/js/bookmark`);
        const { obsTrigger } = require(`${app_base_dir}/js/riot-obs`);
        const { showMessageBox, showOKCancelBox } = require(`${app_base_dir}/js/remote-dialogs`);
        const { ConvertMP4, needConvertVideo } = require(`${app_base_dir}/js/video-converter`);

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();
        const app_store = this.riotx.get("app");

        const obs_trigger = new obsTrigger(obs);

        let library = null;
        this.num_items = 0;
        this.num_filtered_items = 0;
    
        const libraryImageFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(dataContext.thumbnail_size=="L"){
                return `<img class="thumbnail-L" src="${value}"/>`;
            }
            return `<div class="thumbnail-wrap"><img class="thumbnail-S" src="${value}"></div>`;
        };
        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.id;
            const video_type = dataContext.video_type;
            return `<div>
                ID: ${video_id}<br>
                動画形式: ${video_type}<br>
                </div>`;
        };       
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 180, formatter: libraryImageFormatter},
            {id: "name", name: "名前", sortable: true},
            {id: "info", name: "情報", sortable: false, formatter: infoFormatter},
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

        const filterItems = (query) => {
            grid_table.filterData(query); 
            grid_table.scrollToTop();
            grid_table.clearSelected();

            this.num_filtered_items = grid_table.dataView.getLength();
        };

        this.onclickSearch = (e) => {
            const elm = getSearchInputElm();
            const query = elm.value; 
            filterItems(query);
        };

        this.onkeydownSearchInput = (e) => {
            if(e.keyCode===13){
                const param = e.target.value;
                filterItems(param);
            }
        };

        this.onclickClear = (e) => {
            const search_elm = getSearchInputElm();
            search_elm.value = "";
            filterItems(""); 
        };
    
        this.onclickAdd = () => {
            const search_elm = getSearchInputElm();
            const param = search_elm.value;
            if(!param){
                return;
            }
            obs.trigger("library-page:sidebar:add-search-item", param);
        };
        
        obs.on("library-page:search-item-dlbclicked", (item) => {
            const search_elm = getSearchInputElm();
            search_elm.value = item;   
            filterItems(item);      
        });

        obs.on("library-page:bookmark-item-dlbclicked", (item) => {
            const video_id = item.video_id;
            obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id);        
        });
    
        const loadLibraryItems = (items)=>{
            grid_table.setData(items);
            this.num_items = items.length;
            this.num_filtered_items = this.num_items;
    
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

        const convertVideo = async (self, video_id) => {
            const updateState = (state) => {
                grid_table.updateCell(video_id, "state", state);
            };

            try {
                const library_data = await library.getPlayData(video_id);
                const { video_data }  = library_data;
                const ffmpeg_path = SettingStore.getValue("ffmpeg-path", "");

                const cnv_mp4 = new ConvertMP4();

                self.obs_modal_dialog.trigger("show", {
                    message: "mp4に変換中...",
                    buttons: ["cancel"],
                    cb: (result)=>{
                        cnv_mp4.cancel();
                    }
                });

                cnv_mp4.on("cancel_error", async error=>{
                    console.log(error);
                    await showMessageBox("error", `中断失敗: ${error.message}`);
                });

                updateState("変換中");

                await cnv_mp4.convert(ffmpeg_path, video_data.src);
               
                await library.setFieldValue(video_id, "video_type", "mp4");
                const updated_item = await library.getLibraryItem(video_id);
                grid_table.updateItem(updated_item, video_id);

                await showMessageBox("info", "変換完了");
                updateState("変換完了");  

            } catch (error) {
                console.log(error);

                if(error.cancel === true){
                    await showMessageBox("info", "変換中断");
                    updateState("変換中断");   
                }else{
                    await showMessageBox("error", `変換失敗: ${error.message}`);
                    updateState("変換失敗");   
                }
            }finally{
                self.obs_modal_dialog.trigger("close");      
            }
        };

        const createConvertMenu = (self) => {
            const nemu_templete = [
                { label: "mp4に変換", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    (async()=>{
                        await convertVideo(self, video_id);
                    })();
                }}
            ];;
            return Menu.buildFromTemplate(nemu_templete);
        };

        //TODO
        const createMenu = () => {
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.playOnline(obs_trigger.Msg.MAIN_PLAY, video_id); 
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
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.name, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }}
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
                const video_type = data.video_type;
                if(needConvertVideo(video_type)){
                    const result = await showOKCancelBox("info", 
                        `動画が${video_type}のため再生できません\nmp4に変換しますか?`);
                    if(result!==0){
                        return;
                    }
                    await convertVideo(this, video_id);
                }else{
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }
            });
            
            const converter_context_menu = createConvertMenu(this);
            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                const items = grid_table.getSelectedDatas();
                const video_type = items[0].video_type;
                if(video_type=="mp4"){
                    context_menu.popup({window: remote.getCurrentWindow()});
                }else{
                    converter_context_menu.popup({window: remote.getCurrentWindow()});
                }
            });
            
            resizeGridTable();
            
            try {
                library = new Library();
                await library.init(SettingStore.getSettingDir());
                loadLibraryItems(await library.getLibraryItems());

                app_store.commit("updateLibrary", {library});

            } catch (error) {
                console.log("library.getLibraryItems error=", error);
                loadLibraryItems([]);
            }
        });

        obs.on("library-page:convert-video", async (args) => { 
            const video_id = args;
            await convertVideo(this, video_id);          
        });   

        obs.on("library-page:add-item", async (item) => { 
            const video_id = item.video_id;
            
            await new Promise((resolve, reject) => {
                app_store.action("addLibraryItem", {item});
                app_store.change("libraryItemChanged", async (state, store) => {
                    const library_item = await store.getter("libraryItem", {video_id});
                    grid_table.updateItem(library_item, video_id);
                    resolve();
                });
            });
            app_store.action("updateDownloadItem");
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