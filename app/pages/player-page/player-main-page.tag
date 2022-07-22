<player-main-page onmousemove={mousemove} onmouseup={mouseup}>
    <style>
        :host {
            display: flex;
            height: 100%;
            --right-width: 300px;
            overflow: hidden;
        }
    
        .gutter {
            cursor: col-resize;
            width: 4px;
            border-left: 1px solid var(--control-border-color);
        }
    
        .split.left{
            margin: 0;
            width: calc(100% - var(--right-width));
        }

        .split.right{
            margin: 0;
            width: var(--right-width);
            height: 100%;
        }
    </style>

    <div class="player-frame split left">
        <player-page></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div class="info-frame split right">
        <player-info-page></player-info-page>
    </div>

    <player-setting-dialog></player-setting-dialog>

    <script>
        /* globals riot logger */
        const myapi = window.myapi;
        const { NicoPlay } = window.NicoPlay;
        const { NicoUpdate } = window.NicoUpdate;
        const { CommentFilter } = window.CommentFilter;
        const { toTimeSec } = window.TimeFormat;
        const { NicoVideoData } = window.NicoVideoData;
        const { ModalDialog } = window.ModalDialog;
        const { MyObservable } = window.MyObservable;
        const player_obs = riot.obs;

        const play_msg_map = new Map([
            ["startWatch", "watch取得開始"],
            ["finishWatch", "watch取得完了"],
            ["startComment", "コメント取得開始"],
            ["finishComment", "コメント取得完了"],
            ["startPlayVideo", "再生開始"],
            ["startHeartBeat", "HeartBeat開始"],
        ]);

        export default {
            obs_modal_dialog:null,
            modal_dialog:null,
            comment_filter:null,
            nico_play:null,
            play_data:null,
            gutter:false,
            gutter_move:false,
            stop_resize_event:false,
            resize_begin:false,
            timer:null,
            onBeforeMount() {
                this.obs_modal_dialog = new MyObservable();

                myapi.ipc.onPlayVideo(async (args)=>{
                    const { video_id, online, time, video_item } = args;

                    this.play_data = { 
                        video_id: video_id, 
                        title: null,
                        thumbnailURL: null,
                        online: online
                    };

                    document.title = video_id;

                    if(!video_item || online){
                        const is_saved = video_item !== null;
                        await this.playVideoOnline(video_id, time, is_saved);
                    }else{
                        await this.playVideoItem(video_item, time);
                    }
                });

                myapi.ipc.Setting.onChangeLogLevel((args) => {
                    const { level } = args;
                    logger.setLevel(level);
                });

                player_obs.onReturn("player-main-page:get-play-data-callback", () => {
                    return this.play_data;
                });

                player_obs.on("player-main-page:update-data", async(video_id, update_target) => {
                    if(this.modal_dialog.isOpend()){
                        return;
                    }

                    logger.debug("player main update video_id=", video_id);
                    const nico_update = new NicoUpdate();

                    this.obs_modal_dialog.trigger("show", {
                        message: "更新中...",
                        buttons: ["cancel"],
                        cb: ()=>{
                            if(nico_update){
                                nico_update.cancel();
                            }
                        }
                    });

                    try {   
                        const video_item = await myapi.ipc.Library.getItem(video_id);
                        nico_update.setVideoItem(video_item);

                        let result = null;
                        if(update_target=="thumbinfo"){
                            result = await nico_update.updateThumbInfo();
                        }else if(update_target=="comment"){
                            result = await nico_update.updateComment();
                        }else{
                            throw new Error(`${update_target} is unknown`);
                        }
                        if(result){
                            await myapi.ipc.Library.updateItemProps(result.video_id, result.props);
                            const updated_video_item = await myapi.ipc.Library.getItem(result.video_id);
                            const video_data = new NicoVideoData(updated_video_item);
                            const viewinfo = {
                                is_economy: video_data.getIsEconomy(),
                                is_deleted: video_data.getIsDeleted(),
                                thumb_info: video_data.getThumbInfo()
                            };

                            const comments = video_data.getComments();
                            this.comment_filter.setComments(comments);
                            this.comment_filter.setPlayTime(updated_video_item.play_time);
                            const filtered_comments = this.comment_filter.getCommnets();

                            player_obs.trigger("player-tag:set-tags", viewinfo.thumb_info.tags);
                            player_obs.trigger("player-info-page:set-viewinfo-data", {
                                viewinfo: viewinfo, 
                                comments: filtered_comments,
                                all_comment_num: comments.length,
                            });
                            player_obs.trigger("player-video:update-comments", filtered_comments);
                        }   
                    } catch (error) {
                        if(!error.cancel){
                            logger.error(error);
                            await myapi.ipc.Dialog.showMessageBox({
                                type: "error",
                                message: error.message
                            });
                        }       
                    }
                    this.obs_modal_dialog.trigger("close");
                });

                player_obs.on("player-main-page:add-ng-comment", async (args) => {
                    const { ng_texts, ng_user_ids } = args;

                    this.comment_filter.ng_comment.addNGTexts(ng_texts);
                    this.comment_filter.ng_comment.addNGUserIDs(ng_user_ids);
                    try {
                        await myapi.ipc.NGList.updateItems(this.comment_filter.getNGComments());
                    } catch (error) {
                        logger.error("player main save ng comment", error);
                        await myapi.ipc.Dialog.showMessageBox({
                            type: "error",
                            message: `NGコメントの保存に失敗\n${error.message}`
                        });
                    }

                    const comments = this.comment_filter.getCommnets();
                    player_obs.trigger("player-video:update-comments", comments);
                    player_obs.trigger("player-info-page:update-comments", comments);
                });

                player_obs.on("player-main-page:delete-ng-comment", async (args) => {
                    const { ng_texts, ng_user_ids } = args;

                    this.comment_filter.ng_comment.deleteNGTexts(ng_texts);
                    this.comment_filter.ng_comment.deleteNGUserIDs(ng_user_ids);
                    try {
                        await myapi.ipc.NGList.updateItems(this.comment_filter.getNGComments());
                    } catch (error) {
                        logger.error("player main save comment ng", error);
                        await myapi.ipc.Dialog.showMessageBox({
                            type: "error",
                            message: `NGコメントの保存に失敗\n${error.message}`
                        });
                    }

                    const comments = this.comment_filter.getCommnets();
                    player_obs.trigger("player-video:update-comments", comments);
                    player_obs.trigger("player-info-page:update-comments", comments);
                });

                player_obs.on("player-main-page:update-comment-display-limit", (args) => {
                    const { do_limit } = args;

                    this.comment_filter.setLimit(do_limit);
                    const comments = this.comment_filter.getCommnets();
                    player_obs.trigger("player-video:update-comments", comments);
                    player_obs.trigger("player-info-page:update-comments", comments);
                });

                player_obs.on("player-main-page:show-player-setting-dialog", () => {
                    player_obs.trigger("player-setting-dialog:show", {
                        ng_items : this.comment_filter.ng_comment.getNGItems(),
                    });
                });

                player_obs.on("player-main-page:toggle-infoview", async () => {
                    await this.toggleInfoview();
                });

                const timeout = 200;
                window.addEventListener("resize", () => {
                    if(this.stop_resize_event){
                        return;
                    }

                    if(this.resize_begin===false){
                        this.resize_begin = true;
                        player_obs.trigger("player-video:resize-begin");
                    }

                    clearTimeout(this.timer);
                    this.timer = setTimeout(() => {
                        this.resize_begin = false;
                        player_obs.trigger("window-resized");    
                    }, timeout);
                });
            },
            async onMounted() {
                const params = await myapi.ipc.Config.get("player", {  
                    infoview_width: 200, 
                    infoview_show: true 
                });
                    
                const vw = params.infoview_show ? params.infoview_width : 0;
                const pe = this.$(".player-frame");
                const ve = this.$(".info-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px"; 

                this.player_default_size = { width: 854 ,height: 480 };
                
                try {
                    const do_limit = await myapi.ipc.Config.get("comment.do_limit", true);
                    const { ng_texts, ng_user_ids } = await myapi.ipc.NGList.getItems();
                    this.comment_filter = new CommentFilter();
                    this.comment_filter.setLimit(do_limit);
                    this.comment_filter.setNGComments(ng_texts, ng_user_ids);
                } catch (error) {
                    logger.error("player main load ng comment", error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: `NGコメントリストの読み込み失敗\n${error.message}`
                    });
                }

                this.modal_dialog = new ModalDialog(this.root, "player-md", {
                    obs:this.obs_modal_dialog
                });

                myapi.ipc.playerReady();
            },
            mousemove(e) {
                if(this.gutter){   
                    this.gutter_move = true;  
                    let pe = this.$(".player-frame");
                    let ve = this.$(".info-frame");
                    const mw = this.root.offsetWidth - e.clientX;
                    ve.style.width = mw + "px";
                    pe.style.width = `calc(100% - ${mw}px)`;
                }
            },
            mousedown(e) {
                if(e.which===1){
                    this.gutter = true;     
                }
            },
            async mouseup(e) { // eslint-disable-line no-unused-vars
                if(this.gutter_move){
                    player_obs.trigger("player-video:reset-comment-timelime");
                    player_obs.trigger("player-info-page:split-resized");

                    const ve = this.$(".info-frame");
                    await myapi.ipc.Config.set("player.infoview_width", parseInt(ve.offsetWidth));
                }
                this.gutter = false;
                this.gutter_move = false;
            },
            async play_by_video_data(video_data, viewinfo, comments, state) { 
                if(!/mp4/.test(video_data.type)){
                    throw new Error(`${video_data.type}形式は再生できません`);
                }

                const thumb_info = viewinfo.thumb_info;
                const video = thumb_info.video;
                const play_time_sec = toTimeSec(video.duration);

                this.play_data = {
                    video_id: video.video_id, 
                    title: video.title,
                    thumbnailURL: video.thumbnailURL,
                    online: state.is_online
                };

                this.comment_filter.setComments(comments);
                this.comment_filter.setPlayTime(play_time_sec);
                const filtered_comments = this.comment_filter.getCommnets();          

                const title = `${video.title}[${video.video_id}][${video.video_type}]`;
                document.title = title;
                player_obs.trigger("player-controls:set-state", "play"); 
                player_obs.trigger("player-video:set-play-data", { 
                    video_data: video_data,
                    comments: filtered_comments,
                    state: state
                });
                player_obs.trigger("player-tag:set-tags", thumb_info.tags);
                player_obs.trigger("player-info-page:set-viewinfo-data", { 
                    viewinfo: viewinfo, 
                    comments: filtered_comments,
                    all_comment_num: comments.length,
                    state: state
                });   
                
                myapi.ipc.PlayHistory.addItem({
                    id: video.video_id, 
                    image: video.thumbnailURL, 
                    title: video.title,  
                });
            },
            cancelPlay() {
                if(this.nico_play){
                    this.nico_play.cancel();
                }
            },
            async playVideoItem(video_item, time=0) {
                this.cancelPlay();

                const state = { 
                    is_online: false,
                    is_saved: true,
                    time: time
                };
                try {
                    const video_data = new NicoVideoData(video_item);
                    const video = {
                        src: video_data.getVideoPath(),
                        type: `video/${video_data.getVideoType()}`,
                    };
                    const viewinfo = {
                        is_economy: video_data.getIsEconomy(),
                        is_deleted: video_data.getIsDeleted(),
                        thumb_info: video_data.getThumbInfo()      
                    };      
                    const comments = video_data.getComments();
                    await this.play_by_video_data(video, viewinfo, comments, state);
                } catch (error) {
                    logger.error(`id=${video_item.id}, online=${state.is_online}, is_saved=${state.is_saved}`, error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            },
            async playVideoOnline(video_id, time, is_saved) {
                if(this.modal_dialog.isOpend()){
                    return;
                }
                
                this.cancelPlay();

                const state = { 
                    is_online: true,
                    is_saved: is_saved,
                    time: time
                };

                try {
                    this.nico_play = new NicoPlay();

                    this.obs_modal_dialog.trigger("show", {
                        message: "...",
                        buttons: ["cancel"],
                        cb: ()=>{
                            this.cancelPlay();
                        }
                    });

                    this.nico_play.on("changeState", (state)=>{
                        logger.debug("player main changeState state=", state);
                        const msg = play_msg_map.get(state);
                        this.obs_modal_dialog.trigger("update-message", msg);
                    });
                    this.nico_play.on("cancelHeartBeat", ()=>{
                        logger.debug("player main HeartBeat cancel");
                    });
                    this.nico_play.on("errorHeartBeat", (error)=>{
                        throw error;
                    });

                    const {is_economy, is_deleted, comments, thumb_info, video_url} = 
                        await this.nico_play.play(video_id);
                        
                    const video_data = {
                        src: video_url,
                        type: `video/${thumb_info.video.video_type}`,
                    };
                    const viewinfo = {
                        is_economy: is_economy,
                        is_deleted: is_deleted,
                        thumb_info:thumb_info,
                    };
                    comments.sort((a, b) => {
                        if (a.vpos < b.vpos) return -1;
                        if (a.vpos > b.vpos) return 1;
                        return 0;
                    });
                    await this.play_by_video_data(video_data, viewinfo, comments, state);      
                } catch (error) {
                    if(!error.cancel){
                        logger.error(`id=${video_id}, online=${state.is_online}, is_saved=${state.is_saved}`, error);
                        await myapi.ipc.Dialog.showMessageBox({
                            type: "error",
                            message: error.message
                        });
                    }
                }

                this.obs_modal_dialog.trigger("close");
            },
            async toggleInfoview() {
                const pe = this.$(".player-frame");
                const ve = this.$(".info-frame");

                const infoview_show = parseInt(ve.style.width) == 0;
                await myapi.ipc.Config.set("player.infoview_show", infoview_show);

                // 動画情報の表示/非表示の切り替え時はウィンドウリサイズイベントを通知しない
                // (動画表示部分のサイズは変更されないのでリサイズイベント不要)
                this.stop_resize_event = true;

                if(infoview_show){
                    // 表示
                    const infoview_width = await myapi.ipc.Config.get("player.infoview_width", 200);
                    // 動画サイズがウィンドウサイズに合わせて変化しないように
                    // 動画の幅を固定してからウィンドウサイズ変更
                    pe.style.width = pe.offsetWidth + "px";  
                    window.resizeBy(infoview_width, 0);

                    setTimeout(() => {
                        // 動画サイズを可変に戻す
                        ve.style.width = infoview_width + "px";
                        pe.style.width = `calc(100% - ${infoview_width}px)`;

                        // 非表示->表示の場合はコメントリストをリサイズする
                        player_obs.trigger("player-info-page:split-resized");
                        this.stop_resize_event = false;
                    },100); 
                }else{
                    // 非表示
                    const infoview_width = 0;
                    pe.style.width = pe.clientWidth + "px";   
                    window.resizeBy(-parseInt(ve.style.width), 0);

                    ve.style.width = infoview_width + "px";
                    setTimeout(() => {    
                        pe.style.width = `calc(100% - ${infoview_width}px)`;
                        this.stop_resize_event = false;
                    },100); 
                }
            }
        };
    </script>
</player-main-page>