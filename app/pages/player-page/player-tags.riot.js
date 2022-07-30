const myapi = require("../../js/my-api");
const { window_obs } = require("../../js/my-observable");

/** @type {MyObservable} */ 
const player_obs = window_obs;

module.exports = {
    state:{
        /** @type {TagInfo[]} */
        video_tags:[]
    },
    onBeforeMount() {  
        /**
         * 
         * @param {TagInfo} item 
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
            /** @type {TagInfo[]} */ video_tags) => {
            this.state.video_tags = video_tags;
            this.update();
        });
    }
};
