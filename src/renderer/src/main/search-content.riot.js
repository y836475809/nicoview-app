import mitt from 'mitt';
import { mountNicoGrid } from "@renderer/common/nico-grid-mount.js";
import { infoFormatter, tagsFormatter } from "@renderer/common/nico-grid-formatter.js";
import { NicoSearchParams, NicoSearch, searchItems } from "@lib/nico-search.js";
import { MyObservable, window_obs } from "@lib/my-observable.js";
import { logger } from "@lib/logger.js";

import Pagination from '@renderer/main/pagination.riot';
import NicoGrid from '@renderer/common/nico-grid.riot';
import ModalDialog from '@renderer/common/modal-dialog.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "search_nico_grid";

/**
 * 検索ページのグリッドテーブルに追加するアイテムを生成
 * @param {NicoSearchResultVideoItem} value 
 * @param {boolean} saved 
 * @param {boolean} reg_download 
 * @returns 
 */
const createItem = (value, saved, reg_download) => {
    return {
        thumb_img: value.thumbnailUrl,
        video_id: value.contentId,
        title: value.title,
        info: `ID:${value.contentId}<br>
                再生:${value.viewCounter.toLocaleString()}<br>
                コメント:${value.commentCounter.toLocaleString()}`,
        play_time: value.lengthSeconds,
        pub_date: value.startTime,
        tags: value.tags,
        saved: saved,
        reg_download: reg_download,
    };
};
const createEmptyItem = () => {
    return {
        thumb_img: "",
        video_id: "",
        title: "",
        info: "",
        play_time: -1,
        pub_date: -1,
        tags: "",
        saved: false,
        reg_download: false,
    };
};

