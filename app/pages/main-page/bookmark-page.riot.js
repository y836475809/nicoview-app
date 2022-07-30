/* globals riot */
const myapi = require("../../js/my-api");
const { Command } = require("../../js/command");
const time_format = require("../../js/time-format");
const { MyObservable } = require("../../js/my-observable");

/** @type {MyObservable} */
const main_obs = riot.obs;

/**
 * 
 * @param {RiotComponent} tag 
 * @param {[]} items 
 */
const resizeHeight = (tag, items) => {
    /** @type {HTMLElement} */
    const sidebar = tag.$(".sidebar");
    /** @type {HTMLElement} */
    const content = tag.$(".content");
    const item_height = 30;
    const new_height = items.length*item_height;
    sidebar.style.height = (new_height + 35) + "px";
    content.style.height = new_height + "px";
};

module.exports = {
    /** @type {MyObservable} */
    obs_listview:null,
    sb_button_icon:"fas fa-chevron-left",
    name: "bookmark",
    onBeforeMount() {
        this.obs_listview = new MyObservable();

        /**
         * 
         * @param {BookmarkListItem} item 
         * @returns {string}
         */
        this.geticon = (item) => {  // eslint-disable-line no-unused-vars
            return "fas fa-bookmark fa-lg";
        };

        /**
         * 
         * @param {BookmarkListItem} item 
         * @returns {string}
         */
        this.getTitle = (item) => {
            const { title, data } = item;
            if(data.time>0){
                return `[${time_format.toTimeString(data.time)}] ${title}`;
            }else{
                return title;
            }
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:BookmarkListItem[]}} */
            const { items } = args;
            await myapi.ipc.Bookmark.updateItems(items);
            resizeHeight(this, items);
        });

        this.obs_listview.onReturn("show-contextmenu", async (e, args) => {
            /** @type {{items:BookmarkListItem[]}} */
            const { items } = args;

            const menu_id = await myapi.ipc.popupContextMenu("listview-bookmark", {items});
            if(menu_id=="go-to-library"){
                const video_id = items[0].data.video_id;
                const exist = await myapi.ipc.Library.hasItem(video_id);
                if(exist){
                    main_obs.trigger("main-page:select-page", "library");
                    main_obs.trigger("library-page:scrollto", video_id);     
                } 
            }
            if(menu_id=="toggle-mark"){
                this.obs_listview.trigger("toggle-mark", { items });
            }
        });

        this.obs_listview.on("item-dlbclicked", (
            /** @type {BookmarkListItem} */ item) => {  
            const { video_id, time } = item.data;
            Command.play({
                id : video_id,
                time : time
            }, false);
        });
        
        main_obs.on("bookmark-page:add-items", (
            /** @type {BookmarkItem[]} */ items) => {
            const bk_items = items.map(item => {
                return {
                    title: item.title,
                    type: "video",
                    data: {
                        video_id: item.id,
                        time: item.time
                    }
                };
            });
            this.obs_listview.trigger("addList", { items:bk_items });
        });
    },
    async onMounted() {
        // TODO error対応
        const items = await myapi.ipc.Bookmark.getItems();
        this.obs_listview.trigger("loadData", { items });

        resizeHeight(this, items);
    }
}; 