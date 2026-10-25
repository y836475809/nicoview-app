import { window_obs } from "@lib/my-observable.js";

/** @type {MyObservable} */ 
const player_obs = window_obs;

export default {
    state:{
        /** @type {VideoTag[]} */
        video_tags:[]
    },
    onBeforeMount() {  
        /**
         * 
         * @param {VideoTag} item 
         * @param {Event} e 
         */          
        this.onclickTag = (item, e) => { // eslint-disable-line no-unused-vars
            const tag = item.name;
            // myapi.ipc.Search.searchTag({
            //     query: tag,
            //     search_target:"tag"
            // });
        };

        /**
         * 
         * @param {VideoTag} item 
         * @param {Event} e 
         */     
        this.oncontextmenu = async (item, e) => { // eslint-disable-line no-unused-vars
            if(e.button !== 2){
                return;
            }

            const tag = item.name;
            // const menu_id = await myapi.ipc.popupContextMenu("player-tag", { tag });
            // if(menu_id == "search-library"){
            //     myapi.ipc.Library.search({
            //         query: tag
            //     });
            // }
        },

        player_obs.on("player-tag:set-tags", (
            /** @type {VideoTag[]} */ video_tags) => {
            this.state.video_tags = video_tags;
            this.update();
        });
    }
};
