import mitt from 'mitt';
import { MyObservable, window_obs } from "@lib/my-observable.js";
import {logger} from "@lib/logger.js";
import { buttonFormatter } from "@renderer/common/nico-grid-formatter.js";
import {mountNicoGrid} from "@renderer/common/nico-grid-mount.js";

import NicoGrid from '@renderer/common/nico-grid.riot';
import ModalDialog from '@renderer/common/modal-dialog.riot';

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

export default {
    state:{
        num_filtered_items:0,
        num_items:0,
        /** @type {import('@/types/events.js').DialogEmitter} */
        dialogEmitter: mitt()
    },

    /** @type {{title:string, id:string}[]} */
    search_targets:[],

    /** @type {ModalDialog} */
    modal_dialog:null,

    components: {
        'nico-grid': NicoGrid,
        'modal-dialog': ModalDialog
    },

    async onBeforeMount(props) {
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
        this.nico_grid_obs = new MyObservable();
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            window.electronAPI.invoke('config:set', 'library_nico_grid', state);
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
                const item = {
                    title: data.title, 
                    video_id: data.video_id,
                    thumb_img:data.thumb_img,
                    time: 0
                }
                await window.electronAPI.invoke('stack:addItem', item);
            }
            if(cmd_id == "bookmark"){
                const item = {
                    title: data.title, 
                    video_id: data.video_id,
                    time: 0,
                    marked: false
                }
                await window.electronAPI.invoke('bookmark:addItem', item);
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
            const videoId = items[0].video_id;
            const cmd = await window.electronAPI.invoke('library:showContextMenu', videoId);
            if(cmd === 'playOnline'){
                await window.electronAPI.invoke('player:play',  videoId, true);
            }
        });

        const config = await window.electronAPI.invoke('config:get');
        if(config.library_nico_grid.columns.length === 0){
            config.library_nico_grid =  {
                columns: columns.map(col => {
                    return {id:col.id, width:100};
                }),
                sort_param: {id: 'creation_date', asc: false, enable: true}
            };
        }
        const state =  config.library_nico_grid;
        const gridData = mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        this.update({
            gridData:gridData
        });

        /** @type {{title:string, id:string}[]} */
        this.search_targets = props.search_targets;

        window.electronAPI.on('library:filter', (query) => {
            const target_ids = this.getSearchTargetIDs();
            const search_elm = this.getSearchInputElm();
            search_elm.value = query;
            if(target_ids && search_elm){
                this.setSearchTargets(target_ids);
                this.filterItems(query, target_ids);  
            } 
        });

        const library_items = await window.electronAPI.invoke('library:getItems');
        await this.loadLibraryItems(library_items);

        main_obs.on("library:search-item-dlbclicked", (
            /** @type {LibrarySearchItem} */ item) => {
            const query = item.query;
            const target_ids = item.target_ids;

            const search_elm = this.getSearchInputElm();
            search_elm.value = query;
            this.setSearchTargets(target_ids);

            this.filterItems(query, target_ids);      
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
    },
    // /**
    //  * 
    //  * @param {LibraryItem[]} items 
    //  * @param {(nico_update:NicoUpdate)=>Promise<NicoUpdateResult>} func 
    //  * @returns 
    //  */
    // async updateNicoData(items, func) {
    //     let update_cancel = false;
    //     /** @type {NicoUpdate | null} */
    //     let nico_update = null;

    //     this.state.dialogEmitter.emit('dialog:open', {
    //         showok: false,
    //         showcancel: true,
    //         message: "..."
    //     });
    //     this.state.dialogEmitter.on('dialog:cancel', () => {
    //         if(nico_update){
    //             nico_update.cancel();
    //         }
    //         update_cancel = true;
    //     });

    //     let cur_update = 0; 
    //     const error_items = [];
    //     try {
            
    //         for(let item of items) {
    //             if(update_cancel){
    //                 const error = new Error("cancel");
    //                 error.cancel=true;   
    //                 throw error;
    //             }
                
    //             cur_update++;
    //             this.state.dialogEmitter.emit('dialog:update-message', {
    //                 message: `更新中 ${cur_update}/${items.length} 失敗:${error_items.length}`
    //             });
    //             this.nico_grid_obs.trigger("update-item", {
    //                 id: item.video_id,
    //                 props: { state: "更新中" }
    //             });
    //             try {
    //                 const video_item = await myapi.ipc.Library.getItem(item.video_id);
    //                 nico_update = new NicoUpdate(video_item);
    //                 const result = await func(nico_update);
    //                 if(result){
    //                     await myapi.ipc.Library.updateItemProps(result.video_id, result.props);
    //                     if(result.update_thumbnail){
    //                         const updated_video_item = await myapi.ipc.Library.getItem(result.video_id);
    //                         const video_data = new NicoVideoData(updated_video_item);
    //                         const thumb_img = `${video_data.getThumbImgPath()}?${new Date().getTime()}`;
    //                         this.nico_grid_obs.trigger("update-item", {
    //                             id: result.video_id,
    //                             props: { thumb_img }
    //                         }); 
    //                     }
    //                 }
    //                 this.nico_grid_obs.trigger("update-item", {
    //                     id: item.video_id,
    //                     props: { state: "更新完了" }
    //                 });
    //             } catch (error) {
    //                 if(error.cancel===true){   
    //                     this.nico_grid_obs.trigger("update-item", {
    //                         id: item.video_id,
    //                         props: { state: "更新キャンセル" }
    //                     });
    //                     throw error;
    //                 }else{
    //                     error_items.push(item);
    //                     logger.error(error);
    //                     this.nico_grid_obs.trigger("update-item", {
    //                         id: item.video_id,
    //                         props: { state: `更新失敗: ${error.message}` }
    //                     });
    //                 }
    //             }
    //             if(cur_update < items.length){
    //                 await wait(1000);
    //             }
    //             this.state.dialogEmitter.emit('dialog:update-message', {
    //                 message: `更新中 ${cur_update}/${items.length} 失敗:${error_items.length}`
    //             });
    //         }                
    //     } catch (error) {
    //         this.state.dialogEmitter.emit('dialog:update-message', {
    //             message: "更新キャンセル"
    //         });
    //     }
    //     this.state.dialogEmitter.emit('dialog:close');

    //     if(error_items.length > 0){
    //         await myapi.ipc.Dialog.showMessageBoxOK({
    //             type: "error",
    //             message: `${error_items.length}個が更新に失敗\n詳細はログを参照`
    //         });
    //     }else{
    //         await myapi.ipc.Dialog.showMessageBoxOK({
    //             type: "info",
    //             message: `更新完了(${cur_update}/${items.length})`
    //         });
    //     }
    // },
    /**
     * 
     * @param {string[]} video_ids 
     * @returns 
     */
    async deleteLibraryData(video_ids) {
        let cancel = false;
        this.state.dialogEmitter.emit('dialog:open', {
            showok: false,
            showcancel: true,
            message: "..."
        });
        this.state.dialogEmitter.on('dialog:cancel', () => {
            cancel = true;
        });    
        const error_ids = [];
        for (let index = 0; index < video_ids.length; index++) {
            if(cancel){
                break;
            }
            const video_id = video_ids[index];
            this.state.dialogEmitter.emit('dialog:update-message', {
                message: `${video_id}を削除中`
            });
            const err = await window.electronAPI.invoke('library:deleteItem', video_id);
            if(err){
                logger.error(err.message);
                error_ids.push(video_id);
            }
        }
        if(error_ids.length > 0){
            const msg = `${error_ids.length}個の削除に失敗\n詳細はログを参照`;
            await window.electronAPI.invoke('showErrorMsgBox', msg);
        }
        this.state.dialogEmitter.emit('dialog:close');
    },
    /**
     * 
     * @param {string} video_id 
     * @returns 
     */
    async convertVideo(video_id) {
        this.state.dialogEmitter.emit('dialog:open', {
            showok: false,
            showcancel: true,
            message: "mp4に変換中..."
        });
        const err = await window.electronAPI.invoke('library:convertToMp4', video_id);
        this.state.dialogEmitter.emit('dialog:close'); 
        if(err){
            await window.electronAPI.invoke('showErrorMsgBox', err.message);
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
        if(video_type.endsWith('mp4')){
            window.electronAPI.invoke('player:play', video_id, online);  
        }else{
            await window.electronAPI.invoke('showMsgBox', 'ok', `${video_type}のため再生できません`);
        }  
    }
};
