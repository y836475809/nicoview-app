<player-video >
    <style scoped>
        :scope { 
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
        const { CommentTimeLine, NicoScript } = window.CommentTimeLine;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs; 

        let video_elm = null;
        let play_data = null;
        let comment_tl = null;
        let comment_params = null;
        let comment_sync_id = null;

        const getCommentFontFamily = () => {
            let font_family = getComputedStyle(this.root).getPropertyValue("--nico-comment-font-family");
            if(!font_family){
                font_family = "Verdana,sans-serif";
            }
            logger.debug("コメントに使用するフォント: ", font_family);
            return font_family;
        };

        const createTimeLine = (comments)=>{
            const row_num = 12;
            const comment_font_family = getCommentFontFamily();
            const  { duration_sec, fps } = comment_params;
            const parent = this.root.querySelector(".video-screen");

            const nico_script = new NicoScript();

            if(comment_tl){
                comment_tl.clear();
            }
            comment_tl = new CommentTimeLine(parent, duration_sec, row_num, comment_font_family);
            comment_tl.onComplete(()=>{
                if(video_elm.currentTime == video_elm.duration){
                    // 動画終了後にコメントが流れる場合はコメント完了後にpauseにする
                    obs.trigger("player-controls:set-state", "pause"); 
                }
            });
            comment_tl.create(nico_script.getApplied(comments));
            comment_tl.setFPS(fps);

            if(comment_sync_id){
                clearInterval(comment_sync_id);
            }
            if(comment_params.auto_sync_checked){
                const interval_ms = comment_params.auto_sync_interval*1000;
                const threshold_sec = comment_params.auto_sync_threshold;
                comment_sync_id = setInterval(()=>{
                    if(!comment_tl){
                        if(comment_sync_id){
                            clearInterval(comment_sync_id);
                        } 
                    }
                    const ct = comment_tl.getCurrentTime();
                    const vt = video_elm.currentTime;
                    if(ct <= video_elm.duration){
                        if(Math.abs(ct - vt) > threshold_sec){
                            logger.debug("comment_sync ct=", ct, ", vt=", vt, "ct-vt=", ct - vt);
                            comment_tl.seek(vt);
                        }
                    }
                },interval_ms);
            }
        };

        const playVideoAndComment = ()=> {
            const current = video_elm.currentTime;
            comment_tl.seek(current);
            comment_tl.play();
            video_elm.play();
        };

        const seek = (current) => {
            if(comment_tl.enable === false){
                // コメント非表示では動画の現在位置設定
                video_elm.currentTime = current;
                return;
            }

            if(comment_tl.ended === true){
                // コメント表示が終了している場合は動画とコメントタイムラインの現在位置設定
                video_elm.currentTime = current;
                comment_tl.seek(current);
                return;
            }

            // 動画終了後もコメントが流れている場合があるため
            // 動画が終了している場合はコメントタイムラインのpause状態
            // 動画が終了していない場合はvideoのpause状態
            // でpause状態を判定してシーク後の動作を切り替える
            const paused = video_elm.currentTime == video_elm.duration ?
                comment_tl.paused : video_elm.paused;
            if(paused === true){
                video_elm.currentTime = current;
                comment_tl.seek(current);
            }else{
                comment_tl.pause();
                video_elm.pause();
                video_elm.currentTime = current;

                const HAVE_ENOUGH_DATA = 4;
                const wait_timer = setInterval(() => {
                    if (video_elm.paused && video_elm.readyState === HAVE_ENOUGH_DATA) {
                        playVideoAndComment();
                        clearInterval(wait_timer);
                    }       
                }, 100);
            }  
        };

        obs.on("player-video:set-play-data", (data) => {
            play_data = data;

            const video_data = play_data.video_data;
            video_elm.src = video_data.src;
            video_elm.type = video_data.type;

            createTimeLine(play_data.comments);

            video_elm.load();
        });

        this.on("mount", async () => {
            const default_comment_params = await new Promise((resolve, reject) => {
                obs.trigger("setting-display-comment:get-default_params", (default_params)=>{
                    resolve(default_params);
                });
            });
            comment_params = await IPCClient.request("config", "get", {
                key: "comment", 
                value: default_comment_params
            });
            
            video_elm = this.root.querySelector(".video-screen > video");

            video_elm.addEventListener("loadedmetadata", (event) => {
                const video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                };
                obs.trigger("player-main-page:metadata-loaded", video_size);
                obs.trigger("player-seek:reload", video_elm.duration);
            });

            video_elm.addEventListener("loadeddata", (event) => {
                logger.debug("loadeddata event=", event);
                obs.trigger("player-controls:loaded-data");

                const { time } = play_data.state;
                if(time>0){
                    video_elm.currentTime = time;
                }
            });
            video_elm.addEventListener("play", () => {
                logger.debug("playによるイベント発火");
                playVideoAndComment();
            });
            video_elm.addEventListener("pause", () => {
                logger.debug("pauseによるイベント発火");
                if(video_elm.currentTime == video_elm.duration){
                    // currentTime==durationは動画の最後ということ
                    // この場合コメントは流したままにする
                    return;
                }

                if(comment_tl){
                    comment_tl.pause();
                }
            });

            video_elm.addEventListener("timeupdate", () => {
                const current = video_elm.currentTime;
                obs.trigger("player-seek:seek-update", current);
                obs.trigger("player-info-page:seek-update", current);
            });
            video_elm.addEventListener("progress", function(){
                logger.debug("progressによるイベント発火");
            }); 
            video_elm.addEventListener("waiting", function(){
                logger.debug("waitingによるイベント発火");
                comment_tl.pause();
            }); 
            video_elm.addEventListener("canplay", function(){
                logger.debug("canplayによるイベント発火");
            }); 
            video_elm.addEventListener("playing", async () => {
                logger.debug("playingによるイベント発火");
                playVideoAndComment();
            });

            video_elm.addEventListener("ended", () => {
                logger.debug("endedによるイベント発火");

                if(comment_tl.enable === false || comment_tl.ended === true){
                    // コメント非表示またはコメントが完了している場合は動画終了でpauseにする
                    obs.trigger("player-controls:set-state", "pause"); 
                }
            });
            
            obs.on("player-video:play", () => {
                logger.debug("player play");
                if(video_elm.currentTime == video_elm.duration){
                    if(comment_tl.enable === true && comment_tl.ended === false){
                        comment_tl.play();
                        return;
                    }else{
                        // currentTime==durationは動画が最後まで再生されたということ
                        // この場合に再生するときは最初から再生するための処理を行う
                        logger.debug("player play restart");
                        obs.trigger("player-info-page:reset-comment-scroll"); 
                        video_elm.currentTime = 0;
                        comment_tl.pause();
                        comment_tl.seek(0);
                    }
                }      
                video_elm.play();
            });
            obs.on("player-video:pause", () => {
                logger.debug("player pause");
                video_elm.pause();
                comment_tl.pause();
            });

            obs.on("player-video:seek", (current) => {  
                seek(current); 
            });

            obs.on("player-video:volume-changed", (volume) => {
                video_elm.volume = volume ;
            });
           
            obs.on("player-video:resize-begin", () => {
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            obs.on("window-resized", () => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });
            obs.on("player-video:reset-comment-timelime", () => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });

            obs.on("player-video:change-comment-visible", (visible) => {
                if(visible){
                    comment_tl.enable = true;
                    const current = video_elm.currentTime;
                    seek(current);
                    if(video_elm.paused===false){
                        video_elm.play();
                    }
                }else{
                    comment_tl.pause();
                    comment_tl.seek(0);
                    comment_tl.enable = false;
                }
            });

            obs.on("player-video:update-comments", (args)=> {       
                if(comment_tl){
                    const comments = args;
                    play_data.comments = comments;
                    
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });

            obs.on("player-video:update-comment-display-params", (args)=> {  
                const { duration_sec, fps } = args;     
                if(comment_tl){
                    if(comment_params.duration_sec != duration_sec){
                        comment_params.duration_sec = duration_sec;
                        comment_params.fps = fps;

                        createTimeLine(play_data.comments);
                        const current = video_elm.currentTime;
                        seek(current);
                        return;
                    }
                    if(comment_params.fps != fps){
                        comment_params.duration_sec = duration_sec;
                        comment_params.fps = fps;

                        comment_tl.setFPS(fps);
                        return;
                    }
                }else{
                    comment_params.duration_sec = duration_sec;
                    comment_params.fps = fps;
                }
            });
        });

        obs.on("player-video:get-current-time-callback", (cb) => { 
            cb(video_elm.currentTime);
        });
    </script>
</player-video>