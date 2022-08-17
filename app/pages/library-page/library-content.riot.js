const myapi = require("../../js/my-api");
const { GridTable, wrapFormatter, buttonFormatter } = require("../../js/gridtable");
const { NicoVideoData } = require("../../js/nico-data-file");
const { Command } = require("../../js/command");
const { NicoUpdate } = require("../../js/nico-update");
const { ConvertMP4, needConvertVideo } = require("../../js/video-converter");
const { ModalDialog } = require("../../js/modal-dialog");
const { MyObservable, window_obs } = require("../../js/my-observable");
const { logger } = require("../../js/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

/**
 * 
 * @param {number} msec 
 */
const wait = async (msec) => {
    await new Promise(resolve => setTimeout(resolve, msec)); 
};

module.exports = {
    state:{
        num_filtered_items:0,
        num_items:0,
    },

    /** @type {{title:string, id:string}[]} */
    search_targets:[],

    /** @type {MyObservable} */
    obs_modal_dialog:null,

    /** @type {ModalDialog} */
    modal_dialog:null,

    /** @type {GridTable} */
    grid_table:null,
    onBeforeMount(props) {
        this.obs_modal_dialog = new MyObservable();

        /** @type {{title:string, id:string}[]} */
        this.search_targets = props.search_targets;

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_data = new NicoVideoData(video_item);
            const video_id = video_item.video_id;
            video_item.thumb_img = video_data.getThumbImgPath();
            this.grid_table.updateItem(video_item, video_id);

            this.state.num_filtered_items =  this.grid_table.getDataLength();
            this.state.num_items += 1;
            this.update();
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            this.grid_table.deleteItemById(video_id);

            this.state.num_filtered_items =  this.grid_table.getDataLength();
            this.state.num_items -= 1;
            this.update();
        });

        myapi.ipc.Library.onUpdateItem((args) => {
            const {video_id, props} = args;
            logger.debug("library:on-update-item video_id=", video_id, " props=", props);

            if(Array.isArray(props.tags)){
                props.tags = props.tags.join(" ");
            }
            this.grid_table.updateCells(video_id, props);
        });

        myapi.ipc.Library.onInit((args) =>{
            const {items} = args;

            /** @type {LibraryItem[]} */
            const library_items = items.map(value=>{
                const video_data = new NicoVideoData(value);
                value.thumb_img = video_data.getThumbImgPath();
                return value;
            });
            this.loadLibraryItems(library_items);
        });
    
        const libraryImageFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(dataContext.thumbnail_size=="L"){
                return `<img class="thumbnail-L" src="${value}"/>`;
            }
            return `<div class="thumbnail-wrap"><img class="thumbnail-S" src="${value}"></div>`;
        };
        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.video_id;
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
        this.grid_table = new GridTable("library-grid", columns, options, "video_id");

        main_obs.on("library-page:search-item-dlbclicked", (
            /** @type {LibrarySearchItem} */ item) => {
            const query = item.query;
            const target_ids = item.target_ids;

            const search_elm = this.getSearchInputElm();
            search_elm.value = query;
            this.setSearchTargets(target_ids);

            this.filterItems(query, target_ids);      
        });

        main_obs.on("library-page:convert-video", async (args) => { 
            /** @type {string} */
            const video_id = args;
            await this.convertVideo(video_id);          
        });   
        
        main_obs.on("library-page:scrollto", async (video_id) => { 
            const rows = this.grid_table.getRowsByIds([video_id]);
            if(rows.length > 0){
                this.grid_table.scrollRow(rows[0], true);
                this.grid_table.setSelectedRows(rows);
            }
        });
    },
    async onMounted() {
        const grid_container = this.$(".library-grid");
        this.grid_table.init(grid_container);
        this.grid_table.setupResizer(".library-grid-container");

        this.grid_table.setFilter((column_id, value, word) => { 
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
            const value = item[column_id];
            if(Array.isArray(value)){
                return value.join(" ").toLowerCase();
            }
            return String(value);
        });

        this.grid_table.onDblClick(async (e, data)=>{
            logger.debug("library onDblClick data=", data);
            await this.play(data, false);
        });

        this.grid_table.onButtonClick(async (e, cmd_id, data)=>{
            if(cmd_id == "play"){
                logger.debug("library onButtonClick data=", data);
                await this.play(data, false);
            }

            if(cmd_id == "stack"){
                Command.addStackItems(main_obs, [data]);
            }

            if(cmd_id == "bookmark"){
                Command.addBookmarkItems(main_obs, [data]);
            }
        });

        this.grid_table.onContextMenu(async (e)=>{ // eslint-disable-line no-unused-vars
            const items = this.grid_table.getSelectedDatas();
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
                    this.updateNicoData(items, async (nico_update)=>{
                        return await nico_update.updateComment();
                    });
                }
                if(menu_id=="update-thumbnail"){
                    this.updateNicoData(items, async (nico_update)=>{
                        return await nico_update.updateThumbnail();
                    });
                }
                if(menu_id=="update-except-video"){
                    this.updateNicoData(items, async (nico_update)=>{
                        return await nico_update.update();
                    });
                }
                if(menu_id=="delete"){
                    const video_ids = items.map(item => item.video_id);
                    const ret = await myapi.ipc.Dialog.showMessageBox({
                        message: "動画を削除しますか?",
                        okcancel: true
                    });
                    if(!ret){
                        return;
                    }
                    await this.deleteLibraryData(video_ids);
                }
            }else{
                const menu_id = await myapi.ipc.popupContextMenu("library-convert-video", {items});
                if(menu_id=="convert-video"){
                    const video_id = items[0].video_id;
                    await this.convertVideo(video_id);
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
        
        this.modal_dialog = new ModalDialog(this.root, "library-md", {
            obs:this.obs_modal_dialog
        });
    },
    getSearchTargetElmID(id) {
        return `search-target-${id}`;
    },
    /**
     * 
     * @param {string} target_id 
     * @returns {HTMLElement}
     */
    getSearchTargetElm(target_id) {
        const id = this.getSearchTargetElmID(target_id);
        return this.$(`#${id}`);
    },
    getSearchTargetEnable() {
        /** @type {HTMLElement} */
        const elm = this.$(".search-target-container");
        return elm.classList.contains("search-target-none") === false;
    },
    setSearchTargetEnable(enable) {
        /** @type {HTMLElement} */
        const elm = this.$(".search-target-container");
        if(enable){
            elm.classList.remove("search-target-none");
        }else if(this.getSearchTargetEnable()){
            this.search_targets.forEach(target=>{
                const elm = this.getSearchTargetElm(target.id);
                elm.checked = false;
            }); 
            elm.classList.add("search-target-none");
        }
    },
    onclickToggleSearchTargets(e) { // eslint-disable-line no-unused-vars
        const enable = this.getSearchTargetEnable();
        this.setSearchTargetEnable(!enable);
    },
    getSearchTargetIDs() { 
        if(!this.getSearchTargetEnable()){
            return null;
        }

        /** @type {string[]} */
        const target_ids = [];
        this.search_targets.forEach(target=>{
            const elm = this.getSearchTargetElm(target.id);
            if(elm.checked){
                target_ids.push(target.id);
            }
        });
        return target_ids;
    },
    /**
     * 
     * @param {string[]} target_ids 
     * @returns 
     */
    setSearchTargets(target_ids) {
        if(!target_ids){
            this.setSearchTargetEnable(false);
            return;
        }

        this.setSearchTargetEnable(true);

        this.search_targets.forEach(target=>{
            const elm = this.getSearchTargetElm(target.id);
            elm.checked = target_ids.includes(target.id);
        });
    },
    /**
     * 
     * @returns {HTMLInputElement}
     */
    getSearchInputElm() {
        return this.$(".search-container > .search-input");
    },
    /**
     * 
     * @param {string} query 
     * @param {string[]} target_ids 
     */
    filterItems(query, target_ids) {
        this.grid_table.filterData(query, target_ids);
        this.grid_table.scrollToTop();
        this.grid_table.clearSelected();

        this.state.num_filtered_items = this.grid_table.dataView.getLength();
        this.update();
    },
    onclickSearch(e) { // eslint-disable-line no-unused-vars
        const elm = this.getSearchInputElm();
        const query = elm.value; 
        const target_ids = this.getSearchTargetIDs();
        this.filterItems(query, target_ids);
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    onkeydownSearchInput(e) {
        if(e.code.toLowerCase()=="enter"){
            const query = e.target.value;
            const target_ids = this.getSearchTargetIDs();
            this.filterItems(query, target_ids);
        }
    },
    onclickShowAll(e) { // eslint-disable-line no-unused-vars
        this.setSearchTargetEnable(false);
        
        const search_elm = this.getSearchInputElm();
        search_elm.value = "";
        this.filterItems(""); 
    },
    onclickSaveSearch() {
        const search_elm = this.getSearchInputElm();
        const query = search_elm.value;
        if(!query){
            return;
        }
        
        const item = { 
            title: query, 
            query: query
        };

        const target_ids = this.getSearchTargetIDs();
        if(target_ids){
            item.target_ids = target_ids;
        }

        main_obs.trigger("library-page:sidebar:add-search-item", { item });
    },
    /**
     * 
     * @param {LibraryItem[]} items 
     */
    loadLibraryItems(items) {
        this.grid_table.setData(items);
        this.state.num_items = items.length;
        this.state.num_filtered_items = this.state.num_items;

        this.update();
    },
    /**
     * 
     * @param {LibraryItem[]} items 
     * @param {(nico_update:NicoUpdate)=>NicoUpdateResult} func 
     * @returns 
     */
    async updateNicoData(items, func) {
        if(this.modal_dialog.isOpend()){
            return;
        }

        let update_cancel = false;
        let nico_update = null;
        this.obs_modal_dialog.trigger("show", {
            message: "...",
            buttons: ["cancel"],
            cb: ()=>{
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

                this.grid_table.updateCell(item.video_id, "state", "更新中");
                try {
                    const video_item = await myapi.ipc.Library.getItem(item.video_id);
                    nico_update = new NicoUpdate(video_item);
                    const result = await func(nico_update);
                    if(result){
                        await myapi.ipc.Library.updateItemProps(result.video_id, result.props);
                        if(result.update_thumbnail){
                            const updated_video_item = await myapi.ipc.Library.getItem(result.video_id);
                            const video_data = new NicoVideoData(updated_video_item);
                            const thumb_img = `${video_data.getThumbImgPath()}?${new Date().getTime()}`;
                            this.grid_table.updateCells(result.video_id, {thumb_img});
                        }
                    }
                    this.grid_table.updateCell(item.video_id, "state", "更新完了");       
                } catch (error) {
                    if(error.cancel===true){   
                        this.grid_table.updateCell(item.video_id, "state", "更新キャンセル");
                        throw error;
                    }else{
                        error_items.push(item);
                        logger.error(error);
                        this.grid_table.updateCell(item.video_id, "state", `更新失敗: ${error.message}`);
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
    },
    /**
     * 
     * @param {string[]} video_ids 
     * @returns 
     */
    async deleteLibraryData(video_ids) {
        if(this.modal_dialog.isOpend()){
            return;
        }

        let cancel = false;
        this.obs_modal_dialog.trigger("show", {
            message: "...",
            buttons: ["cancel"],
            cb: ()=>{
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
    },
    /**
     * 
     * @param {string} video_id 
     * @returns 
     */
    async convertVideo(video_id) {
        if(this.modal_dialog.isOpend()){
            return;
        }
        
        const updateState = (state) => {
            this.grid_table.updateCell(video_id, "state", state);
        };

        try {
            const video_item = await myapi.ipc.Library.getItem(video_id);
            const video_data = new NicoVideoData(video_item);
            const ffmpeg_path = await myapi.ipc.Config.get("ffmpeg_path", "");
            const cnv_mp4 = new ConvertMP4();

            this.obs_modal_dialog.trigger("show", {
                message: "mp4に変換中...",
                buttons: ["cancel"],
                cb: ()=>{
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
    },
    /**
     * 
     * @param {LibraryItem} item 
     * @param {boolean} online 
     * @returns 
     */
    async play(item, online) {
        const video_id = item.video_id;
        const video_type = item.video_type;

        if(!online && needConvertVideo(video_type)){
            const ret = await myapi.ipc.Dialog.showMessageBox({
                message: `動画が${video_type}のため再生できません\nmp4に変換しますか?`,
                okcancel: true
            });
            if(!ret){
                return;
            }
            await this.convertVideo(video_id);
        }else{
            Command.play(item, online);
        }
    }
};