<player-video >
    <style scoped>
        :scope { 
            position: relative;
        }
        #player-video-screen {
            width: 100%;
            height: 100%;   
        }      
        #player {
            width: 100%;
            height: 100%;         
        }
        .comment{
            float:left;
            /* color: white; */
            font-weight: bold;
            /* border: 1px solid #FF6600; */
            text-shadow: 1px 1px 0px black, 1px 1px 0px black;
        }
    </style>

    <div id="player-video-screen" onmousedown={mousedown} onmouseup={oncontextmenu}>
        <video ref="player_video" id="player" autoplay preload="metadata">
        </video>
    </div>

    <script>
        /* globals rootRequire */
        const { CommentTimeLine, NicoScript } = rootRequire("app/js/comment-timeline");
        const { ConfigRenderer } = rootRequire("app/js/config");

        const obs = this.opts.obs; 

        let video_elm = null;
        let play_data = null;
        let comment_tl = null;
        let comment_params = null;

        const createTimeLine = (comments)=>{
            const row_num = 12;
            const  { duration_sec, fps } = comment_params;
            const parent = this.root.querySelector("#player-video-screen");

            const nico_script = new NicoScript();

            if(comment_tl){
                comment_tl.clear();
            }
            comment_tl = new CommentTimeLine(parent, duration_sec, row_num);
            comment_tl.create(nico_script.getApplied(comments));
            comment_tl.setFPS(fps);
        };

        const seek = (current) => {
            if(video_elm.paused){
                video_elm.currentTime = current;
                if(comment_tl){
                    comment_tl.seek(current);
                }
            }else{
                video_elm.pause();
                video_elm.currentTime = current;
                const wait_timer = setInterval(() => {
                    if (video_elm.paused && video_elm.readyState === 4) {
                        comment_tl.seek(current);
                        video_elm.play();
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
            comment_params = await ConfigRenderer.get("comment", {
                duration_sec: 4,
                fps: 10,
                do_limit: true
            });
            
            video_elm = this.root.querySelector("#player");

            video_elm.addEventListener("loadedmetadata", (event) => {
                const video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                };
                obs.trigger("player-main-page:metadata-loaded", video_size);
                obs.trigger("player-seek:reload", video_elm.duration);
            });

            video_elm.addEventListener("loadeddata", (event) => {
                console.log("loadeddata event=", event);
                obs.trigger("player-controls:loaded-data");

                const { time } = play_data.state;
                if(time>0){
                    seek(time);
                }
            });
            video_elm.addEventListener("play", () => {
                console.log("addEventListener playによるイベント発火");
            });
            video_elm.addEventListener("pause", () => {
                console.log("addEventListener pauseによるイベント発火");
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            video_elm.addEventListener("timeupdate", () => {
                const current = video_elm.currentTime;
                obs.trigger("player-seek:seek-update", current);
                obs.trigger("player-viewinfo-page:seek-update", current);
            });
            video_elm.addEventListener("progress", function(){
                console.log("addEventListener progressによるイベント発火");
            }); 
            video_elm.addEventListener("waiting", function(){
                console.log("addEventListener waitingによるイベント発火");
            }); 
            video_elm.addEventListener("canplay", function(){
                console.log("addEventListener canplayによるイベント発火");
            }); 
            video_elm.addEventListener("playing", () => {
                console.log("addEventListener playingによるイベント発火");

                if(comment_tl.paused===true){
                    const pre_tiem = video_elm.currentTime;
                    const wait_timer = setInterval(() => {
                        const current = video_elm.currentTime;
                        if(Math.abs(pre_tiem - current)>0){ 
                            comment_tl.seek(current);
                            comment_tl.play();

                            clearInterval(wait_timer);
                        }      
                    }, 100);
                }
            });

            video_elm.addEventListener("ended", () => {
                console.log("addEventListener endedによるイベント発火");
                obs.trigger("player-controls:set-state", "pause"); 
            });
            
            obs.on("player-video:play", () => {
                console.log("player.tag play");
                video_elm.play();
            });
            obs.on("player-video:pause", () => {
                console.log("player.tag pause");
                video_elm.pause();
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

        obs.on("player-video:get-play-data-callback", (cb) => { 
            cb(play_data);
        });
    </script>
</player-video>