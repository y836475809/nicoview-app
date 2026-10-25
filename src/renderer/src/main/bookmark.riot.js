import * as time_format from "@lib/time-format.js";
import { MyObservable, window_obs } from "@lib/my-observable.js";

import Listview from '@renderer/common/listview.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

export default {
    /** @type {MyObservable} */
    obs_listview:null,
    sb_button_icon:"fas fa-chevron-left",
    name: "bookmark",

    components: {
        'listview': Listview,
    },
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
            await window.electronAPI.invoke('bookmark:saveItems', items);
            this.resizeHeight(items);
        });

        this.obs_listview.onReturn("show-contextmenu", async (e, args) => {
            /** @type {{items:BookmarkItem[]}} */
            const { items } = args;
            // TODO
            // const menu_id = await myapi.ipc.popupContextMenu("listview-bookmark", {items});
            // if(menu_id=="go-to-library"){
            //     const video_id = items[0].video_id;
            //     const exist = await myapi.ipc.Library.hasItem(video_id);
            //     if(exist){
            //         main_obs.trigger("main:select-page", "library");
            //         main_obs.trigger("library:scrollto", video_id);     
            //     } 
            // }
            // if(menu_id=="toggle-mark"){
            //     this.obs_listview.trigger("toggle-mark", { items });
            // }
        });
        
        window.electronAPI.on('bookmark:additem', (item) => {
             this.obs_listview.trigger("addList", { items:[item] });
        });
    },
    async onMounted() {
        const items = await window.electronAPI.invoke('bookmark:getItems');
        this.obs_listview.trigger("loadData", { items });
        this.resizeHeight(items);
    }
}; 