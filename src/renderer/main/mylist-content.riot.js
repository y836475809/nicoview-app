const myapi = require("../../lib/my-api");
const { infoFormatter, timeFormatter } = require("../common/nico-grid-formatter");
const { mountNicoGrid } = require("../common/nico-grid-mount");
const { Command } = require("../../lib/command");
const { NicoMylist, NicoMylistStore, NicoMylistImageCache } = require("../../lib/nico-mylist");
const { needConvertVideo } = require("../../lib/video-converter");
const { ModalDialog } = require("../../lib/modal-dialog");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "mylist-nico-grid";

/**
 * @param {ModalDialog} modal_dialog 
 * @param {MyObservable} dialog_obs 
 * @param {{message: String, cb:Function}} dailog_params
 * @param {()=>void} func 
 * @returns 
 */
const progressDailog = async (modal_dialog, dialog_obs, dailog_params, func) => {
    if(modal_dialog.isOpend()){
        return;
    }
    dialog_obs.trigger("show", {
        message: dailog_params.message,
        buttons: ["cancel"],
        cb: dailog_params.cb
    });
    try {
        await func();
    } catch (error) {
        if(!error.cancel){
            logger.error(error);
            await myapi.ipc.Dialog.showMessageBoxOK({
                type: "error",
                message: error.message
            });
        }
    }
    dialog_obs.trigger("close");
};

