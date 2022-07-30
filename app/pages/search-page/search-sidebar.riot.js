/* globals riot */
const myapi = require("../../js/my-api");
const { searchItems } = require("../../js/nico-search");
const { MyObservable } = require("../../js/my-observable");

/** @type {MyObservable} */
const main_obs = riot.obs;

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,
    name:"nico-search",
    onBeforeMount() {
        this.obs_listview = new MyObservable();
        
        /** @param {SearchListItem} item */
        this.geticon = (item) => {
            const search_target = item.cond.search_target;
            if(search_target == "keyword"){
                return "fas fa-ellipsis-h nico-search-item-adjust";
            }
            if(search_target == "tag"){
                return "fas fa-tag fa-lg";
            }
            return null;
        };

        const sort_map = new Map();
        const search_target_map = new Map();
        searchItems.sortItems.forEach(item => {
            sort_map.set(`${item.name}${item.order}`, item.title);
        });
        searchItems.searchTargetItems.forEach(item => {
            search_target_map.set(item.target, item.title);
        });
    
        /** @param {SearchListItem} item */
        this.getTooltip = (item) => {
            const cond = item.cond;
            const sort = sort_map.get(`${cond.sort_name}${cond.sort_order}`);
            const target = search_target_map.get(cond.search_target);
            return `${item.title}\n並び順: ${sort}\n種類: ${target}`;
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:SearchListItem[]}} */
            const { items } = args;
            items.forEach(item => {
                delete item.type;
            });
            await myapi.ipc.Search.updateItems(items);
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            /** @type {SearchListItem} */
            const list_item = item;
            main_obs.trigger("search-page:item-dlbclicked", list_item.cond);
        });

        main_obs.on("search-page:sidebar:add-item", (cond) => {
            /** @type {SearchCond} */
            const search_cond = cond;
            const items = [
                { 
                    title: search_cond.query, 
                    type:search_cond.search_target , 
                    cond: search_cond 
                }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        main_obs.on("search-page:sidebar:reload-items", async () => {
            await this.loadItems();
        });
    },
    async onMounted() {
        await this.loadItems();
    },
    async loadItems() {
        const items = await myapi.ipc.Search.getItems();
        items.forEach(item => {
            item.type = item.cond.search_target;
        });
        this.obs_listview.trigger("loadData", { items });
    }
};