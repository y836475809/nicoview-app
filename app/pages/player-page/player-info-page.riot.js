const  myapi = require("../../js/my-api");
const { mountNicoGrid } = require("../../pages/common/nico-grid-mount");
const { MyObservable } = require("../../js/my-observable");
const time_format = require("../../js/time-format");
const { SyncCommentScroll } = require("../../js/sync-comment-scroll");
const { window_obs } = require("../../js/my-observable");
const { logger } = require("../../js/logger");

/** @type {MyObservable} */
const player_obs = window_obs;

const nico_grid_name = "nico_grid_player_comment";

module.exports = {
    state:{
        video_thumbnail_tooltip:"",
        video_thumbnail_url:"",
        comment_state:""
    },
    is_economy:false,
    is_deleted:false,
    is_online:false,
    is_saved:false,
    title:"",
    first_retrieve:"",
    view_counter:0,
    comment_counter:0,
    mylist_counter:0,
    /** @type {SyncCommentScroll} */
    sync_comment_scroll:null,
    sync_comment_checked:true,
    onBeforeMount() {
        this.sync_comment_scroll = new SyncCommentScroll();
        
        player_obs.on("player-info-page:update-comments", async (args)=> {
            /** @type {CommentItem[]} */
            const comments = args;
            await this.setComments(comments);
        });

        player_obs.on("player-info-page:set-data", async (args)=> {
            /** @type {{
             * thumb_info:ThumbInfo, comments:CommentItem[], 
             * all_comment_num:number, video_option:VideoOption}} */
            const { thumb_info, comments, all_comment_num, video_option } = args;

            this.is_economy = thumb_info.is_economy;
            this.is_deleted = thumb_info.is_deleted;

            if(video_option){
                this.is_online = video_option.is_online;
                this.is_saved = video_option.is_saved;
            }
            
            if(this.is_economy===undefined){
                this.is_economy = false;
            }
            if(this.is_deleted===undefined){
                this.is_deleted = false;
            }
            if(this.is_online===undefined){
                this.is_online = false;
            }
            if(this.is_saved===undefined){
                this.is_saved = false;
            }

            const video = thumb_info.video;
            const thread = thumb_info.thread;
            const owner = thumb_info.owner;
            const description = video.description;

            this.video_id = video.video_id;
            this.title = video.title;
            this.state.video_thumbnail_url = video.thumbnailURL;
            this.first_retrieve = time_format.toDateString(video.postedDateTime);
            this.view_counter = video.viewCount;
            this.comment_counter = thread.commentCount;
            this.mylist_counter = video.mylistCount;

            this.state.video_thumbnail_tooltip = 
                `投稿日: ${this.first_retrieve}\n`
                + `再生: ${this.view_counter.toLocaleString()}\n`
                + `コメント: ${this.comment_counter.toLocaleString()}\n`
                + `マイリスト: ${this.mylist_counter.toLocaleString()}\n`
                + `状態: ${this.videoStateOnline()} ${this.videoStateLocal()}\n`
                + `画質: ${this.videoStateEconomy()}`; 
            const state_deleted = this.videoStateDeleted();
            if(state_deleted){
                this.state.video_thumbnail_tooltip += `\n${state_deleted}`;
            }

            this.state.comment_state = 
                `${comments.length.toLocaleString()}/${all_comment_num.toLocaleString()}`;
            
            const user_id = owner.id;
            const user_nickname = owner.nickname;
            const user_icon_url = owner.iconURL;
            const is_saved = this.is_saved;
            
            player_obs.trigger("player-user:set-data", {
                user_id,
                user_nickname,
                user_icon_url, 
                description,
                is_saved
            });

            await this.setComments(comments);
            
            this.update();
        });

        player_obs.on("player-info-page:seek-update", (current_sec)=> {
            if(!this.sync_comment_checked){
                return;
            }

            const comment_index =  this.sync_comment_scroll.getCommentIndex(current_sec);
            this.nico_grid_obs.trigger("scroll-to-index", {
                index: comment_index,
                position:"bottom"
            });
        });

        player_obs.on("player-info-page:reset-comment-scroll", ()=> {
            if(this.sync_comment_scroll){
                this.sync_comment_scroll.reset();
            }
        });
    },
    async onMounted() {
        // eslint-disable-next-line no-unused-vars
        const timeFormatter = (id, value, data)=> {
            return time_format.toTimeString(value * 10 / 1000);
        };
        // eslint-disable-next-line no-unused-vars
        const dateFormatter = (id, value, data)=> {
            //sec->ms
            return time_format.toDateString(value * 1000);
        };
        const columns = [
            {id: "vpos", name: "時間", sortable:false, ft: timeFormatter},
            {id: "content", name: "コメント", sortable:false},
            {id: "user_id", name: "ユーザーID", sortable:false},
            {id: "date", name: "投稿日", sortable:false, ft: dateFormatter},
            {id: "no", name: "番号", sortable:false},
            {id: "mail", name: "オプション", sortable:false}
        ];
        const options = {
            header_height: 25,
            row_height: 25,
            filter_target_ids: [
                "content", "user_id"
            ],
            img_cache_capacity:5,
            view_margin_num: 10
        };
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid("#player-comment-nico-grid", state, this.nico_grid_obs, columns, options);
        
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("db-cliecked", (args) => {
            const { data } = args;
            const sec = data.vpos * 10 / 1000;
            player_obs.trigger("player-video:seek", sec);
        });
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const menu_id = await myapi.ipc.popupContextMenu("player-ngcomment");
            if(!menu_id){
                return;
            }
            if(menu_id=="add-comment-ng=list"){
                /** @type {CommentItem[]} */
                const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
                const texts = items.map(item=>{
                    return item.content;
                });
                this.triggerAddNGComment({ ng_texts: texts, ng_user_ids: [] });
            }
            if(menu_id=="add-uerid-ng=list"){
                /** @type {CommentItem[]} */
                const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
                const user_ids = items.map(item=>{
                    return item.user_id;
                });
                this.triggerAddNGComment({ ng_texts: [], ng_user_ids: user_ids });
            }
        });

        /** @type {HTMLInputElement} */
        const ch_elm = this.$(".comment-checkbox.comment-visible");
        ch_elm.checked = true; 
    },
    enableDonwload() {
        return this.is_deleted === false && this.is_saved === false;
    },
    enableUpdateData() {
        return this.is_deleted === false && this.is_saved === true;
    },
    videoStateOnline() {
        if(this.is_online === true){
            return "オンライン再生";
        }else{
            return "ローカル再生";
        }
    },
    videoStateLocal() {
        if(this.is_saved === true){
            return "保存済み";
        }else{
            return "";
        }
    },
    videoStateEconomy() {
        return this.is_economy ? "エコノミー" : "高画質";
    },
    videoStateDeleted() {
        if(this.is_deleted === true){
            return "削除されています";
        }else{
            return "";
        }
    },
    /**
     * 
     * @param {Event} e 
     */
    onclickCommentVisibleCheck(e) {
        /** @type {HTMLInputElement} */
        const elm = e.target;
        const comment_visible = elm.checked;
        player_obs.trigger("player-video:change-comment-visible", comment_visible);
    },
    onclickUpdateThumbInfo(e) { // eslint-disable-line no-unused-vars
        player_obs.trigger("player-main-page:update-data", this.video_id, "thumbinfo");
    },
    onclickUpdateComment(e) { // eslint-disable-line no-unused-vars
        logger.debug("player video info update video_id=", this.video_id);
        player_obs.trigger("player-main-page:update-data", this.video_id, "comment");
    },
    onclickShowSettingDialog(e) { // eslint-disable-line no-unused-vars
        player_obs.trigger("player-main-page:show-player-setting-dialog");
    },
    /**
     * 
     * @param {CommentItem[]} comments 
     */
    async setComments(comments) {
        this.sync_comment_scroll.setComments(comments);

        const comment_items = comments.map((value, index) => {
            return Object.assign(value, { id: index });
        });
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "id",
            items:comment_items
        });
    },
    /**
     * 
     * @param {{ng_texts:string[], ng_user_ids:string[]}} args 
     */
    triggerAddNGComment(args) {
        player_obs.trigger("player-main-page:add-ng-comment", args);
    }
};
