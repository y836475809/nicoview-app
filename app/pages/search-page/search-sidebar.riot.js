const myapi = require("../../js/my-api");
const { searchItems } = require("../../js/nico-search");
const { MyObservable, window_obs } = require("../../js/my-observable");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,
    name:"nico-search",
    onBeforeMount() {
        this.obs_listview = new MyObservable();
        
        /** @param {NicoSearchParamsItem} item */
        this.geticon = (item) => {
            const search_target = item.search_target;
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
    
        /** @param {NicoSearchParamsItem} item */
        this.getTooltip = (item) => {
            const cond = item;
            const sort = sort_map.get(`${cond.sort_name}${cond.sort_order}`);
            const target = search_target_map.get(cond.search_target);
            return `${item.query}\n並び順: ${sort}\n種類: ${target}`;
        };

        /** @param {NicoSearchParamsItem} item */
        this.getTitle = (item) => {
            return item.query;
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:NicoSearchParamsItem[]}} */
            const { items } = args;
            await myapi.ipc.Search.updateItems(items);
        });

        this.obs_listview.on("item-dlbclicked", (
            /** @type {NicoSearchParamsItem} */ item) => {
            main_obs.trigger("search-page:item-dlbclicked", item);
        });

        main_obs.on("search-page:sidebar:add-item", (
            /** @type {NicoSearchParamsItem} */ item) => {
            const items = [item];
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
        this.obs_listview.trigger("loadData", { items });
    }
};