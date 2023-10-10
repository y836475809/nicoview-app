const myapi = require("../../lib/my-api");
const { window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */ 
const player_obs = window_obs;

module.exports = {
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
            myapi.ipc.Search.searchTag({
                query: tag,
                search_target:"tag"
            });
        };

        player_obs.on("player-tag:set-tags", (
            /** @type {VideoTag[]} */ video_tags) => {
            this.state.video_tags = video_tags;
            this.update();
        });
    }
};
