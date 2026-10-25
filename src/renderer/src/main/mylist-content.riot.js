import mitt from 'mitt';
import { infoFormatter, wrapFormatter } from "@renderer/common/nico-grid-formatter.js";
import { mountNicoGrid } from "@renderer/common/nico-grid-mount.js";
import { MyObservable, window_obs } from "@lib/my-observable.js";
import { logger } from "@lib/logger.js";

import NicoGrid from '@renderer/common/nico-grid.riot';
import ModalDialog from '@renderer/common/modal-dialog.riot';

const needConvertVideo = (value) => {
    let video_type = "";
    if(typeof value == "string"){
        video_type = value;
    }else if(value===null){
        return false;
    }else{
        video_type = value.video_type;
    }

    return /mp4/.test(video_type)!==true;
};

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "mylist-nico-grid";

export default {
    state:{
        mylist_description:"",
        /** @type {import('@/types/events.js').DialogEmitter} */
        dialogEmitter: mitt()
    },

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

    components: {
        'nico-grid': NicoGrid,
        'modal-dialog': ModalDialog
    },

    async onBeforeMount() {  
        window.electronAPI.on('library:addItem', (item) => {
            const video_id = item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: true }
            });
        });

        window.electronAPI.on('library:deleteItem', (item) => {
            const video_id = item.video_id;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved: false }
            });
        });
        window.electronAPI.on('download:addMark', async(videId, mark) => {
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                if(mark==='downloaded'){
                    item.saved = true;
                }
                if(mark==='reg'){
                    item.reg_download = true;
                }
                this.nico_grid_obs.trigger("update-item", {
                    id: video_id,
                    props: item
                });    
            }
        });
        window.electronAPI.on('download:deleteMark', (videId, mark) => {
            const items = this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.video_id;
                if(mark==='downloaded'){
                    item.saved = false;
                }
                if(mark==='reg'){
                    item.reg_download = false;
                }
                this.nico_grid_obs.trigger("update-item", {
                    id: video_id,
                    props: item
                });    
            }
        });

        main_obs.on("mylist:item-dlbclicked", async (item) => {
            /** @type {string} */
            const mylist_id = item.mylist_id;
            if(this.loaded_mylist_id == mylist_id){
                await this.updateMylist();
            }else{
                try {
                    const mylist = await window.electronAPI.invoke('mylist:getPage', mylist_id)
                    this.setMylistID(mylist_id);
                    await this.setMylist(mylist); 
                } catch (error) {
                    logger.error(error);
                    await window.electronAPI.invoke('showErrorMsgBox', error.message);
                }
            }
        });

        main_obs.on("mylist:load-mylist", async(mylist_id)=> {
            this.setMylistID(mylist_id);
            try {
                if(await this.existMylist(mylist_id)){
                    await this.setMylist(await window.electronAPI.invoke('mylist:getPage', mylist_id)); 
                }else{
                    await this.getMylist(mylist_id);
                }
                main_obs.trigger("mylist:sidebar:select-item", { mylist_id });
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await window.electronAPI.invoke('showErrorMsgBox', error.message);
                }
            }   
        });

        main_obs.on("mylist:items-deleted", async (args)=> {
            /** @type {{items:MyListIndexItem[]}} */
            const { items } = args;
            items.forEach(item => {
                const mylist_id = item.mylist_id;
                window.electronAPI.invoke('mylist:deletPage', mylist_id);
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
            window.electronAPI.invoke('mylist:saveImageCache', mylist_id_list);
        });

        /**
         * 
         * @param {string} id 
         * @param {string} value 
         * @param {object} data 
         * @returns 
         */
        const imageCacheFormatter = async (id, value, data)=> {
            /** @type {string} */
            const mylist_id = data.mylist_id;
            const url = value;
            const html = await window.electronAPI.invoke('mylist:getImageHtml', mylist_id, url);
            return `<div class="mylist-grid-img-holder">${html}</div>`;
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
            {id: "description", name: "説明", ft: wrapFormatter},
            {id: "date", name: "投稿日"},
            {id: "length", name: "時間", ft: htmlFormatter}
        ];
        /** @type {NicoGridOptions} */
        const options = {
            sort_param: {
                id: "",
                asc: true,
                enable: false
            }
        };
        this.nico_grid_obs = new MyObservable();
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await window.electronAPI.invoke('config:set', 'mylist_nico_grid', state);
        });
        this.nico_grid_obs.on("db-cliecked", async (args) => {
            const { data } = args;
            /** @type {string} */
            const video_id = data.video_id;
            if(!video_id){
                return;
            }
            const videoItem = await window.electronAPI.invoke('library:getItem', video_id);
            if(needConvertVideo(videoItem)===true){      
                const msg = '保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?';
                const ret = await window.electronAPI.invoke('showMsgBox', 'okCancel', msg);
                if(!ret){
                    return;
                }
                main_obs.trigger("library:convert-video", video_id);
            }else{
                // Command.play(data, false);
            }
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                await this.play(data, false);
            }
            if(cmd_id == "stack"){
                // Command.addStackItems(main_obs, [data]);
            }
            if(cmd_id == "bookmark"){
                // Command.addBookmarkItems(main_obs, [data]);
            }
            if(cmd_id == "download"){
                // Command.addDownloadItems(main_obs, [data]);
            }
        });
        
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            if(items.length==0){
                return;
            }
            const video_id = items[0].video_id;
            const videoItem = await window.electronAPI.invoke('library:getItem', video_id);
            const need_convert = needConvertVideo(videoItem);
            const context_menu_type = need_convert?"convert-video":"main";
            // const menu_id = await myapi.ipc.popupContextMenu("mylist", {context_menu_type, items});
            // if(!menu_id){
            //     return;
            // }
            // if(menu_id=="convert-video"){
            //     main_obs.trigger("library:convert-video", video_id); 
            // }
        }); 
        const state = (await window.electronAPI.invoke('config:get')).mylist_nico_grid;
        if(state.columns.length === 0){
            state.columns = columns.map(col => {
                return {id:col.id, width:100};
            });
        };
        const gridData = mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        this.update({
            gridData:gridData
        });
    },
    async onMounted() {
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
        const libraryItem = await window.electronAPI.invoke('library:getItem', video_id);
        if(!online && needConvertVideo(libraryItem)){       
            const msg = '保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?';
            const ret = await window.electronAPI.invoke('showMsgBox', 'okCancel', msg);
            if(!ret){
                return;
            }
            main_obs.trigger("library:convert-video", video_id);
        }else{
            // Command.play(item, online);
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
            await window.electronAPI.invoke('mylist:loadImageCache', mylist_id_list, mylist.mylist_id);
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
        const video_ids = await window.electronAPI.invoke('download:getMarkedIds');
        for (let i=0; i<mylist_items.length; i++) {
            const item = mylist_items[i];
            const video_id = item.video_id;
            item.saved = await window.electronAPI.invoke('library:exists', video_id);
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
        const mylist = await window.electronAPI.invoke('mylist:fetchPage', mylist_id);
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
        await window.electronAPI.invoke('mylist:setImageIds', mylist_id_list);

        const item = {
            title: mylist.title,
            mylist_id: mylist_id,
            creator: mylist.creator
        };
        main_obs.trigger("mylist:sidebar:add-item", item);
        await window.electronAPI.invoke('mylist:savePage', mylist_id);
    },
    /**
     * 
     * @param {string} mylist_id 
     */
    cacheImage(mylist_id) {
        /** @type {HTMLImageElement[]} */
        const elms = this.$$(".mylist-img");
        elms.forEach(async elm => {
            await window.electronAPI.invoke('mylist:setImage', mylist_id, elm);
        });
    },
    onCancelUpdate() {
        if(this.nico_mylist){
            this.nico_mylist.cancel();
        }
    },
    async updateMylist() {
        this.state.dialogEmitter.emit('dialog:open', {
            showok: false,
            showcancel: true,
            message: "更新中..."
        });
        this.state.dialogEmitter.on('dialog:cancel', () => {
            this.onCancelUpdate();
        });

        try {
            const mylist_id = this.getMylistID();
            await this.getMylist(mylist_id);

            const mylist_id_list = await this.getMylistIDList();
            if(mylist_id_list.includes(mylist_id)){
                window.electronAPI.invoke('mylist:savePage', mylist_id);
            }
        } catch (error) {
            if(!error.cancel){
                logger.error(error);
                await window.electronAPI.invoke('showErrorMsgBox', error.message);
            }
        }

        this.state.dialogEmitter.emit('dialog:close');
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

        this.state.dialogEmitter.emit('dialog:open', {
            showok: false,
            showcancel: true,
            message: "更新中..."
        });
        this.state.dialogEmitter.on('dialog:cancel', () => {
            this.onCancelUpdate();
        });
        try {
            const mylist = await window.electronAPI.invoke('mylist:fetchPage', mylist_id);
            await this.addMylist(mylist); // サイドバーのアイテムに追加
            await this.setMylist(mylist, false); // データ設定してgird更新
            this.cacheImage(mylist.mylist_id);

            this.is_current_fav = true;
            this.update();
        } catch (error) {
            if(!error.cancel){
                logger.error(error);
                await window.electronAPI.invoke('showErrorMsgBox', error.message);
            }
        }
        this.state.dialogEmitter.emit('dialog:close');
    }
};
