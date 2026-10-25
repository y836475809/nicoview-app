// import {myapi} from "@lib/my-api.js";
import { MyObservable, window_obs } from "@lib/my-observable.js";

import Listview from '@renderer/common/listview.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

export default {
    /** @type {MyObservable} */
    obs_listview:null,
    name:"library-search",

    components: {
        'listview': Listview,
    },

    onBeforeMount() {
        this.obs_listview = new MyObservable();

        const target_map = new Map();
        /** @type {{title:string, id:string}[]} */
        const search_targets = this.props.search_targets;
        search_targets.forEach(target=>{
            target_map.set(target.id, target.title);
        });

        /**
         * 
         * @param {LibrarySearchItem} item 
         * @returns {string}
         */
        this.gettooltip = (item) => {
            const target_ids = item.target_ids;
            if(!target_ids){
                return item.title;
            }
            const target_titles = target_ids.map(target_id=>{
                if(target_map.has(target_id)){
                    return target_map.get(target_id);
                }else{
                    return `${target_id}に対応する項目がない`;
                }
            });
            return `${item.title}\n検索対象:${target_titles.join(", ")}`;
        };

        /**
         * 
         * @param {LibrarySearchItem} item 
         * @returns {string|null}
         */
        this.geticon = (item) => {
            const target_ids = item.target_ids;
            if(target_ids){
                return "fas fa-filter";
            }
            return null;
        };

        this.obs_listview.on("changed", async (args) => {
            /** @type {{items:LibrarySearchItem[]}} */
            const { items } = args;
            await window.electronAPI.invoke('library:updateSearchItems', items);
        });

        main_obs.on("library:sidebar:add-search-item", (args) => {
            const { item } = args;
            this.obs_listview.trigger("addList", { items:[item] });
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            main_obs.trigger("library:search-item-dlbclicked", item);
        });
    },
    async onMounted() {
        const items = await window.electronAPI.invoke('library:getSearchItems');
        this.obs_listview.trigger("loadData", { items });
    }
};