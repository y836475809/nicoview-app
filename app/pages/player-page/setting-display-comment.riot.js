const  myapi = require("../../js/my-api");
const { window_obs } = require("../../js/my-observable");

/** @type {MyObservable} */
const player_obs = window_obs;

/** @type {CommentConfig} */
const default_comment_config = {
    duration_sec: 4,
    fps: 10,
    do_limit: true,
    auto_sync_checked: true,
    auto_sync_interval: 30,
    auto_sync_threshold: 0.1
};

module.exports = {
    duration_items:[3, 4, 5],
    fps_items:[10, 60],
    sync_interval_items:[10, 30, 60, 120],
    sync_threshold_items:[0.05, 0.1],
    /**
     * 
     * @param {string} name 
     * @param {number[]} items 
     * @param {number} value 
     */
    setup(name, items, value){
        const index = items.findIndex(item => item === value);
        /** @type {HTMLInputElement[]} */
        const elms = this.$$(`input[name='${name}']`);
        elms[index].checked = true;
    },
    onBeforeMount() {
        player_obs.onReturn("setting-display-comment:get-default-commnet-config", ()=>{
            return default_comment_config;
        });
    },
    async onMounted() {
        /** @type {CommentConfig} */
        const comment_config = await myapi.ipc.Config.get("comment", default_comment_config);
        
        this.setup("duration", this.duration_items, comment_config.duration_sec);
        this.setup("fps", this.fps_items, comment_config.fps);

        /** @type {HTMLInputElement} */
        const ch_elm = this.$(".comment-do-limit-checkbox");
        ch_elm.checked = comment_config.do_limit;

        /** @type {HTMLInputElement} */
        const auto_sync_ch_elm = this.$(".auto-sync-checkbox");
        auto_sync_ch_elm.checked = comment_config.auto_sync_checked;
        this.setup("sync_interval", this.sync_interval_items, comment_config.auto_sync_interval);
        this.setup("sync_threshold", this.sync_threshold_items, comment_config.auto_sync_threshold);
    },
    /**
     * 
     * @param {string} name 
     * @param {any} value 
     * @param {boolean} is_trigger 
     */
    async changeConfig(name, value, is_trigger=true){
        const comment_config = await myapi.ipc.Config.get("comment", default_comment_config);
        comment_config[name] = value;
        await myapi.ipc.Config.set(`comment.${name}`, value);
        if(is_trigger){
            player_obs.trigger("player-video:update-comment-display-params", comment_config);
        }
    },
    /**
     * 
     * @param {string} item 
     * @param {Event} e 
     */
    async onchangeDuration(item, e) { // eslint-disable-line no-unused-vars
        await this.changeConfig("duration_sec", parseInt(item));
    },
    /**
     * 
     * @param {string} item 
     * @param {Event} e 
     */
    async onchangeFPS(item, e) { // eslint-disable-line no-unused-vars
        await this.changeConfig("fps", parseInt(item));
    },
    /**
     * 
     * @param {Event} e 
     */
    async onclickLimitCommentCheck(e) {
        /** @type {HTMLInputElement} */
        const elm = e.target;
        const do_limit = elm.checked;
        await myapi.ipc.Config.set("comment.do_limit", do_limit);
        player_obs.trigger("player-main-page:update-comment-display-limit", {do_limit});
    },
    async onclickAutoSyncCheck(e) {
        /** @type {HTMLInputElement} */
        const elm = e.target;
        const checked = elm.checked;
        await this.changeConfig("auto_sync_checked", checked, false);
    },
    /**
     * 
     * @param {number} item 
     * @param {Event} e 
     */
    async onchangeAutoSyncInterval(item, e) { // eslint-disable-line no-unused-vars
        const interval = item;
        await this.changeConfig("auto_sync_interval", interval, false);
    },
    /**
     * 
     * @param {number} item 
     * @param {Event} e 
     */
    async onchangeAutoSyncThreshold(item, e) { // eslint-disable-line no-unused-vars
        const threshold = item;
        await this.changeConfig("auto_sync_threshold", threshold, false);
    }
};