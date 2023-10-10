const myapi = require("../../lib/my-api");
const { Command } = require("../../lib/command");
const time_format = require("../../lib/time-format");
const { MyObservable, window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,
    sb_button_icon:"fas fa-chevron-left",
    name: "bookmark",
    /**
     * 
     * @param {BookmarkItem[]} items 
     */
    resizeHeight(items){
        /** @type {HTMLElement} */
        const sidebar = this.$(".sidebar");
        /** @type {HTMLElement} */
        const content = this.$(".content");
        const item_height = 30;
        const new_height = items.length*item_height;
        sidebar.style.height = (new_height + 35) + "px";
        content.style.height = new_height + "px";
    },
    onBeforeMount() {
        this.obs_listview = new MyObservable();

        /**
         * 
         * @param {BookmarkItem} item 
         * @returns {string}
         */
        this.geticon = (item) => {  // eslint-disable-line no-unused-vars
            return "fas fa-bookmark fa-lg";
        };

        /**
         * 
         * @param {BookmarkItem} item 
         * @returns {string}
         */
        this.getTitle = (item) => {
            const { title, time } = item;
            if(time>0){
                return `[${time_format.toTimeString(time)}] ${title}`;
            }else{
                return title;
            }
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:BookmarkItem[]}} */
            const { items } = args;
            await myapi.ipc.Bookmark.updateItems(items);
            this.resizeHeight(items);
        });

        this.obs_listview.onReturn("show-contextmenu", async (e, args) => {
            /** @type {{items:BookmarkItem[]}} */
            const { items } = args;

            const menu_id = await myapi.ipc.popupContextMenu("listview-bookmark", {items});
            if(menu_id=="go-to-library"){
                const video_id = items[0].video_id;
                const exist = await myapi.ipc.Library.hasItem(video_id);
                if(exist){
                    main_obs.trigger("main:select-page", "library");
                    main_obs.trigger("library:scrollto", video_id);     
                } 
            }
            if(menu_id=="toggle-mark"){
                this.obs_listview.trigger("toggle-mark", { items });
            }
        });

        this.obs_listview.on("item-dlbclicked", (
            /** @type {BookmarkItem} */ item) => {  
            const { video_id, time } = item;
            Command.play({
                video_id : video_id,
                time : time
            }, false);
        });
        
        main_obs.on("bookmark:add-items", (
            /** @type {BookmarkItem[]} */ items) => {
            this.obs_listview.trigger("addList", { items });
        });
    },
    async onMounted() {
        // TODO error対応
        const items = await myapi.ipc.Bookmark.getItems();
        this.obs_listview.trigger("loadData", { items });
        this.resizeHeight(items);
    }
}; 