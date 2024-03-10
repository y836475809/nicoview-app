const { ipcRenderer } = require("electron");
const Hls = require("hls.js");
const myapi = require("../../lib/my-api");
const { NicoCommentTimeLine, NicoScript } = require("../../lib/nico-comment-timeline");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { ModalDialog } = require("../../lib/modal-dialog");
const { logger } = require("../../lib/logger");
const NicoHls = require("../../lib/nico-hls-request.js");

/** @type {MyObservable} */
const player_obs = window_obs;

module.exports = {
    _hls: null,
    _hls_tmp_dir:"",
    /** @type {MyObservable} */
    obs_modal_dialog:null,
    /** @type {ModalDialog} */
    modal_dialog:null,

    /** @type {HTMLVideoElement} */
    video_elm:null,

    /** @type {PlayData} */
    play_data:null,

    /** @type {NicoCommentTimeLine} */
    comment_tl:null,

    /** @type {CommentConfig}  */
    comment_config:null,
    comment_sync_id:null,
    play_ended:false,
    async onBeforeMount() {
        this.obs_modal_dialog = new MyObservable();
        this._hls_tmp_dir = await ipcRenderer.invoke("get-temp-path");
        
        player_obs.on("player-video:set-play-data-library", async(data) => {
            if(this.modal_dialog.isOpend()){
                return;
            }
            this.obs_modal_dialog.trigger("show", {
                message: "動画取得中...",
                buttons: undefined
            });

            await this.initVideo();
            // this.video_elm.pause();
            if(this._hls){
                this._hls.stopLoad();
                this._hls.detachMedia();
                this._hls.destroy();
                this._hls = null;
            }
            this.play_data = data;
            const {src, type} = this.play_data.video_elem_prop;
            this.video_elm.src = src;
            this.video_elm.type = type;
            this.createTimeLine(this.play_data.comments);
            this.video_elm.load();
        });
        player_obs.on("player-video:set-play-data-online", async(data) => {
            if(this.modal_dialog.isOpend()){
                return;
            }
            this.obs_modal_dialog.trigger("show", {
                message: "動画取得中...",
                buttons: undefined
            });

            await this.initVideo();
            // this.video_elm.pause();

            if(this._hls){
                this._hls.stopLoad();
                this._hls.detachMedia();
                this._hls.destroy();
                this._hls = null;
            }

            this.play_data = data;
            this.createTimeLine(this.play_data.comments);

            const nico_api = this.play_data.nico_api;
            const domand = nico_api.domand;
            const watchTrackId = nico_api.watchTrackId;
            const video_id = this.play_data.video_id;
            const nico_hls = new NicoHls.NicoHls(this._hls_tmp_dir);
            const hls_data = await nico_hls.getHlsData(video_id, domand, watchTrackId, 
                (msg) => {
                    this.obs_modal_dialog.trigger("update-message", msg);
                });
            const content_url = hls_data.content_url;
            const config = {
                debug: false,
                autoStartLoad: true,
                loader: NicoHls.CustomLoader,
                my_loader_data: {
                    cookie: hls_data.cookie,
                    manifest_m3u8_text: hls_data.manifest_m3u8_map.get("rep_text"),
                    video_m3u8_map: hls_data.video_m3u8_map,
                    audio_m3u8_map: hls_data.audio_m3u8_map,
                    key_data_map: hls_data.key_data_map,
                    dummy_url: hls_data.dummy_url
                }
            };
            this._hls = new Hls(config);
            this._hls.attachMedia(this.video_elm);
            this._hls.loadSource(content_url);
        });

        player_obs.onReturn("player-video:get-current-time-callback", () => { 
            return this.video_elm.currentTime;
        });

        player_obs.onReturn("player-video:get-video-size-callback", () => { 
            return {
                width: this.video_elm.videoWidth,
                height: this.video_elm.videoHeight
            };
        });
    },
    async onMounted() {
        this.modal_dialog = new ModalDialog(this.root, "player-video-md", {
            obs:this.obs_modal_dialog
        });
    },
    async initVideo() {
        if(this.video_elm){
            return;
        }

        const default_comment_config = await player_obs.triggerReturn("setting-display-comment:get-default-commnet-config");
        this.comment_config = await myapi.ipc.Config.get("comment", default_comment_config);
        
        this.video_elm = this.$(".video-screen > video");
        this.video_elm.volume = await myapi.ipc.Config.get("player.volume", 0.5);

        this.video_elm.addEventListener("loadedmetadata", (event) => { // eslint-disable-line no-unused-vars
            player_obs.trigger("player-seek:reload", this.video_elm.duration);
        });

        this.video_elm.addEventListener("loadeddata", (event) => {
            logger.debug("loadeddata event=", event);
            player_obs.trigger("player-controls:loaded-data");

            const { time } = this.play_data.video_option;
            if(time>0){
                this.video_elm.currentTime = time;
            }
        });
        this.video_elm.addEventListener("play", () => {
            logger.debug("playによるイベント発火");
            this.play_ended = false;
            this.playVideoAndComment();
        });
        this.video_elm.addEventListener("pause", () => {
            logger.debug("pauseによるイベント発火");
            if(this.video_elm.currentTime == this.video_elm.duration){
                // currentTime==durationは動画の最後ということ
                // この場合コメントは流したままにする
                return;
            }

            if(this.comment_tl){
                this.comment_tl.pause();
            }
        });

        this.video_elm.addEventListener("timeupdate", () => {
            const current = this.video_elm.currentTime;
            player_obs.trigger("player-seek:seek-update", current);
            player_obs.trigger("player-info:seek-update", current);
        });
        this.video_elm.addEventListener("progress", () => {
            logger.debug("progressによるイベント発火");

            if (this.video_elm.duration <= 0) {
                return;
            }
            for (let i = 0; i < this.video_elm.buffered.length; i++) {
                const index = this.video_elm.buffered.length - 1 - i;
                if (this.video_elm.buffered.start(index) < this.video_elm.currentTime) {
                    const time_sec = this.video_elm.buffered.end(index);
                    player_obs.trigger("player-seek:buffered-update", time_sec);
                    break;
                }
            }
            
        }); 
        this.video_elm.addEventListener("waiting", () => {
            logger.debug("waitingによるイベント発火");
            this.comment_tl.pause();
        }); 
        this.video_elm.addEventListener("canplay", () => {
            logger.debug("canplayによるイベント発火");
        }); 
        this.video_elm.addEventListener("playing", async () => {
            logger.debug("playingによるイベント発火");
            this.play_ended = false;
            this.playVideoAndComment();
            if(this.modal_dialog.isOpend()){
                this.obs_modal_dialog.trigger("close");
            }
        });

        this.video_elm.addEventListener("ended", () => {
            logger.debug("endedによるイベント発火");
            this.play_ended = true;
            if(this.comment_tl.enable === false || this.comment_tl.ended === true || this.comment_tl.hasComment === false){
                // コメント非表示またはコメントが完了している場合は動画終了でpauseにする
                player_obs.trigger("player-controls:set-state", "pause"); 
            }
        });
        
        player_obs.on("player-video:play", () => {
            logger.debug("player play");
            if(this.video_elm.currentTime == this.video_elm.duration){
                if(this.comment_tl.enable === true && this.comment_tl.ended === false && this.comment_tl.hasComment === true){
                    this.comment_tl.play();
                    return;
                }else{
                    // currentTime==durationは動画が最後まで再生されたということ
                    // この場合に再生するときは最初から再生するための処理を行う
                    logger.debug("player play restart");
                    player_obs.trigger("player-info:reset-comment-scroll"); 
                    this.video_elm.currentTime = 0;
                    this.comment_tl.pause();
                    this.comment_tl.seek(0);
                }
            }      
            this.video_elm.play();
        });
        player_obs.on("player-video:pause", () => {
            const is_ready = this.video_elm.readyState > 2;
            if(!is_ready){
                return;
            }
            logger.debug("player pause");
            this.video_elm.pause();
            this.comment_tl.pause();
        });

        player_obs.on("player-video:seek", (current) => {  
            this.seek(current); 
        });

        player_obs.on("player-video:volume-changed", (volume) => {
            this.video_elm.volume = volume ;
        });
    
        player_obs.on("player-video:resize-begin", () => {
            if(this.comment_tl){
                this.comment_tl.pause();
            }
        });

        player_obs.on("window-resized", () => {
            if(this.comment_tl){
                this.createTimeLine(this.play_data.comments);
                const current = this.video_elm.currentTime;
                this.seek(current);
            }
        });
        player_obs.on("player-video:reset-comment-timelime", () => {
            if(this.comment_tl){
                this.createTimeLine(this.play_data.comments);
                const current = this.video_elm.currentTime;
                this.seek(current);
            }
        });

        player_obs.on("player-video:change-comment-visible", (visible) => {
            if(visible){
                this.comment_tl.enable = true;
                const current = this.video_elm.currentTime;
                this.seek(current);
                if(this.video_elm.paused===false){
                    this.video_elm.play();
                }
            }else{
                this.comment_tl.pause();
                this.comment_tl.seek(0);
                this.comment_tl.enable = false;
            }
        });

        player_obs.on("player-video:update-comments", (args)=> {       
            if(this.comment_tl){
                /** @type {CommentItem[]} */
                const comments = args;
                this.play_data.comments = comments;
                
                this.createTimeLine(this.play_data.comments);
                const current = this.video_elm.currentTime;
                this.seek(current);
            }
        });

        player_obs.on("player-video:update-comment-display-params", (args)=> {  
            const { duration_sec, fps } = args;     
            if(this.comment_tl){
                if(this.comment_config.duration_sec != duration_sec){
                    this.comment_config.duration_sec = duration_sec;
                    this.comment_config.fps = fps;

                    this.createTimeLine(this.play_data.comments);
                    const current = this.video_elm.currentTime;
                    this.seek(current);
                    return;
                }
                if(this.comment_config.fps != fps){
                    this.comment_config.duration_sec = duration_sec;
                    this.comment_config.fps = fps;

                    this.comment_tl.setFPS(fps);
                    return;
                }
            }else{
                this.comment_config.duration_sec = duration_sec;
                this.comment_config.fps = fps;
            }
        });
    },
    getCommentFontFamily() {
        let font_family = getComputedStyle(this.root).getPropertyValue("--nico-comment-font-family");
        if(!font_family){
            font_family = "Verdana,sans-serif";
        }
        logger.debug("コメントに使用するフォント: ", font_family);
        return font_family;
    },
    /**
     * 
     * @param {CommentItem[]} comments 
     */
    createTimeLine(comments) {
        const row_num = 12;
        const comment_font_family = this.getCommentFontFamily();
        const  { duration_sec, fps } = this.comment_config;
        const parent = this.$(".video-screen");

        const nico_script = new NicoScript();

        if(this.comment_tl){
            this.comment_tl.clear();
        }
        this.comment_tl = new NicoCommentTimeLine(parent, duration_sec, row_num, comment_font_family);
        this.comment_tl.onComplete(()=>{
            if(this.video_elm.currentTime == this.video_elm.duration){
                // 動画終了後にコメントが流れる場合はコメント完了後にpauseにする
                player_obs.trigger("player-controls:set-state", "pause"); 
            }
        });
        this.comment_tl.create(nico_script.getApplied(comments));
        this.comment_tl.setFPS(fps);

        if(this.comment_sync_id){
            clearInterval(this.comment_sync_id);
        }
        if(this.comment_config.auto_sync_checked){
            const last_time_sec = this.comment_tl.lastTimeSec;
            const interval_ms = this.comment_config.auto_sync_interval*1000;
            const threshold_sec = this.comment_config.auto_sync_threshold;
            this.comment_sync_id = setInterval(()=>{
                if(!this.comment_tl){
                    if(this.comment_sync_id){
                        clearInterval(this.comment_sync_id);
                    } 
                }
                const vt = this.video_elm.currentTime;
                if(!this.play_ended && vt < last_time_sec && !this.comment_tl.ended){
                    const ct = this.comment_tl.getCurrentTime();
                    if(Math.abs(ct - vt) > threshold_sec){
                        logger.debug("comment_sync ct=", ct, ", vt=", vt, "ct-vt=", ct - vt);
                        this.comment_tl.seek(vt);
                    }
                }
            },interval_ms);
        }
    },
    playVideoAndComment() {
        const current = this.video_elm.currentTime;
        this.comment_tl.seek(current);
        this.comment_tl.play();
        this.video_elm.play();
    },
    /**
     * 
     * @param {number} current 
     * @returns {void}
     */
    seek(current) {
        if(this.comment_tl.enable === false){
            // コメント非表示では動画の現在位置設定
            this.video_elm.currentTime = current;
            return;
        }

        if(this.comment_tl.ended === true){
            // コメント表示が終了している場合は動画とコメントタイムラインの現在位置設定
            this.video_elm.currentTime = current;
            this.comment_tl.seek(current);
            return;
        }

        // 動画終了後もコメントが流れている場合があるため
        // 動画が終了している場合はコメントタイムラインのpause状態
        // 動画が終了していない場合はvideoのpause状態
        // でpause状態を判定してシーク後の動作を切り替える
        const paused = this.video_elm.currentTime == this.video_elm.duration ?
            this.comment_tl.paused : this.video_elm.paused;
        if(paused === true){
            this.video_elm.currentTime = current;
            this.comment_tl.seek(current);
        }else{
            this.comment_tl.pause();
            this.video_elm.pause();
            this.video_elm.currentTime = current;

            const HAVE_ENOUGH_DATA = 4;
            const wait_timer = setInterval(() => {
                if (this.video_elm.paused && this.video_elm.readyState === HAVE_ENOUGH_DATA) {
                    this.playVideoAndComment();
                    clearInterval(wait_timer);
                }       
            }, 100);
        }  
    }
};
