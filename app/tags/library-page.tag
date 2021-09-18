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
            name={name}
            geticon={geticon}
            gettooltip={gettooltip}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.name = "library-search";
        this.gettooltip = this.opts.gettooltip;
        this.geticon = this.opts.geticon;

        this.on("mount", async () => {
            const items = await myapi.ipc.Library.getSearchItems();
            this.obs_listview.trigger("loadData", { items });
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            await myapi.ipc.Library.updateSearchItems(items);
        });
        
        this.obs_listview.on("show-contextmenu", (e, args) => {
            const { items, cb } = args;
            cb(null);
        });

        obs.on("library-page:sidebar:add-search-item", (args) => {
            const { item } = args;
            this.obs_listview.trigger("addList", { items:[item] });
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            obs.trigger("library-page:search-item-dlbclicked", item);
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

        .search-target-container {
            display: flex;
            margin-left: auto;
        }
        .search-target-none {
            display: none;
        }
        .search-target {
            margin-right: 5px;
            user-select: none;
        }
        .search-target > input[type=checkbox] +label {
            cursor: pointer;
            height: 30px;
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

        .button {
            width: var(--search-button-size);
            height: var(--search-button-size); 
            background-color: white;
            cursor: pointer; 
        }
        .button > i {
            font-size: 20px;
            color: gray;
        }
        .button > i:hover {
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

        .search-container > .toggle-target-button > i {
            font-size: 15px;
        }

        .search-container > .add-button,
        .search-container > .toggle-target-button {
            background-color: rgba(0, 0, 0, 0);
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
            <div class="search-target-container search-target-none">
                <div class="search-target center-v" each={item in search_targets} >
                    <input type="checkbox" id={getSearchTargetElmID(item.id)} />
                        <label for={getSearchTargetElmID(item.id)} class="center-v">{item.title}</label>
                </div>
            </div>
            <div class="button toggle-target-button center-hv" title="検索対象選択の切り替え" onclick={onclickToggleSearchTargets}>
                <i class="fas fa-filter"></i>
            </div>
            <input class="search-input" placeholder="検索" onkeydown={onkeydownSearchInput} />
            <div class="button search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </div>
            <div class="button clear-button center-hv" title="全て表示" onclick={onclickShowAll}>
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="button add-button center-hv" title="検索条件を保存" onclick={onclickSaveSearch}>
                <i class="far fa-star"></i>
            </div>
        </div>
    </div>
    <div class="library-grid-container">
        <div class="library-grid"></div>
    </div>

    <script>
        /* globals riot logger ModalDialog */
        const myapi = window.myapi;
        const { GridTable, wrapFormatter, buttonFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { NicoUpdate } = window.NicoUpdate;
        const { ConvertMP4, needConvertVideo } = window.VideoConverter;
        const { NicoVideoData } = window.NicoVideoData;
        const { JsonDataConverter } = window.NicoDataConverter;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();
        let modal_dialog = null;

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_data = new NicoVideoData(video_item);
            const video_id = video_item.id;
            video_item.thumb_img = video_data.getThumbImgPath();
            video_item.tags = video_item.tags ? video_item.tags.join(" ") : "";
            grid_table.updateItem(video_item, video_id);
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            grid_table.deleteItemById(video_id);
        });

        myapi.ipc.Library.onUpdateItem((args) => {
            const {video_id, props} = args;
            logger.debug("library:on-update-item video_id=", video_id, " props=", props);

            if(Array.isArray(props.tags)){
                props.tags = props.tags.join(" ");
            }
            grid_table.updateCells(video_id, props);
        });

        myapi.ipc.Library.onInit((args) =>{
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

        this.search_targets = this.opts.search_targets;
        this.getSearchTargetElmID = (id) => {
            return `search-target-${id}`;
        };
        const getSearchTargetElm = (target_id) => {
            const id = this.getSearchTargetElmID(target_id);
            return this.root.querySelector(`#${id}`);
        };
        const getSearchTargetEnable = () => {
            const elm = this.root.querySelector(".search-target-container");
            return elm.classList.contains("search-target-none") === false;
        };
        const setSearchTargetEnable = (enable) => {
            const elm = this.root.querySelector(".search-target-container");
            if(enable){
                elm.classList.remove("search-target-none");
            }else if(getSearchTargetEnable()){
                this.search_targets.forEach(target=>{
                    const elm = getSearchTargetElm(target.id);
                    elm.checked = false;
                }); 
                elm.classList.add("search-target-none");
            }
        };
        this.onclickToggleSearchTargets = (e) => {
            const enable = getSearchTargetEnable();
            setSearchTargetEnable(!enable);
        };
        const getSearchTargetIDs = () => { 
            if(!getSearchTargetEnable()){
                return null;
            }

            const target_ids = [];
            this.search_targets.forEach(target=>{
                const elm = getSearchTargetElm(target.id);
                if(elm.checked){
                    target_ids.push(target.id);
                }
            });
            return target_ids;
        };
        const setSearchTargets = (target_ids) => {
            if(!target_ids){
                setSearchTargetEnable(false);
                return;
            }

            setSearchTargetEnable(true);

            this.search_targets.forEach(target=>{
                const elm = getSearchTargetElm(target.id);
                elm.checked = target_ids.includes(target.id);
            });
        };
    
        const getSearchInputElm = () => {
            return this.root.querySelector(".search-container > .search-input");
        };

        const filterItems = (query, target_ids) => {
            grid_table.filterData(query, target_ids);
            grid_table.scrollToTop();
            grid_table.clearSelected();

            this.num_filtered_items = grid_table.dataView.getLength();
            this.update();
        };

        this.onclickSearch = (e) => {
            const elm = getSearchInputElm();
            const query = elm.value; 
            const target_ids = getSearchTargetIDs();
            filterItems(query, target_ids);
        };

        this.onkeydownSearchInput = (e) => {
            if(e.keyCode===13){
                const query = e.target.value;
                const target_ids = getSearchTargetIDs();
                filterItems(query, target_ids);
            }
        };

        this.onclickShowAll = (e) => {
            setSearchTargetEnable(false);
            
            const search_elm = getSearchInputElm();
            search_elm.value = "";
            filterItems(""); 
        };
    
        this.onclickSaveSearch = () => {
            const search_elm = getSearchInputElm();
            const query = search_elm.value;
            if(!query){
                return;
            }
            
            const item = { 
                title: query, 
                query: query
            };

            const target_ids = getSearchTargetIDs();
            if(target_ids){
                item.target_ids = target_ids;
            }

            obs.trigger("library-page:sidebar:add-search-item", { item });
        };
        
        obs.on("library-page:search-item-dlbclicked", (item) => {
            const query = item.query;
            const target_ids = item.target_ids;

            const search_elm = getSearchInputElm();
            search_elm.value = query;
            setSearchTargets(target_ids);

            filterItems(query, target_ids);      
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
            if(modal_dialog.isOpend()){
                return;
            }

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
                        const video_item = await myapi.ipc.Library.getItem(item.id);
                        nico_update = new NicoUpdate(video_item);
                        nico_update.on("updated", async (video_id, props, update_thumbnail) => {
                            await myapi.ipc.Library.updateItemProps(video_id, props);
                            if(update_thumbnail){
                                const updated_video_item = await myapi.ipc.Library.getItem(video_id);
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
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `${error_items.length}個が更新に失敗\n詳細はログを参照`
                });
            }else{
                await myapi.ipc.Dialog.showMessageBox({
                    message: `更新完了(${cur_update}/${items.length})`
                });
            }
        };

        const convertNicoDataToNNDD = async (items) => {
            if(modal_dialog.isOpend()){
                return;
            }

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
                        const video_item = await myapi.ipc.Library.getItem(item.id);
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
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `${error_items.length}個がNNDD形式への変換に失敗\n詳細はログを参照`
                });
            }else{
                await myapi.ipc.Dialog.showMessageBox({
                    message: `NNDD形式への変換完了(${cur_update}/${items.length})`
                });
            }
        };

        const deleteLibraryData = async (video_ids) => {
            if(modal_dialog.isOpend()){
                return;
            }

            let cancel = false;
            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    cancel = true;
                }
            });
            
            const error_ids = [];
            for (let index = 0; index < video_ids.length; index++) {
                if(cancel===true){
                    break;
                }
                const video_id = video_ids[index];
                this.obs_modal_dialog.trigger("update-message", `${video_id}を削除中`);
                const result = await myapi.ipc.Library.deleteItem(video_id);
                // await wait(3000);
                // await wait(3000);
                // const result =  {
                //     success : true,
                //     error : null
                // };  
                if(!result.success){
                    logger.error(result.error);
                    error_ids.push(video_id);
                }
            }
            if(error_ids.length > 0){
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `${error_ids.length}個の削除に失敗\n詳細はログを参照`
                });
            }
            this.obs_modal_dialog.trigger("close");
        };

        const convertVideo = async (video_id) => {
            if(modal_dialog.isOpend()){
                return;
            }
            
            const updateState = (state) => {
                grid_table.updateCell(video_id, "state", state);
            };

            try {
                const video_item = await myapi.ipc.Library.getItem(video_id);
                const video_data = new NicoVideoData(video_item);
                const ffmpeg_path = await myapi.ipc.Config.get("ffmpeg_path", "");
                const cnv_mp4 = new ConvertMP4();

                this.obs_modal_dialog.trigger("show", {
                    message: "mp4に変換中...",
                    buttons: ["cancel"],
                    cb: (result)=>{
                        cnv_mp4.cancel();
                    }
                });

                cnv_mp4.on("cancel_error", async error=>{
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: `中断失敗\n${error.message}`
                    });
                });

                updateState("変換中");

                await cnv_mp4.convert(ffmpeg_path, video_data.getVideoPath());
               
                const props = {video_type:"mp4"};
                await myapi.ipc.Library.updateItemProps(video_id, props);

                await myapi.ipc.Dialog.showMessageBox({
                    message: "変換完了"
                });
                updateState("変換完了");  

            } catch (error) {
                if(error.cancel === true){
                    await myapi.ipc.Dialog.showMessageBox({
                        message: "変換中断"
                    });
                    updateState("変換中断");   
                }else{
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: `変換失敗\n${error.message}`
                    });
                    updateState("変換失敗");   
                }
            }finally{
                this.obs_modal_dialog.trigger("close");      
            }
        };

        const play = async (item, online) => {
            const video_id = item.id;
            const video_type = item.video_type;

            if(!online && needConvertVideo(video_type)){
                const ret = await myapi.ipc.Dialog.showMessageBox({
                    message: `動画が${video_type}のため再生できません\nmp4に変換しますか?`,
                    okcancel: true
                });
                if(!ret){
                    return;
                }
                await convertVideo(video_id);
            }else{
                Command.play(item, online);
            }
        };

        this.on("mount", async () => {    
            const grid_container = this.root.querySelector(".library-grid");
            grid_table.init(grid_container);
            grid_table.setupResizer(".library-grid-container");
    
            grid_table.setFilter((column_id, value, word) => { 
                if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                    return true;
                }   
                return false; 
            },
            this.search_targets.map(item=>item.id),
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

            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas();
                if(items.length==0){
                    return;
                }
                const video_type = items[0].video_type;

                if(video_type=="mp4"){
                    const menu_id = await myapi.ipc.popupContextMenu("library", {items});
                    if(!menu_id){
                        return;
                    }

                    if(menu_id=="update-comment"){
                        updateNicoData(items, async (nico_update)=>{
                            await nico_update.updateComment();
                        });
                    }
                    if(menu_id=="update-thumbnail"){
                        updateNicoData(items, async (nico_update)=>{
                            await nico_update.updateThumbnail();
                        });
                    }
                    if(menu_id=="update-except-video"){
                        updateNicoData(items, async (nico_update)=>{
                            await nico_update.update();
                        });
                    }
                    if(menu_id=="conver-to-xml"){
                        await convertNicoDataToNNDD(items);
                    }
                    if(menu_id=="delete"){
                        const video_ids = items.map(item => item.id);
                        const ret = await myapi.ipc.Dialog.showMessageBox({
                            message: "動画を削除しますか?",
                            okcancel: true
                        });
                        if(!ret){
                            return;
                        }
                        await deleteLibraryData(video_ids);
                    }
                }else{
                    const menu_id = await myapi.ipc.popupContextMenu("library-convert-video", {items});
                    if(menu_id=="convert-video"){
                        const video_id = items[0].id;
                        await convertVideo(video_id);
                    }   
                }
            });
            
            try {
                await myapi.ipc.Library.load();
            } catch (error) {
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `ライブラリの読み込み失敗\n${error.message}`
                });
                // loadLibraryItems([]);
            }
            
            modal_dialog = new ModalDialog(this.root, "library-md", {
                obs:this.obs_modal_dialog
            });
        });

        obs.on("library-page:convert-video", async (args) => { 
            const video_id = args;
            await convertVideo(video_id);          
        });   
        
        obs.on("library-page:play", async (item) => { 
            const video_id = item.id;
            const video_item = await myapi.ipc.Library.getItem(video_id);
            if(video_item===null){
                return;
            }
           
            const props = { 
                last_play_date : new Date().getTime(),
                play_count : video_item.play_count + 1
            };
            logger.debug("update library video_id=", video_id, ", props=", props);
            await myapi.ipc.Library.updateItemProps(video_id, props);
        });

        obs.on("library-page:scrollto", async (video_id) => { 
            const rows = grid_table.getRowsByIds([video_id]);
            if(rows.length > 0){
                grid_table.scrollRow(rows[0], true);
                grid_table.setSelectedRows(rows);
            }
        });
    </script>
