<library-sidebar>
    <style scoped>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <listview 
            obs={obs_listview}
            name={name}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const { remote } = window.electron;
        const ipc = window.electron.ipcRenderer;
        const {Menu} = remote;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.name = "library-search";

        this.on("mount", async () => {
            const items = await ipc.invoke("library-search:getItems");
            this.obs_listview.trigger("loadData", { items });
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            await ipc.invoke("library-search:updateItems", { items });
        });

        const createMenu = (self) => {
            return  Menu.buildFromTemplate([
                { 
                    label: "削除", click() {
                        self.obs_listview.trigger("deleteList");
                    }
                }
            ]);
        };
        
        this.obs_listview.on("show-contextmenu", (e) => {
            const context_menu = createMenu(this);
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        obs.on("library-page:sidebar:add-search-item", (query) => {
            const items = [
                { title: query, query: query }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            obs.trigger("library-page:search-item-dlbclicked", item.query);
        });
    </script>
</library-sidebar>

<library-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            --search-input-width: 250px;
            --search-button-size: 30px;
            --margin: 5px;
        }

        .library-controls-container {
            margin-bottom: var(--margin);
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
        }
        
        .library-controls-container .search-input {
            width: var(--search-input-width);
            height: var(--search-button-size);
            font-size: 1.2em;

            border-width: 1px;
            border-right-width: 0px !important;
            border-style: solid;
            border-color: gray;
        }
        .library-controls-container .search-input:focus {
            outline: none;
        }

        .search-container > div {
            width: var(--search-button-size);
            height: var(--search-button-size); 
            background-color: white; 
        }
        .search-container > div > i {
            font-size: 20px;
            color: gray;
        }
        .search-container > div > i:hover {
            color: black;
        }
        .search-container > .search-button,
        .search-container > .clear-button {
            border: 1px solid gray;
        }
        .search-container > .search-button {
            border-left-width: 0px !important;
            border-right-width: 0px !important;
            width: 20px;
        }
        .search-container > .clear-button {
            border-left-width: 0px !important;
            width: 25px;
        }
        .search-container > .search-button > i,
        .search-container > .clear-button > i {
            font-size: 1.2em;
        }

        .search-container > .add-button {
            background-color: rgba(0, 0, 0, 0);
        }

        .search-button,
        .clear-button,
        .add-button {
            cursor: pointer;
        }

        .library-grid-container {
            width: 100%;
            height: calc(100% - var(--search-button-size) - var(--margin));
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
        <div class="item-info center-v">項目数 {num_filtered_items.toLocaleString()}/{num_items.toLocaleString()}</div>
        <div class="search-container">
            <input class="search-input" placeholder="検索" onkeydown={onkeydownSearchInput} />
            <div class="search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </div>
            <div class="clear-button center-hv" title="全て表示" onclick={onclickShowAll}>
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="add-button center-hv" title="検索条件を保存" onclick={onclickSaveSearch}>
                <i class="far fa-star"></i>
            </div>
        </div>
    </div>
    <div class="library-grid-container">
        <div class="library-grid"></div>
    </div>
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const {remote, ipcRenderer } = window.electron;
        const ipc = window.electron.ipcRenderer;
        const { Menu } = remote;
        const { GridTable, wrapFormatter, buttonFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { NicoUpdate } = window.NicoUpdate;
        const { showMessageBox, showOKCancelBox } = window.RendererDailog;
        const { ConvertMP4, needConvertVideo } = window.VideoConverter;
        const { NicoVideoData } = window.NicoVideoData;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { JsonDataConverter } = window.NicoDataConverter;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        ipcRenderer.on("libraryItemAdded", async (event, args) => {
            const {video_item} = args;
            const video_data = new NicoVideoData(video_item);
            const video_id = video_item.id;
            video_item.thumb_img = video_data.getThumbImgPath();
            video_item.tags = video_item.tags ? video_item.tags.join(" ") : "";
            grid_table.updateItem(video_item, video_id);
        });

        ipcRenderer.on("libraryItemDeleted", async (event, args) => {
            const { video_id } = args;
            grid_table.deleteItemById(video_id);
        });

        ipcRenderer.on("libraryItemUpdated", (event, args) => {
            const {video_id, props} = args;
            logger.debug("libraryItemUpdated video_id=", video_id, " props=", props);

            props.tags = props.tags ? props.tags.join(" ") : "";
            grid_table.updateCells(video_id, props);
        });

        ipcRenderer.on("libraryInitialized", (event, args) =>{
            const {items} = args;
            const library_items = items.map(value=>{
                const video_data = new NicoVideoData(value);
                value.thumb_img = video_data.getThumbImgPath();
                value.tags = value.tags ? value.tags.join(" ") : "";
                return value;
            });
            loadLibraryItems(library_items);
        });

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
            const video_quality = dataContext.is_economy?"画質: エコノミー":"";
            return `<div>
                ID: ${video_id}<br>
                動画形式: ${video_type}<br>
                ${video_quality}
                </div>`;
        };       

        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 180, formatter: libraryImageFormatter},
            {id: "title", name: "名前", sortable: true, formatter: wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark"])},
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
            this.update();
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

        this.onclickShowAll = (e) => {
            const search_elm = getSearchInputElm();
            search_elm.value = "";
            filterItems(""); 
        };
    
        this.onclickSaveSearch = () => {
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
            ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                video_id : video_id,
                time : 0,
                online: false
            });     
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
            
            let cur_update = 0; 
            const error_items = [];
            try {
                 
                for(let item of items) {
                    if(update_cancel===true){
                        const error = new Error("cancel");
                        error.cancel=true;   
                        throw error;
                    }
                    
                    cur_update++;
                    this.obs_modal_dialog.trigger("update-message", 
                        `更新中 ${cur_update}/${items.length} 失敗:${error_items.length}`);

                    grid_table.updateCell(item.id, "state", "更新中");
                    try {
                        const video_item = await ipc.invoke("library:getItem", {video_id:item.id});
                        nico_update = new NicoUpdate(video_item);
                        nico_update = new NicoUpdate(video_item);
                        nico_update.on("updated", async (video_id, props, update_thumbnail) => {
                            await ipc.invoke("library:updateItemProps", {video_id, props});
                            if(update_thumbnail){
                                const updated_video_item = await ipc.invoke("library:getItem", {video_id});
                                const video_data = new NicoVideoData(updated_video_item);
                                const thumb_img = `${video_data.getThumbImgPath()}?${new Date().getTime()}`;
                                grid_table.updateCells(video_id, {thumb_img});
                            }
                        });
                        await func(nico_update);

                        grid_table.updateCell(item.id, "state", "更新完了");
                    } catch (error) {
                        if(error.cancel===true){   
                            grid_table.updateCell(item.id, "state", "更新キャンセル");
                            throw error;
                        }else{
                            error_items.push(item);
                            logger.error(error);
                            grid_table.updateCell(item.id, "state", `更新失敗: ${error.message}`);
                        }
                    }
                    if(cur_update < items.length){
                        await wait(1000);
                    }
                    this.obs_modal_dialog.trigger("update-message", 
                        `更新中 ${cur_update}/${items.length} 失敗:${error_items.length}`);
                }                
            } catch (error) {
                this.obs_modal_dialog.trigger("update-message", "更新キャンセル");
            }

            this.obs_modal_dialog.trigger("close");
            
            if(error_items.length > 0){
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "error",
                    title: `${error_items.length}個が更新に失敗しました`,
                    message: "詳細はログを参照",
                });
            }else{
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "info",
                    title: "",
                    message: `更新完了(${cur_update}/${items.length})`,
                });
            }
        };

        const convertNicoDataToNNDD = async (items) => {
            let cnv_cancel = false;
            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    cnv_cancel = true;
                }
            });
            
            let cur_update = 0;
            const error_items = [];
            try {    
                for(let item of items) {
                    if(cnv_cancel===true){
                        const error = new Error("cancel");
                        error.cancel=true;   
                        throw error;
                    }
                    
                    cur_update++;
                    this.obs_modal_dialog.trigger("update-message", 
                        `NNDD形式に変換中 ${cur_update}/${items.length} 失敗:${error_items.length}`);

                    grid_table.updateCell(item.id, "state", "変換中");
                    try {
                        const video_item = await ipc.invoke("library:getItem", {video_id:item.id});
                        if(video_item.data_type == "json"){
                            const cnv_nico = new JsonDataConverter(video_item);
                            await cnv_nico.convertThumbInfo();
                            await cnv_nico.convertComment();
                            await cnv_nico.convertThumbnai();
                            grid_table.updateCell(item.id, "state", "変換完了");
                        }else{
                            grid_table.updateCell(item.id, "state", "変換不要");
                        }
                    } catch (error) {
                        if(error.cancel===true){   
                            grid_table.updateCell(item.id, "state", "変換キャンセル");
                            throw error;
                        }else{
                            error_items.push(item);
                            logger.error(error);
                            grid_table.updateCell(item.id, "state", `変換失敗: ${error.message}`);
                        }
                    }
                    if(cur_update < items.length){
                        await wait(100);
                    }
                    this.obs_modal_dialog.trigger("update-message", 
                        `NNDD形式に変換中 ${cur_update}/${items.length} 失敗:${error_items.length}`);
                }                
            } catch (error) {
                this.obs_modal_dialog.trigger("update-message", "変換キャンセル");
            }

            this.obs_modal_dialog.trigger("close");

            if(error_items.length > 0){
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "error",
                    title: `${error_items.length}個がNNDD形式への変換に失敗しました`,
                    message: "詳細はログを参照",
                });
            }else{
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "info",
                    title: "",
                    message: `NNDD形式への変換完了(${cur_update}/${items.length})`,
                });
            }
        };

        const deleteLibraryData = async (video_ids) => {
            let cancel = false;
            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    cancel = true;
                }
            });
            
            for (let index = 0; index < video_ids.length; index++) {
                if(cancel===true){
                    break;
                }
                const video_id = video_ids[index];
                this.obs_modal_dialog.trigger("update-message", `${video_id}を削除中`);
                const result = await ipcRenderer.invoke(IPC_CHANNEL.DELETE_LIBRARY_ITEMS, { video_id });
                // await wait(3000);
                // const result =  {
                //     success : true,
                //     error : null
                // };  
                if(result.success===false){
                    await showMessageBox("error", `失敗\n${result.error.message}`);
                }
            }
            this.obs_modal_dialog.trigger("close");
        };

        const convertVideo = async (self, video_id) => {
            const updateState = (state) => {
                grid_table.updateCell(video_id, "state", state);
            };

            try {
                const video_item = await ipc.invoke("library:getItem", {video_id});
                const video_data = new NicoVideoData(video_item);
                const ffmpeg_path = await ipc.invoke("config:get", { key:"ffmpeg_path", value:"" });

                const cnv_mp4 = new ConvertMP4();

                self.obs_modal_dialog.trigger("show", {
                    message: "mp4に変換中...",
                    buttons: ["cancel"],
                    cb: (result)=>{
                        cnv_mp4.cancel();
                    }
                });

                cnv_mp4.on("cancel_error", async error=>{
                    logger.error(error);
                    await showMessageBox("error", `中断失敗: ${error.message}`);
                });

                updateState("変換中");

                await cnv_mp4.convert(ffmpeg_path, video_data.getVideoPath());
               
                const props = {video_type:"mp4"};
                await ipc.invoke("library:updateItemProps", {video_id, props});

                await showMessageBox("info", "変換完了");
                updateState("変換完了");  

            } catch (error) {
                if(error.cancel === true){
                    await showMessageBox("info", "変換中断");
                    updateState("変換中断");   
                }else{
                    logger.error(error);
                    await showMessageBox("error", `変換失敗: ${error.message}`);
                    updateState("変換失敗");   
                }
            }finally{
                self.obs_modal_dialog.trigger("close");      
            }
        };

        const createConvertMenu = (self) => {
            const menu_templete = [
                { label: "mp4に変換", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    (async()=>{
                        await convertVideo(self, video_id);
                    })();
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const play = async (item, online) => {
            const video_id = item.id;
            const video_type = item.video_type;

            if(!online && needConvertVideo(video_type)){
                if(!await showOKCancelBox("info", 
                    `動画が${video_type}のため再生できません\nmp4に変換しますか?`)){
                    return;
                }
                await convertVideo(this, video_id);
            }else{
                Command.play(item, online);
            }
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", async click() {
                    const items = grid_table.getSelectedDatas();
                    await play(items[0], false);
                }},
                { label: "オンラインで再生", async click() {
                    const items = grid_table.getSelectedDatas();
                    await play(items[0], true);
                }},
                { label: "後で見る", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.addStackItems(obs, items);
                }},
                { type: "separator" },
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
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.addBookmarkItems(obs, items);
                }},
                { type: "separator" },
                { label: "NNDD形式(XML)に変換", async click() {
                    const items = grid_table.getSelectedDatas();
                    await convertNicoDataToNNDD(items);
                }},
                { type: "separator" },
                { label: "削除", async click() {
                    const items = grid_table.getSelectedDatas();
                    const video_ids = items.map(item => item.id);
                    if(!await showOKCancelBox("info", "動画を削除しますか?")){
                        return;
                    }
                    await deleteLibraryData(video_ids);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };
        this.on("mount", async () => {    
            grid_table.init(".library-grid");
            grid_table.setupResizer(".library-grid-container");
    
            grid_table.setFilter((column_id, value, word) => { 
                if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                    return true;
                }   
                return false; 
            },
            ["title", "id", "is_economy", "tags", "video_type"],
            (item, column_id)=>{
                if(column_id=="is_economy"){
                    return item[column_id]?"エコノミー":"";
                }
                return String(item[column_id]);
            });
    
            grid_table.onDblClick(async (e, data)=>{
                logger.debug("library onDblClick data=", data);
                await play(data, false);
            });

            grid_table.onButtonClick(async (e, cmd_id, data)=>{
                if(cmd_id == "play"){
                    logger.debug("library onButtonClick data=", data);
                    await play(data, false);
                }

                if(cmd_id == "stack"){
                    Command.addStackItems(obs, [data]);
                }

                if(cmd_id == "bookmark"){
                    Command.addBookmarkItems(obs, [data]);
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
            
            try {
                await ipc.invoke("library:load");
            } catch (error) {
                logger.error(error);
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "error",
                    title: "ライブラリの読み込み失敗",
                    message: error.message,
                });
                // loadLibraryItems([]);
            }
        });

        obs.on("library-page:convert-video", async (args) => { 
            const video_id = args;
            await convertVideo(this, video_id);          
        });   
        
        obs.on("library-page:play", async (item) => { 
            const video_id = item.id;
            const video_item = await ipc.invoke("library:getItem", {video_id});
            if(video_item===null){
                return;
            }
           
            const props = { 
                last_play_date : new Date().getTime(),
                play_count : video_item.play_count + 1
            };
            logger.debug("update library video_id=", video_id, ", props=", props);
            await ipc.invoke("library:updateItemProps", {video_id, props});
        });

        obs.on("library-page:scrollto", async (video_id) => { 
            const rows = grid_table.getRowsByIds([video_id]);
            if(rows.length > 0){
                grid_table.scrollRow(rows[0], true);
                grid_table.setSelectedRows(rows);
            }
        });


        obs.on("css-loaded", () => {
            grid_table.resizeGrid();
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