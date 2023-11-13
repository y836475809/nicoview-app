const myapi = require("../../lib/my-api");
const { buttonFormatter } = require("../common/nico-grid-formatter");
const { mountNicoGrid } = require("../common/nico-grid-mount");
const { NicoVideoData } = require("../../lib/nico-data-file");
const { Command } = require("../../lib/command");
const { NicoUpdate } = require("../../lib/nico-update");
const { ConvertMP4, needConvertVideo } = require("../../lib/video-converter");
const { ModalDialog } = require("../../lib/modal-dialog");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

/**
 * 
 * @param {number} msec 
 */
const wait = async (msec) => {
    await new Promise(resolve => setTimeout(resolve, msec)); 
};

const nico_grid_name = "library-nico-grid";

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

    onBeforeMount(props) {
        this.obs_modal_dialog = new MyObservable();

        /** @type {{title:string, id:string}[]} */
        this.search_targets = props.search_targets;

        myapi.ipc.Library.onAddItem(async (args) => {
            const {video_item} = args;
            const video_data = new NicoVideoData(video_item);
            video_item.thumb_img = video_data.getThumbImgPath();
            await this.nico_grid_obs.triggerReturn("add-items", {
                items:[video_item]
            });
            this.state.num_filtered_items = await this.nico_grid_obs.triggerReturn("get-data-length");
            this.state.num_items += 1;
            this.update();
        });

        myapi.ipc.Library.onDeleteItem(async (args) => {
            const { video_id } = args;
            await this.nico_grid_obs.triggerReturn("delete-items", {
                ids: [video_id]
            });
            this.state.num_filtered_items = await this.nico_grid_obs.triggerReturn("get-data-length");
            this.state.num_items -= 1;
            this.update();
        });

        myapi.ipc.Library.onUpdateItem((args) => {
            const {video_id, props} = args;
            logger.debug("library:on-update-item video_id=", video_id, " props=", props);
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: props
            }); 
        });

        myapi.ipc.Library.onInit(async (args) =>{
            const {items} = args;

            /** @type {LibraryItem[]} */
            const library_items = items.map(value=>{
                const video_data = new NicoVideoData(value);
                value.thumb_img = video_data.getThumbImgPath();
                return value;
            });
            await this.loadLibraryItems(library_items);
        });

        main_obs.on("library:search-item-dlbclicked", (
            /** @type {LibrarySearchItem} */ item) => {
            const query = item.query;
            const target_ids = item.target_ids;

            const search_elm = this.getSearchInputElm();
            search_elm.value = query;
            this.setSearchTargets(target_ids);

            this.filterItems(query, target_ids);      
        });

        main_obs.on("library:convert-video", async (args) => { 
            /** @type {string} */
            const video_id = args;
            await this.convertVideo(video_id);          
        });   
        
        main_obs.on("library:scrollto", async (video_id) => { 
            const index = await this.nico_grid_obs.triggerReturn("get-index-by-id", {
                id: "video_id",
                value: video_id 
            });
            this.nico_grid_obs.trigger("scroll-to-index", {
                index,
                position:"top"
            });
            this.nico_grid_obs.trigger("set-selected-by-index", {
                index
            });
        });
    },
    async onMounted() {
        const infoFormatter = (id, value, data)=> {
            const video_id = data.video_id;
            const video_type = data.video_type;
            const video_quality = data.is_economy?"画質: エコノミー":"";
            return `<div>
                ID: ${video_id}<br>
                動画形式: ${video_type}<br>
                ${video_quality}
                </div>`;
        };
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 180},
            {id: "title", name: "名前"},
            {id: "command", name: "操作", 
                ft: buttonFormatter.bind(this,["play", "stack", "bookmark"])},
            {id: "info", name: "情報", sortable: false, ft: infoFormatter},
            {id: "creation_date", name: "作成日"},
            {id: "pub_date", name: "投稿日"},
            {id: "play_count", name: "再生回数"},
            {id: "play_time", name: "時間"},
            {id: "last_play_date", name: "最終再生日"},
            {id: "state", name: "状況"}
        ];
        /** @type {NicoGridOptions} */
        const options = {
            filter_target_ids: [
                "title", "tags", "video_id"
            ],
            sort_param: {
                id: "",
                asc: true,
                enable: true
            }
        };
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", async (args) => {
            const { data } = args;
            if(data.video_id){
                await this.play(data, false);
            }
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
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
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const sel_data_list = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            const items = sel_data_list.filter(value => {
                return value.video_id!="";
            });
            if(items.length===0){
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
                    const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
                        type: "info",
                        message: "動画を削除しますか?"
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
            await myapi.ipc.Dialog.showMessageBoxOK({
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
     * @returns {HTMLInputElement}
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
     * @param {string[]} [target_ids] 指定しない場合全項目が対象
     */
    filterItems(query, target_ids) {
        this.nico_grid_obs.trigger("filter", {
            ids: target_ids?target_ids:[],
            text: query
        });
        (async ()=>{
            this.state.num_filtered_items =  await this.nico_grid_obs.triggerReturn("get-data-length");
            this.update();
        })();
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

        main_obs.trigger("library:sidebar:add-search-item", { item });
    },
    /**
     * 
     * @param {LibraryItem[]} items 
     */
    async loadLibraryItems(items) {
        this.state.num_items = items.length;
        this.state.num_filtered_items = this.state.num_items;

        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "video_id",
            items: items
        });

        this.update();
    },
    /**
     * 
     * @param {LibraryItem[]} items 
     * @param {(nico_update:NicoUpdate)=>Promise<NicoUpdateResult>} func 
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
                this.nico_grid_obs.trigger("update-item", {
                    id: item.video_id,
                    props: { state: "更新中" }
                });
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
                            this.nico_grid_obs.trigger("update-item", {
                                id: result.video_id,
                                props: { thumb_img }
                            }); 
                        }
                    }
                    this.nico_grid_obs.trigger("update-item", {
                        id: item.video_id,
                        props: { state: "更新完了" }
                    });
                } catch (error) {
                    if(error.cancel===true){   
                        this.nico_grid_obs.trigger("update-item", {
                            id: item.video_id,
                            props: { state: "更新キャンセル" }
                        });
                        throw error;
                    }else{
                        error_items.push(item);
                        logger.error(error);
                        this.nico_grid_obs.trigger("update-item", {
                            id: item.video_id,
                            props: { state: `更新失敗: ${error.message}` }
                        });
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
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: `${error_items.length}個が更新に失敗\n詳細はログを参照`
            });
        }else{
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "info",
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
            await myapi.ipc.Dialog.showMessageBoxOK({
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
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { state }
            });
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
                await myapi.ipc.Dialog.showMessageBoxOK({
                    type: "error",
                    message: `中断失敗\n${error.message}`
                });
            });

            updateState("変換中");

            await cnv_mp4.convert(ffmpeg_path, video_data.getVideoPath());
        
            const props = {video_type:"mp4"};
            await myapi.ipc.Library.updateItemProps(video_id, props);

            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "info",
                message: "変換完了"
            });
            updateState("変換完了");  

        } catch (error) {
            if(error.cancel === true){
                await myapi.ipc.Dialog.showMessageBoxOK({
                    type: "info",
                    message: "変換中断"
                });
                updateState("変換中断");   
            }else{
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBoxOK({
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
            const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
                type: "info",
                message: `動画が${video_type}のため再生できません\nmp4に変換しますか?`
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