</library-content>

<library-page>
    <div class="split-page">
        <div class="left">
            <library-sidebar 
                obs={obs} 
                geticon={geticon}
                gettooltip={gettooltip}>
            </library-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <library-content 
                obs={obs}
                search_targets={search_targets}>
            </library-content>
        </div>
    </div>
    <script>
        this.obs = this.opts.obs;

        this.search_targets = Object.freeze([
            { title: "名前", id: "title" }, 
            { title: "タグ", id: "tags" }, 
            { title: "ID",   id: "id" }, 
            { title: "画質", id: "is_economy" }, 
            { title: "動画形式", id: "video_type" }
        ]);

        const target_map = new Map();
        this.search_targets.forEach(target=>{
            target_map.set(target.id, target.title);
        });
        this.gettooltip = (item) => {
            const target_ids = item.target_ids;
            if(!target_ids){
                return item.title;
            }
            const target_titles = target_ids.map(target_id=>{
                if(target_map.has(target_id)){
                    return target_map.get(target_id);
                }else{
                    return `${target_id}に対応する項目がない`;
                }
            });
            return `${item.title}\n検索対象:${target_titles.join(", ")}`;
        };
        this.geticon = (item) => {
            const target_ids = item.target_ids;
            if(target_ids){
                return "fas fa-filter";
            }
            return null;
        };
    </script>
</library-page>