const myapi = require("../../lib/my-api");
const { mountNicoGrid } = require("../common/nico-grid-mount");
const { infoFormatter, tagsFormatter } = require("../common/nico-grid-formatter");
const { Command } = require("../../lib/command");
const { NicoSearchParams, NicoSearch, searchItems } = require("../../lib/nico-search");
const { ModalDialog } = require("../../lib/modal-dialog");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

const nico_grid_name = "search-nico-grid";

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

module.exports = {
    state:{
        sort_title:"",
        search_target_title:"",
    },

    /** @type {NicoSearchSortItem[]} */
    sort_items:searchItems.sortItems,

    /** @type {NicoSearchTargetItem[]} */
    search_target_items:searchItems.searchTargetItems,

    /** @type {MyObservable} */
    obs_modal_dialog:null,

    /** @type {MyObservable} */
    pagination_obs:null,

    /** @type {NicoSearchParams} */
    nico_search_params:null,

    /** @type {NicoSearch} */
    nico_search:null,

    onBeforeMount() {
        this.obs_modal_dialog = new MyObservable();
        this.modal_dialog = null;

        this.pagination_obs = new MyObservable();

        const search_limit = 32;
        const search_context = myapi.getUserAgent();
        this.nico_search_params = new NicoSearchParams(search_limit, search_context);
        this.nico_search = new NicoSearch();

        this.pagination_obs.on("move-page", async args => {
            const { page_num } = args;
            this.nico_search_params.page(page_num);
            await this.search();
        });

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
                props: { saved:true }
            });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            this.nico_grid_obs.trigger("update-item", {
                id: video_id,
                props: { saved:false }
            });
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
    },
    async onMounted() {
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
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid(`#${nico_grid_name}`, state, this.nico_grid_obs, columns, options);

        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", (args) => {
            const { data } = args;
            if(data.video_id){
                Command.play(data, false);
            }
        });
        this.nico_grid_obs.on("cmd", (args) => {
            const { cmd_id, data } = args;
            if(cmd_id == "play"){
                Command.play(data, false);
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
            const sel_data_list = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
            const items = sel_data_list.filter(value => {
                return value.video_id!="";
            });
            if(items.length===0){
                return;
            }
            await myapi.ipc.popupContextMenu("search", {items});
        });

        const { api, sort_item, search_target_item } = await this.loadSearchConfig();
        this.state.sort_title = sort_item.title;
        this.state.search_target_title = search_target_item.title;
        this.nico_search_params.api(api);
        this.nico_search_params.page(0);
        this.nico_search_params.sortName(sort_item.name);
        this.nico_search_params.sortOder(sort_item.order);
        this.nico_search_params.target(search_target_item.target);

        this.update();

        this.modal_dialog = new ModalDialog(this.root, "search-md", {
            obs:this.obs_modal_dialog,
            oncancel: this.onCancelSearch
        });
    },
    async loadSearchConfig() {
        const { api, sort, search_target } = await myapi.ipc.Config.get("search.condition",  {
            api:"snapshot",
            sort:{ name:"startTime", order:"-" },
            search_target:{ target:"tag" }
        });
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
        await myapi.ipc.Config.set("search.condition", {
            api: api,
            sort:{ name:sort_name, order:sort_order },
            search_target:{ target:search_target } 
        });
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
        return !this.modal_dialog.isOpend();
    },
    async search() {
        if(this.nico_search_params.isQueryEmpty()){
            return;
        }

        if(!this.canSearch()){
            return;
        }
        
        this.obs_modal_dialog.trigger("show", {
            message: "検索中...",
            buttons: ["cancel"],
            cb: ()=>{
                this.onCancelSearch();
            }
        });

        try {
            const search_result = await this.nico_search.search(this.nico_search_params);
            this.setData(search_result);
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

        const elm = this.getSearchInputElm();
        elm.focus();
    },
    onCancelSearch() {
        this.nico_search.cancel();
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

        const video_ids = await myapi.ipc.Download.getIncompleteIDs();
        const items = await Promise.all(
            search_list.map(async value => {
                const video_id = value.contentId;
                const saved = await myapi.ipc.Library.hasItem(video_id);
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