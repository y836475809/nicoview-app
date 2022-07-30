/* globals riot */
const  myapi = require("../../js/my-api");
const { MyObservable } = require("../../js/my-observable");

/** @type {MyObservable} */
const player_obs = riot.obs;

module.exports = {
    /** @type {MyObservable} */
    obs_open_video_form:null,
    contextmenu_show:false,
    onBeforeMount() {
        this.obs_open_video_form = new MyObservable();
    },
    /**
     * 
     * @returns {NicoPlayData}
     */
    async getPlayData() {
        return await player_obs.triggerReturn("player-main-page:get-play-data-callback");
    },
    /**
     * 
     * @returns {number}
     */
    async getCurrentPlayTime() {
        return await player_obs.triggerReturn("player-video:get-current-time-callback");
    },
    /**
     * 
     * @param {{height:number, width:number}} org_size 
     */
    resizeVideo(org_size) {
        const elm = this.$(".video-container");
        const dw = org_size.width - elm.offsetWidth;
        const dh = org_size.height - elm.offsetHeight;
        window.resizeBy(dw, dh);
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    async oncontextmenu(e) {
        // コンテキストメニュー表示後の画面クリックでは再生/停止しない
        if(e.button===0 && !this.contextmenu_show){   
            player_obs.trigger("player-controls:play");
        }

        if(e.button === 1){
            this.contextmenu_show = true;

            await myapi.ipc.popupContextMenu("player-history-stack");
            
            this.contextmenu_show = false;
        }

        if(e.button===2){
            this.contextmenu_show = true;

            const play_data = await this.getPlayData(); 
            const menu_id = await myapi.ipc.popupContextMenu("player", { play_data });
            if(menu_id){
                const { video_id, title, thumbnailURL, online } = play_data; // eslint-disable-line no-unused-vars
                if(menu_id=="add-bookmark-time"){
                    const current_time = await this.getCurrentPlayTime();
                    const bk_item = {
                        title: title,
                        id: video_id,
                        time: current_time
                    };
                    myapi.ipc.Bookmark.addItems([bk_item]);
                }
                if(menu_id=="add-stack-time"){
                    const time = await this.getCurrentPlayTime();
                    myapi.ipc.Stack.addItems([
                        {
                            id: video_id,
                            title: title, 
                            thumb_img:thumbnailURL,
                            time: time
                        }
                    ]);
                }
                if(menu_id=="show-open-video-form"){
                    this.obs_open_video_form.trigger("show");
                }
                if(menu_id=="change-movie-size"){
                    /** @type {{height:number, width:number}} */
                    const org_size = await player_obs.triggerReturn("player-video:get-video-size-callback");
                    this.resizeVideo(org_size);
                }
            }

            this.contextmenu_show = false;
        }
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    onkeyupTogglePlay(e) {
        if (e.code.toLowerCase()=="space") {
            player_obs.trigger("player-controls:play");
        }
    }
};