module.exports = {
    state:{
        mylist_description:""
    },

    /** @type {MyObservable} */
    obs_modal_dialog:null,

    /** @type {ModalDialog} */
    modal_dialog:null,

    /** @type {NicoMylistImageCache} */
    nico_mylist_image_cache:null,

    /** @type {NicoMylistStore} */
    nico_mylist_store:null,

    /** @type {NicoMylist} */
    nico_mylist:null,

    /** @type {string} */
    loaded_mylist_id:null,

    is_current_fav:false,

    /**
     * 
     * @returns {string}
     */
    getMylistID(){
        /** @type {HTMLInputElement} */
        const elm = this.$(".mylist-input");
        return elm.value;
    },
    /**
     * 
     * @param {string} id 
     */
    setMylistID(id){
        /** @type {HTMLInputElement} */
        const elm = this.$(".mylist-input");
        elm.value = id;
    },
    onBeforeMount() {  
        this.obs_modal_dialog = new MyObservable();

        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                this.nico_grid_obs.trigger("update-item", {
                    id: video_id,
                    props: item
                });    
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: true }
            });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: false }
            });
        });

        main_obs.on("mylist:item-dlbclicked", async (item) => {
            /** @type {string} */
            const mylist_id = item.mylist_id;
            if(this.loaded_mylist_id == mylist_id){
                await this.updateMylist();
            }else{
                try {
                    const mylist = this.nico_mylist_store.load(mylist_id);
                    this.setMylistID(mylist_id);
                    await this.setMylist(mylist); 
                } catch (error) {
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBoxOK({
                        type: "error",
                        message: error.message
                    });
                }
            }
        });

        main_obs.on("mylist:load-mylist", async(mylist_id)=> {
            this.setMylistID(mylist_id);
            try {
                if(await this.existMylist(mylist_id)){
                    await this.setMylist(this.nico_mylist_store.load(mylist_id)); 
                }else{
                    await this.getMylist(mylist_id);
                }
                main_obs.trigger("mylist:sidebar:select-item", { mylist_id });
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBoxOK({
                        type: "error",
                        message: error.message
                    });
                }
            }   
        });

        main_obs.on("mylist:items-deleted", async (args)=> {
            /** @type {{items:MyListIndexItem[]}} */
            const { items } = args;
            items.forEach(item => {
                const mylist_id = item.mylist_id;
                this.nico_mylist_store.delete(mylist_id);
                this.nico_mylist_image_cache.delete(mylist_id);
            }); 

            const mylist_id = this.getMylistID();
            if(await this.hasMylistID(mylist_id)){
                this.is_current_fav = true;
            }else{
                // 現在表示されているmylistが削除された場合、お気に入り消す
                this.is_current_fav = false;
            }
            this.update();
        });

        window.addEventListener("beforeunload", async (event) => { // eslint-disable-line no-unused-vars
            const mylist_id_list = await this.getMylistIDList();
            this.nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
            this.nico_mylist_image_cache.save();
        });
    },
    async onMounted() {
        const mylist_dir = await myapi.ipc.MyList.getMyListDir();  
        this.nico_mylist_store = new NicoMylistStore(mylist_dir);
        this.nico_mylist_image_cache = new NicoMylistImageCache(mylist_dir);

        /**
         * 
         * @param {string} id 
         * @param {string} value 
         * @param {object} data 
         * @returns 
         */
        const imageCacheFormatter = (id, value, data)=> {
            /** @type {string} */
            const mylist_id = data.mylist_id;
            const url = value;
            return `<div class="mylist-grid-img-holder">${this.nico_mylist_image_cache.getImageHtml(mylist_id, url)}</div>`;
        };

        const htmlFormatter = (id, value, data)=> {
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };

        const mylist_infoFormatter = infoFormatter.bind(this, 
            (id, value, data)=>{ 
                return `<div>ID: ${data.video_id}</div>`;
            });
        const columns = [
            {id: "no", name: "#"},
            {id: "thumb_img", name: "サムネイル", width: 130, ft: imageCacheFormatter},
            {id: "title", name: "名前"},
            {id: "command", name: "操作"},
            {id: "info", name: "情報", ft: mylist_infoFormatter},
            {id: "description", name: "説明", ft: htmlFormatter},
            {id: "date", name: "投稿日"},
            {id: "length", name: "時間", ft: timeFormatter}
        ];
        /** @type {NicoGridOptions} */
        const options = {};
        this.nico_grid_obs = new MyObservable();
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);

        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", async (args) => {
            const { data } = args;
            /** @type {string} */
            const video_id = data.video_id;
            if(!video_id){
                return;
            }
            /** @type {LibraryItem} */
            const video_item = await myapi.ipc.Library.getItem(video_id);
            if(needConvertVideo(video_item)===true){      
                const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
                    type: "info",
                    message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?"
                });
                if(!ret){
                    return;
                }
                main_obs.trigger("library:convert-video", video_id);
            }else{
                Command.play(data, false);
            }
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                await this.play(data, false);
            }
            if(cmd_id == "stack"){
                Command.addStackItems(main_obs, [data]);
            }
            if(cmd_id == "bookmark"){
                Command.addBookmarkItems(main_obs, [data]);
            }
            if(cmd_id == "download"){
                Command.addDownloadItems(main_obs, [data]);
            }
        });
        
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }
            const video_id = items[0].video_id;
            const video_item = await myapi.ipc.Library.getItem(video_id);
            const need_convert = needConvertVideo(video_item);
            const context_menu_type = need_convert?"convert-video":"main";
            const menu_id = await myapi.ipc.popupContextMenu("mylist", {context_menu_type, items});
            if(!menu_id){
                return;
            }
            if(menu_id=="convert-video"){
                main_obs.trigger("library:convert-video", video_id); 
            }
        });   

        this.modal_dialog = new ModalDialog(this.root, "mylist-md", {
            obs:this.obs_modal_dialog
        });
    },
    /**
     * 
     * @returns {Promise<string[]>}
     */
    async getMylistIDList() {
        /** @type {{items:MyListIndexItem[]}} */
        const { items } = await main_obs.triggerReturn("mylist:sidebar:get-items");
        const mylist_id_list = items.map(item => {
            return item.mylist_id;
        });
        return mylist_id_list;            
    },
    /**
     * 
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async existMylist(id) {
        const ids = await this.getMylistIDList();
        return ids.includes(id);
    },
    /**
     * 
     * @param {{video_id:string}} item 
     * @param {boolean} online 
     * @returns {Promise<void>}
     */
    async play(item, online) {
        const video_id = item.video_id;
        const video_item = await myapi.ipc.Library.getItem(video_id);
        if(!online && needConvertVideo(video_item)){       
            const ret = await myapi.ipc.Dialog.showMessageBoxOkCancel({
                type: "info",
                message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?"
            });
            if(!ret){
                return;
            }
            main_obs.trigger("library:convert-video", video_id);
        }else{
            Command.play(item, online);
        }
    },
    /**
     * 
     * @param {string} mylist_id 
     * @returns 
     */
    async hasMylistID(mylist_id) {
        const mylist_id_list = await this.getMylistIDList();
        return mylist_id_list.includes(mylist_id);
    },
    getIconClass() {
        if(this.is_current_fav){
            return "fas fa-star fav-mark";
        }else{
            return "far fa-star";
        }
    },
    /**
     * 
     * @param {MyListItem} mylist 
     * @param {boolean} update_image_cache_id 
     */
    async setMylist(mylist, update_image_cache_id=true) {
        this.state.mylist_description = mylist.description;

        if(update_image_cache_id){
            const mylist_id_list = await this.getMylistIDList();
            this.nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
            this.nico_mylist_image_cache.loadCache(mylist.mylist_id);
        }

        if(await this.hasMylistID(mylist.mylist_id)){
            this.is_current_fav = true;
        }else{
            this.is_current_fav = false;
        }
        main_obs.trigger("mylist:sidebar:select-item", { mylist_id: mylist.mylist_id });
        this.update();

        this.setData(mylist);
    },
    /**
     * 
     * @param {MyListItem} mylist 
     */
    async setData(mylist) {
        this.loaded_mylist_id = mylist.mylist_id;
        
        const mylist_items = mylist.items;
        const video_ids = await myapi.ipc.Download.getIncompleteIDs();
        for (let i=0; i<mylist_items.length; i++) {
            const item = mylist_items[i];
            const video_id = item.video_id;
            item.saved = await myapi.ipc.Library.hasItem(video_id);
            item.reg_download = video_ids.includes(video_id);  
            item.mylist_id = mylist.mylist_id;
        }
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "video_id",
            items: mylist_items
        });  
    },
    /**
     * 
     * @param {string} mylist_id 
     */
    async getMylist(mylist_id) {
        this.nico_mylist = new NicoMylist();
        const mylist = await this.nico_mylist.getMylist(mylist_id);
        await this.setMylist(mylist);
    },
    /**
     * 
     * @param {MyListItem} mylist 
     * @returns 
     */
    async addMylist(mylist) {
        if(!mylist){
            return;
        }

        const mylist_id = mylist.mylist_id;

        if(await this.hasMylistID(mylist.mylist_id)){
            return;
        }

        // 保存済みmylist id一覧に新規保存のmylist idを追加してキャッシュに伝える
        const mylist_id_list = await this.getMylistIDList();
        mylist_id_list.push(mylist_id);
        this.nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);

        const item = {
            title: mylist.title,
            mylist_id: mylist_id,
            creator: mylist.creator
        };
        main_obs.trigger("mylist:sidebar:add-item", item);
        this.nico_mylist_store.save(mylist_id, this.nico_mylist.xml);
    },
    /**
     * 
     * @param {string} mylist_id 
     */
    cacheImage(mylist_id) {
        /** @type {HTMLImageElement[]} */
        const elms = this.$$(".mylist-img");
        elms.forEach(elm => {
            this.nico_mylist_image_cache.setImage(mylist_id, elm);
        });
    },
    onCancelUpdate() {
        if(this.nico_mylist){
            this.nico_mylist.cancel();
        }
    },
    async updateMylist() {
        if(this.modal_dialog.isOpend()){
            return;
        }
        
        this.obs_modal_dialog.trigger("show", {
            message: "更新中...",
            buttons: ["cancel"],
            cb: ()=>{
                this.onCancelUpdate();
            }
        });
        
        try {
            const mylist_id = this.getMylistID();
            await this.getMylist(mylist_id);

            const mylist_id_list = await this.getMylistIDList();
            if(mylist_id_list.includes(mylist_id)){
                this.nico_mylist_store.save(mylist_id, this.nico_mylist.xml);
            }
        } catch (error) {
            if(!error.cancel){
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBoxOK({
                    type: "error",
                    message: error.message
                });
            }
        }

        this.obs_modal_dialog.trigger("close");
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    async onkeydownUpdateMylist(e) { 
        if(e.target.value && e.code.toLowerCase()=="enter"){
            await this.updateMylist();
        }
    },
    async onclickUpdateMylist(e) { // eslint-disable-line no-unused-vars
        await this.updateMylist();
    },
    async onclickSaveMylist(e) { // eslint-disable-line no-unused-vars
        const mylist_id = this.getMylistID();
        if(await this.existMylist(mylist_id)){
            this.is_current_fav = true;
            this.update();
            return;
        }

        await progressDailog(this.modal_dialog, this.obs_modal_dialog,
            {
                message:"更新中...",
                cb:() => { this.onCancelUpdate(); }
            },
            async ()=>{
                this.nico_mylist = new NicoMylist();
                const mylist = await this.nico_mylist.getMylist(mylist_id);
                await this.addMylist(mylist); // サイドバーのアイテムに追加
                await this.setMylist(mylist, false); // データ設定してgird更新
                this.cacheImage(mylist.mylist_id);

                this.is_current_fav = true;
                this.update();
            });
    }
};