const myapi = require("../../lib/my-api");
const { MyObservable, window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,

    name:"mylist",

    /** @type {MyListIndexItem[]} */
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
            /** @type {{items:MyListIndexItem[]}} */
            const { items } = args;
            this.items = items;

            await myapi.ipc.MyList.updateItems(items);
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            main_obs.trigger("mylist:item-dlbclicked", item);
        });
        
        this.obs_listview.on("items-deleted", (args) => {
            main_obs.trigger("mylist:items-deleted", args);
        });

        main_obs.on("mylist:sidebar:add-item", (args) => {
            /** @type {{title:string, mylist_id:string, creator:string}} */
            const { title, mylist_id, creator } = args;
            const items = [
                { title, mylist_id, creator }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        main_obs.onReturn("mylist:sidebar:get-items", () => {
            return {items:this.items};
        });

        main_obs.on("mylist:sidebar:select-item", (args) => {
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

        main_obs.on("mylist:sidebar:reload-items", async () => {
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