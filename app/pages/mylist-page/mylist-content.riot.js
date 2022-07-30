/* globals riot */
const myapi = require("../../js/my-api");
const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = require("../../js/gridtable");
const { Command } = require("../../js/command");
const { NicoMylist, NicoMylistStore, NicoMylistImageCache } = require("../../js/nico-mylist");
const { needConvertVideo } = require("../../js/video-converter");
const { ModalDialog } = require("../../js/modal-dialog");
const { progressDailog } = require("../../js/modal-dialog-util");
const { MyObservable } = require("../../js/my-observable");
const { logger } = require("../../js/logger");

/** @type {MyObservable} */
const main_obs = riot.obs;

/**
 * 
 * @param {RiotComponent} tag 
 * @returns {string}
 */
const getMylistID = (tag) => {
    /** @type {HTMLInputElement} */
    const elm = tag.$(".mylist-input");
    return elm.value;
};

/**
 * 
 * @param {RiotComponent} tag 
 * @param {string} id 
 */
const setMylistID = (tag, id) => {
    /** @type {HTMLInputElement} */
    const elm = tag.$(".mylist-input");
    elm.value = id;
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

    /** @type {GridTable} */
    grid_table:null,
    is_current_fav:false,
    onBeforeMount() {  
        this.obs_modal_dialog = new MyObservable();

        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = this.grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                this.grid_table.dataView.updateItem(video_id, item);    
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            this.grid_table.updateCells(video_id, { saved:true });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            this.grid_table.updateCells(video_id, { saved:false });
        });

        main_obs.on("mylist-page:item-dlbclicked", async (item) => {
            /** @type {string} */
            const mylist_id = item.mylist_id;
            if(this.loaded_mylist_id == mylist_id){
                await this.updateMylist();
            }else{
                try {
                    const mylist = this.nico_mylist_store.load(mylist_id);
                    setMylistID(this, mylist_id);
                    await this.setMylist(mylist); 
                } catch (error) {
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }
        });

        main_obs.on("mylist-page:load-mylist", async(mylist_id)=> {
            setMylistID(this, mylist_id);
            try {
                if(await this.existMylist(mylist_id)){
                    await this.setMylist(this.nico_mylist_store.load(mylist_id)); 
                }else{
                    await this.getMylist(mylist_id);
                }
                main_obs.trigger("mylist-page:sidebar:select-item", { mylist_id });
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }   
        });

        main_obs.on("mylist-page:items-deleted", async (args)=> {
            /** @type {{items:MyListListItem[]}} */
            const { items } = args;
            items.forEach(item => {
                const mylist_id = item.mylist_id;
                this.nico_mylist_store.delete(mylist_id);
                this.nico_mylist_image_cache.delete(mylist_id);
            }); 

            const mylist_id = getMylistID(this);
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

        /**
         * 
         * @param {number} row 
         * @param {*} cell 
         * @param {string} value 
         * @param {*} columnDef 
         * @param {*} dataContext 
         * @returns 
         */
        const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
            /** @type {string} */
            const mylist_id = dataContext.mylist_id;
            const url = value;
            return this.nico_mylist_image_cache.getImageHtml(mylist_id, url);
        };

        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> { // eslint-disable-line no-unused-vars
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };

        const mylist_infoFormatter = infoFormatter.bind(this, 
            (value, dataContext)=>{ 
                return `<div>ID: ${dataContext.id}</div>`;
            });
        const columns = [
            {id: "no", name: "#"},
            {id: "thumb_img", name: "サムネイル", width: 130, formatter:imageCacheFormatter},
            {id: "title", name: "名前", formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報", formatter:mylist_infoFormatter},
            {id: "description", name: "説明", formatter:htmlFormatter},
            {id: "date", name: "投稿日"},
            {id: "length", name: "時間"}
        ];
        const options = {
            rowHeight: 100,
        };    
        this.grid_table = new GridTable("mylist-grid", columns, options);
    },
    async onMounted() {
        const mylist_dir = await myapi.ipc.MyList.getMyListDir();  
        this.nico_mylist_store = new NicoMylistStore(mylist_dir);
        this.nico_mylist_image_cache = new NicoMylistImageCache(mylist_dir);

        const grid_container = this.$(".mylist-grid");
        this.grid_table.init(grid_container);
        this.grid_table.setupResizer(".mylist-grid-container");
        this.grid_table.onDblClick(async (e, data)=>{
            /** @type {string} */
            const video_id = data.id;
            /** @type {LibraryData} */
            const video_item = await myapi.ipc.Library.getItem(video_id);
            if(needConvertVideo(video_item)===true){      
                const ret = await myapi.ipc.Dialog.showMessageBox({
                    message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                    okcancel: true
                });
                if(!ret){
                    return;
                }
                main_obs.trigger("library-page:convert-video", video_id);
            }else{
                Command.play(data, false);
            }
        });
        this.grid_table.onButtonClick(async (e, cmd_id, data)=>{
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
        
        this.grid_table.onContextMenu(async (e)=>{ // eslint-disable-line no-unused-vars
            const items = this.grid_table.getSelectedDatas();
            if(items.length==0){
                return;
            }
            const video_id = items[0].id;
            const video_item = await myapi.ipc.Library.getItem(video_id);
            const need_convert = needConvertVideo(video_item);
            const context_menu_type = need_convert?"convert-video":"main";
            const menu_id = await myapi.ipc.popupContextMenu("mylist", {context_menu_type, items});
            if(!menu_id){
                return;
            }
            if(menu_id=="convert-video"){
                main_obs.trigger("library-page:convert-video", video_id); 
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
        /** @type {{items:MyListListItem[]}} */
        const { items } = await main_obs.triggerReturn("mylist-page:sidebar:get-items");
        const mylist_id_list = items.map(item => {
            return item.mylist_id;
        });
        return mylist_id_list;            
    },
    /**
     * 
     * @param {string} id 
     * @returns {boolean}
     */
    async existMylist(id) {
        const ids = await this.getMylistIDList();
        return ids.includes(id);
    },
    /**
     * 
     * @param {{id:string}} item 
     * @param {boolean} online 
     * @returns {Promise<void>}
     */
    async play(item, online) {
        const video_id = item.id;
        const video_item = await myapi.ipc.Library.getItem(video_id);
        if(!online && needConvertVideo(video_item)){       
            const ret = await myapi.ipc.Dialog.showMessageBox({
                message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                okcancel: true
            });
            if(!ret){
                return;
            }
            main_obs.trigger("library-page:convert-video", video_id);
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
     * @param {MyListData} mylist 
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
        main_obs.trigger("mylist-page:sidebar:select-item", { mylist_id: mylist.mylist_id });
        this.update();

        this.setData(mylist);
    },
    /**
     * 
     * @param {MyListData} mylist 
     */
    async setData(mylist) {
        this.loaded_mylist_id = mylist.mylist_id;
        
        const mylist_items = mylist.items;
        const video_ids = await myapi.ipc.Download.getIncompleteIDs();
        for (let i=0; i<mylist_items.length; i++) {
            const item = mylist_items[i];
            const video_id = item.id;
            item.saved = await myapi.ipc.Library.hasItem(video_id);
            item.reg_download = video_ids.includes(video_id);  
            item.mylist_id = mylist.mylist_id;
        }
        this.grid_table.clearSelected();
        this.grid_table.setData(mylist_items);
        this.grid_table.scrollToTop();   
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
     * @param {MyListData} mylist 
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
        main_obs.trigger("mylist-page:sidebar:add-item", item);
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
            const mylist_id = getMylistID(this);
            await this.getMylist(mylist_id);

            const mylist_id_list = await this.getMylistIDList();
            if(mylist_id_list.includes(mylist_id)){
                this.nico_mylist_store.save(mylist_id, this.nico_mylist.xml);
            }
        } catch (error) {
            if(!error.cancel){
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBox({
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
        const mylist_id = getMylistID(this);
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