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

    <div id="player-video-screen" onmousedown={mousedown}>
        <video ref="player_video" id="player" autoplay preload="metadata">
        </video>
    </div>

    <script>
        /* globals app_base_dir obs */
        const { CommentTimeLine } = require(`${app_base_dir}/js/comment-timeline`);
        
        let video_elm = null;
        let play_data = null;
        let comment_tl = null;

        const createTimeLine = (comments)=>{
            const row_num = 12;
            const duration_sec = 4;
            const parent = this.root.querySelector("#player-video-screen");

            if(comment_tl){
                comment_tl.clear();
            }
            comment_tl = new CommentTimeLine(parent, duration_sec, row_num);
            comment_tl.create(comments);
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
                video_elm.play();
            } 
        };

        obs.on("receivedData", (data) => {
            play_data = data;

            const video_data = play_data.video_data;
            video_elm.src = video_data.src;
            video_elm.type = video_data.type;

            createTimeLine(play_data.comments);

            video_elm.load();
        });

        this.on("mount", function () {
            video_elm = this.root.querySelector("#player");

            video_elm.addEventListener("loadedmetadata", (event) => {
                const video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                };
                obs.trigger("load_meta_data", video_size);
                obs.trigger("seek_reload", video_elm.duration);
            });

            video_elm.addEventListener("loadeddata", (event) => {
                console.log("loadeddata event=", event);
                obs.trigger("loaded_data");
            });
            video_elm.addEventListener("play", () => {
                console.log("addEventListener playによるイベント発火");
                if(comment_tl){
                    comment_tl.play();
                }
            });
            video_elm.addEventListener("pause", () => {
                console.log("addEventListener pauseによるイベント発火");
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            video_elm.addEventListener("timeupdate", () => {
                const current = video_elm.currentTime;
                obs.trigger("seek_update", current);
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
                //TODO
                if(comment_tl){
                    const current = video_elm.currentTime;
                    comment_tl.pause();
                    comment_tl.seek(current);
                    comment_tl.play();
                }
            });
            
            obs.on("play", () => {
                console.log("player.tag play");
                video_elm.play();
            });
            obs.on("pause", () => {
                console.log("player.tag pause");
                video_elm.pause();
            });

            obs.on("on_seeked", (current) => {  
                seek(current); 
            });

            obs.on("on_change_volume", (volume) => {
                video_elm.volume = volume ;
            });
           
            obs.on("on_resize_begin", () => {
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            obs.on("resizeEndEvent", (wsize) => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });
            obs.on("reset_comment_timelime", () => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });

            obs.on("show-player-comment", (visible) => {
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

            obs.on("update-comments", (args)=> {       
                if(comment_tl){
                    const comments = args;
                    play_data.comments = comments;
                    
                    createTimeLine(play_data.comments);
                    const current = video_elm.currentTime;
                    seek(current);
                }
            });
        });
    </script>
</player-video>