<player-video >
    <style>
        :host { 
            position: relative;
        }
        .video-screen {
            width: 100%;
            height: 100%;   
        }    
        .video-screen >  video {
            width: 100%;
            height: 100%;         
        }
        .comment{
            font-family: var(--nico-comment-font-family);
            float:left;
            font-weight: bold;
            text-shadow: 1px 1px 0px black, 1px 1px 0px black;
        }
    </style>

    <div class="video-screen" onmouseup={oncontextmenu}>
        <video autoplay preload="metadata">
        </video>
    </div>

    <script>
        /* globals logger */
        export default {
            onBeforeMount(props) {
                this.myapi = window.myapi;
                this.CommentTimeLine = window.CommentTimeLine.CommentTimeLine;
                this.NicoScript = window.CommentTimeLine.NicoScript;

                this.obs = props.obs; 

                this.video_elm = null;
                this.play_data = null;
                this.comment_tl = null;
                this.comment_params = null;
                this.comment_sync_id = null;
                this.play_ended = false;

                this.obs.on("player-video:set-play-data", async(data) => {
                    await this.initVideo();

                    this.play_data = data;

                    const video_data = this.play_data.video_data;
                    this.video_elm.src = video_data.src;
                    this.video_elm.type = video_data.type;

                    this.createTimeLine(this.play_data.comments);

                    this.video_elm.load();
                });
                this.obs.on("player-video:get-current-time-callback", (cb) => { 
                    cb(this.video_elm.currentTime);
                });

                this.obs.on("player-video:get-video-size-callback", (cb) => {
                    cb({
                        width: this.video_elm.videoWidth,
                        height: this.video_elm.videoHeight
                    });
                });
            },
            async initVideo() {
                if(this.video_elm){
                    return;
                }

                const default_comment_params = await new Promise((resolve, reject) => {
                    this.obs.trigger("setting-display-comment:get-default_params", (default_params)=>{
                        resolve(default_params);
                    });
                });
                this.comment_params = await this.myapi.ipc.Config.get("comment", default_comment_params);
                
                this.video_elm = this.root.querySelector(".video-screen > video");
                this.video_elm.volume = await this.myapi.ipc.Config.get("player.volume", 0.5);

                this.video_elm.addEventListener("loadedmetadata", (event) => {
                    this.obs.trigger("player-seek:reload", this.video_elm.duration);
                });

                this.video_elm.addEventListener("loadeddata", (event) => {
                    logger.debug("loadeddata event=", event);
                    this.obs.trigger("player-controls:loaded-data");

                    const { time } = this.play_data.state;
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
                    this.obs.trigger("player-seek:seek-update", current);
                    this.obs.trigger("player-info-page:seek-update", current);
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
                            this.obs.trigger("player-seek:buffered-update", time_sec);
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
                });

                this.video_elm.addEventListener("ended", () => {
                    logger.debug("endedによるイベント発火");
                    this.play_ended = true;
                    if(this.comment_tl.enable === false || this.comment_tl.ended === true || this.comment_tl.hasComment === false){
                        // コメント非表示またはコメントが完了している場合は動画終了でpauseにする
                        this.obs.trigger("player-controls:set-state", "pause"); 
                    }
                });
                
                this.obs.on("player-video:play", () => {
                    logger.debug("player play");
                    if(this.video_elm.currentTime == this.video_elm.duration){
                        if(this.comment_tl.enable === true && this.comment_tl.ended === false && this.comment_tl.hasComment === true){
                            this.comment_tl.play();
                            return;
                        }else{
                            // currentTime==durationは動画が最後まで再生されたということ
                            // この場合に再生するときは最初から再生するための処理を行う
                            logger.debug("player play restart");
                            this.obs.trigger("player-info-page:reset-comment-scroll"); 
                            this.video_elm.currentTime = 0;
                            this.comment_tl.pause();
                            this.comment_tl.seek(0);
                        }
                    }      
                    this.video_elm.play();
                });
                this.obs.on("player-video:pause", () => {
                    const is_ready = this.video_elm.readyState > 2;
                    if(!is_ready){
                        return;
                    }
                    logger.debug("player pause");
                    this.video_elm.pause();
                    this.comment_tl.pause();
                });

                this.obs.on("player-video:seek", (current) => {  
                    this.seek(current); 
                });

                this.obs.on("player-video:volume-changed", (volume) => {
                    this.video_elm.volume = volume ;
                });
            
                this.obs.on("player-video:resize-begin", () => {
                    if(this.comment_tl){
                        this.comment_tl.pause();
                    }
                });

                this.obs.on("window-resized", () => {
                    if(this.comment_tl){
                        this.createTimeLine(this.play_data.comments);
                        const current = this.video_elm.currentTime;
                        this.seek(current);
                    }
                });
                this.obs.on("player-video:reset-comment-timelime", () => {
                    if(this.comment_tl){
                        this.createTimeLine(this.play_data.comments);
                        const current = this.video_elm.currentTime;
                        this.seek(current);
                    }
                });

                this.obs.on("player-video:change-comment-visible", (visible) => {
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

                this.obs.on("player-video:update-comments", (args)=> {       
                    if(this.comment_tl){
                        const comments = args;
                        this.play_data.comments = comments;
                        
                        this.createTimeLine(this.play_data.comments);
                        const current = this.video_elm.currentTime;
                        this.seek(current);
                    }
                });

                this.obs.on("player-video:update-comment-display-params", (args)=> {  
                    const { duration_sec, fps } = args;     
                    if(this.comment_tl){
                        if(this.comment_params.duration_sec != duration_sec){
                            this.comment_params.duration_sec = duration_sec;
                            this.comment_params.fps = fps;

                            this.createTimeLine(this.play_data.comments);
                            const current = this.video_elm.currentTime;
                            this.seek(current);
                            return;
                        }
                        if(this.comment_params.fps != fps){
                            this.comment_params.duration_sec = duration_sec;
                            this.comment_params.fps = fps;

                            this.comment_tl.setFPS(fps);
                            return;
                        }
                    }else{
                        this.comment_params.duration_sec = duration_sec;
                        this.comment_params.fps = fps;
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
            createTimeLine(comments) {
                const row_num = 12;
                const comment_font_family = this.getCommentFontFamily();
                const  { duration_sec, fps } = this.comment_params;
                const parent = this.root.querySelector(".video-screen");

                const nico_script = new this.NicoScript();

                if(this.comment_tl){
                    this.comment_tl.clear();
                }
                this.comment_tl = new this.CommentTimeLine(parent, duration_sec, row_num, comment_font_family);
                this.comment_tl.onComplete(()=>{
                    if(this.video_elm.currentTime == this.video_elm.duration){
                        // 動画終了後にコメントが流れる場合はコメント完了後にpauseにする
                        this.obs.trigger("player-controls:set-state", "pause"); 
                    }
                });
                this.comment_tl.create(nico_script.getApplied(comments));
                this.comment_tl.setFPS(fps);

                if(this.comment_sync_id){
                    clearInterval(this.comment_sync_id);
                }
                if(this.comment_params.auto_sync_checked){
                    const last_time_sec = this.comment_tl.lastTimeSec;
                    const interval_ms = this.comment_params.auto_sync_interval*1000;
                    const threshold_sec = this.comment_params.auto_sync_threshold;
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
    </script>
</player-video>