export default {
    state:{
        sort_title:"",
        search_target_title:"",
        dialogEmitter: mitt()
    },

    /** @type {NicoSearchSortItem[]} */
    sort_items:searchItems.sortItems,

    /** @type {NicoSearchTargetItem[]} */
    search_target_items:searchItems.searchTargetItems,

    /** @type {MyObservable} */
    pagination_obs:null,

    /** @type {NicoSearchParams} */
    nico_search_params:null,

    /** @type {NicoSearch} */
    nico_search:null,

    doSearch: false,

    components: {
        'pagination': Pagination,
        'nico-grid': NicoGrid,
        'modal-dialog': ModalDialog
    },

    async onBeforeMount() {
        this.pagination_obs = new MyObservable();

        const search_limit = 32;
        const search_context = 'myapi.getUserAgent()'; // TODO
        this.nico_search_params = new NicoSearchParams(search_limit, search_context);
        this.nico_search = new NicoSearch();

        this.pagination_obs.on("move-page", async args => {
            const { page_num } = args;
            this.nico_search_params.page(page_num);
            await this.search();
        });

        window.electronAPI.on('download:addMark', async (videoId, mark) => {
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                if(videoId===item.video_id){
                    if(mark==='downloaded'){
                        item.saved = true;
                    }
                    if(mark==='reg'){
                        item.reg_download = true;
                    }
                    this.nico_grid_obs.trigger("update-item", {
                        id: videoId,
                        props: item
                    });
                    break;
                }
            }
        });
        window.electronAPI.on('download:deleteMark', async (videoId, mark) => {
            const items = await this.nico_grid_obs.triggerReturn("get-items");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                if(videoId===item.video_id){
                    if(mark==='downloaded'){
                        item.saved = false;
                    }
                    if(mark==='reg'){
                        item.reg_download = false;
                    }
                    this.nico_grid_obs.trigger("update-item", {
                        id: videoId,
                        props: item
                    });
                    break;
                }
            }
        });

        main_obs.on("search:item-dlbclicked", async (
            /** @type {NicoSearchParamsItem} */ item) => {
            const elm = this.getSearchInputElm();
            elm.value = item.query;
            this.nico_search_params.target(item.search_target);
            this.nico_search_params.query(item.query);
            this.nico_search_params.page(item.page); //TODO move last?
            this.nico_search_params.sortName(item.sort_name);
            this.nico_search_params.sortOder(item.sort_order);

            this.setSearchState(item.sort_name, item.sort_order, item.search_target);

            await this.search();
        });

        main_obs.on("search:search-tag", async (args)=> {
            /** @type {{query:string, search_target:string}} */
            const { query, search_target } = args;
            const elm = this.getSearchInputElm();
            elm.value = query;
            this.nico_search_params.target(search_target);
            this.nico_search_params.query(query);
            
            this.setSearchState(null, null, search_target);

            await this.search();
        });

        main_obs.on("search:search", async (args)=> {
            /** @type {NicoSearchParamsItem} */
            const cond = args;
            const { query, sort_order, sort_name, search_target, page } = cond;
            const elm = this.getSearchInputElm();
            elm.value = query;
            this.nico_search_params.target(search_target);
            this.nico_search_params.query(query);
            this.nico_search_params.sortName(sort_name);
            this.nico_search_params.sortOder(sort_order);
            this.nico_search_params.page(page);
            
            this.setSearchState(sort_name, sort_order, search_target);
            this.pagination_obs.trigger("set-page-num", { page_num:page });

            await this.search();
        });

        main_obs.on("search:forward-page", () => {
            if(!this.canSearch()){
                return;
            }
            this.pagination_obs.trigger("forward");
        });

        main_obs.on("search:back-page", () => {
            if(!this.canSearch()){
                return;
            }
            this.pagination_obs.trigger("back");
        });

        const seach_infoFormatter = infoFormatter.bind(this, 
            // eslint-disable-next-line no-unused-vars
            (id, value, data)=>{ 
                return `<div>${value}</div>`; 
            });
        const columns = [
            {id: "thumb_img", name: "サムネイル", width: 185},
            {id: "title", name: "名前"},
            {id: "command", name: "操作"},
            {id: "info", name: "情報", ft: seach_infoFormatter},
            {id: "pub_date", name: "投稿日"},
            {id: "play_time", name: "時間"},
            {id: "tags", name: "タグ, コメント", ft: tagsFormatter.bind(this, " ")},
        ];
        /** @type {NicoGridOptions} */
        const options = {
            filter_target_ids: [
                "title", "tags", "video_id"
            ],
            sort_param: {
                id: "",
                asc: true,
                enable: false
            }
        };
        const appConfig = await window.electronAPI.invoke('config:get');
        const state = appConfig.search_nico_grid;
        if(state.columns.length === 0){
            state.columns = columns.map(col => {
                return {id:col.id, width:100};
            });
        }
        this.nico_grid_obs = new MyObservable();
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await window.electronAPI.invoke('config:set', nico_grid_name, state);
        });
        this.nico_grid_obs.on("cmd", async (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                window.electronAPI.invoke('player:play', data.video_id, true);
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
            const sel_data_list = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            const items = sel_data_list.filter(value => {
                return value.video_id!="";
            });
            if(items.length===0){
                return;
            }
            // await myapi.ipc.popupContextMenu("search", {items});
        });
        const gridData = mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);
        this.update({
            gridData:gridData
        });
    },
    async onMounted() {
        const { api, sort_item, search_target_item } = await this.loadSearchConfig();
        this.state.sort_title = sort_item.title;
        this.state.search_target_title = search_target_item.title;
        this.nico_search_params.api(api);
        this.nico_search_params.page(0);
        this.nico_search_params.sortName(sort_item.name);
        this.nico_search_params.sortOder(sort_item.order);
        this.nico_search_params.target(search_target_item.target);

        this.update();
    },
    async loadSearchConfig() {
        const appConfig = await window.electronAPI.invoke('config:get');
        const { api, sort, search_target } = appConfig.search.condition;
        const sort_item = this.sort_items.find(item => {
            return item.name == sort.name 
                && item.order == sort.order;
        });
        const search_target_item = this.search_target_items.find(item => {
            return item.target == search_target.target;
        });

        return { api, sort_item, search_target_item };
    },
    async saveSearchConfig() {
        const api = this.nico_search_params.getAPI();
        const { sort_name, sort_order, search_target } = this.nico_search_params.getParams();
        const appConfig =  await window.electronAPI.invoke('config:get');
        appConfig.search.condition = {
            api: api,
            sort:{ name:sort_name, order:sort_order },
            search_target:{ target:search_target }
        }
        window.electronAPI.invoke('config:set', 'search', appConfig.search);
    },
    onclickToggleMenu(e) { // eslint-disable-line no-unused-vars
        /** @type {HTMLElement} */
        const elm = this.$(".cond-menu-container1");
        elm.classList.toggle("cond-menu-container-non");
        
        if(!elm.classList.contains("cond-menu-container-non")){
            /** @type {HTMLElement} */
            const sort_elm = this.$(".selected-container .cond-sort");
            const x = sort_elm.offsetLeft - 5;
            const y = sort_elm.offsetTop + sort_elm.clientHeight + 5;
            elm.style.left = x + "px";
            elm.style.top = y + "px";
        }
    },
    async onchangeSort(item, e) { // eslint-disable-line no-unused-vars
        /** @type {NicoSearchSortItem} */
        const search_sort_item = item;
        const { title, name, order } = search_sort_item;

        this.state.sort_title = title;
        this.update();

        this.nico_search_params.sortName(name);
        this.nico_search_params.sortOder(order);

        this.saveSearchConfig();

        await this.search();
    },
    async onchangeTarget(item, e) { // eslint-disable-line no-unused-vars
        /** @type {NicoSearchTargetItem} */
        const search_target_item = item;
        const { title, target } = search_target_item;

        this.state.search_target_title = title;
        this.update();

        this.nico_search_params.target(target);

        this.saveSearchConfig();

        await this.search();
    },
    /**
     * 
     * @returns {HTMLInputElement}
     */
    getSearchInputElm() {
        return this.$(".input-container > input");
    },
    canSearch() {
        return !this.doSearch;
    },
    async search() {
        if(this.nico_search_params.isQueryEmpty()){
            return;
        }

        if(!this.canSearch()){
            return;
        }
        
        this.state.dialogEmitter.emit('dialog:open', {
            showok: false,
            showcancel: true,
            message: "検索中..."
        });
        this.state.dialogEmitter.on('dialog:cancel', () => {
            this.onCancelSearch();
        });
        this.doSearch = true;
        try {
            const search_result = await this.nico_search.search(this.nico_search_params);
            this.setData(search_result);
        } catch (error) {
            if(!error.cancel){
                logger.error(error);
                await window.electronAPI.invoke('showErrorMsgBox', error.message);
            }
        }
        
        this.state.dialogEmitter.emit('dialog:close');
        this.doSearch = false;

        const elm = this.getSearchInputElm();
        elm.focus();
    },
    onCancelSearch() {
        this.nico_search.cancel();
        this.doSearch = false;
    },
    /**
     * 
     * @param {NicoSearchResultItem} search_result 
     */
    async setData(search_result) {     
        const page_info = search_result.page_ifno;
        const search_list = search_result.list;
        const { page_num, total_page_num, search_result_num } = page_info;

        this.pagination_obs.trigger("set-data", {
            page_num, total_page_num, search_result_num
        });

        const video_ids = await window.electronAPI.invoke('download:getMarkedIds');
        const items = await Promise.all(
            search_list.map(async value => {
                const video_id = value.contentId;
                const saved = await window.electronAPI.invoke('library:exists', video_id);
                const reg_download = video_ids.includes(video_id);
                return createItem(value, saved, reg_download);
            })
        );
        items.push(createEmptyItem());  
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "video_id",
            items: items
        });
    },
    /**
     * 
     * @param {string} sort_name 
     * @param {string} sort_order 
     * @param {string} search_target 
     */
    setSearchState(sort_name, sort_order, search_target) {
        if(sort_name){
            const result = this.sort_items.find(item => {
                return item.name == sort_name && item.order == sort_order;
            });
            if(result){
                this.state.sort_title = result.title;
            }
        }     
        if(search_target){
            const result = this.search_target_items.find(item => {
                return item.target == search_target;
            });
            if(result){
                this.state.search_target_title = result.title;
            }
        }
        this.update();
    },
    async onclickSearch(e){ // eslint-disable-line no-unused-vars
        const elm = this.getSearchInputElm();
        const query = elm.value;
        this.nico_search_params.query(query);
        await this.search();
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    async onkeydownInput(e){
        if(e.code.toLowerCase()=="enter"){
            /** @type {string} */
            const query = e.target.value;
            this.nico_search_params.query(query);
            await this.search();
        }
    },
    onclickAddSearch(e) { // eslint-disable-line no-unused-vars
        const elm = this.getSearchInputElm();
        if(!elm.value){
            return;
        }

        const { sort_name, sort_order, search_target } = this.nico_search_params.getParams();
        const cond = {
            query: elm.value,
            sort_name: sort_name,
            sort_order: sort_order,
            search_target: search_target,
            page: 1
        };
        
        main_obs.trigger("search:sidebar:add-item", cond);
    }
};
