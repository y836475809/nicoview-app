/* globals riot */
const myapi = require("../../js/my-api");
const { MyObservable } = require("../../js/my-observable");

/** @type {MyObservable} */
const main_obs = riot.obs;

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,

    name:"mylist",

    /** @type {MyListListItem[]} */
    items:[],

    confirm:["delete"],
    onBeforeMount() {
        this.obs_listview = new MyObservable();

        this.getTooltip = (item) => {
            /** @type {{title:string, creator:string}} */
            const { title, creator } = item;
            return `[${creator}] ${title}`;
        };

        this.getTitle = (item) => {
            /** @type {{title:string, creator:string}} */
            const { title, creator } = item;
            return `[${creator}] ${title}`;
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:MyListListItem[]}} */
            const { items } = args;
            this.items = items;

            await myapi.ipc.MyList.updateItems(items);
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            main_obs.trigger("mylist-page:item-dlbclicked", item);
        });
        
        this.obs_listview.on("items-deleted", (args) => {
            main_obs.trigger("mylist-page:items-deleted", args);
        });

        main_obs.on("mylist-page:sidebar:add-item", (args) => {
            /** @type {{title:string, mylist_id:string, creator:string}} */
            const { title, mylist_id, creator } = args;
            const items = [
                { title, mylist_id, creator }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        main_obs.onReturn("mylist-page:sidebar:get-items", () => {
            return {items:this.items};
        });

        main_obs.on("mylist-page:sidebar:select-item", (args) => {
            /** @type {{mylist_id:string}} */
            const { mylist_id } = args;
            const index = this.items.findIndex(item => {
                return item.mylist_id == mylist_id;
            });

            if(index < 0){
                this.obs_listview.trigger("clear-select");
                return;
            }
            this.obs_listview.trigger("select-item-by-index", { index });
        });

        main_obs.on("mylist-page:sidebar:reload-items", async () => {
            await this.loadItems();
        });
    },
    async onMounted() {
        await this.loadItems();
    },
    async loadItems() {
        this.items = await myapi.ipc.MyList.getItems();
        this.obs_listview.trigger("loadData", { items:this.items });
    }
};