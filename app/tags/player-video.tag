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
            color: white;
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

        const moveSeek = (current) => {
            if(this.refs.player_video.paused){
                this.refs.player_video.currentTime = current;
                if(comment_tl){
                    comment_tl.seek(current);
                }
            }else{
                this.refs.player_video.pause();
                this.refs.player_video.currentTime = current;
                this.refs.player_video.play();
            } 
        };

        obs.on("receivedData", (data) => {
            play_data = data;
            
            const video = this.refs.player_video;
            video.src = data.src;
            video.type = data.type;

            createTimeLine(data.comments);

            video.load();
        });

        this.on("mount", function () {
            this.refs.player_video.addEventListener("loadedmetadata", (event) => {
                const video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                };
                obs.trigger("load_meta_data", video_size);
                obs.trigger("seek_reload", this.refs.player_video.duration);
            });

            this.refs.player_video.addEventListener("loadeddata", (event) => {
                console.log("loadeddata event=", event);
                obs.trigger("loaded_data");
            });
            this.refs.player_video.addEventListener("play", () => {
                console.log("addEventListener playによるイベント発火");
                if(comment_tl){
                    comment_tl.play();
                }
            });
            this.refs.player_video.addEventListener("pause", () => {
                console.log("addEventListener pauseによるイベント発火");
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            this.refs.player_video.addEventListener("timeupdate", () => {
                const current = this.refs.player_video.currentTime;
                obs.trigger("seek_update", current);
            });
            this.refs.player_video.addEventListener("progress", function(){
                console.log("addEventListener progressによるイベント発火");
            }); 
            this.refs.player_video.addEventListener("waiting", function(){
                console.log("addEventListener waitingによるイベント発火");
            }); 
            this.refs.player_video.addEventListener("canplay", function(){
                console.log("addEventListener canplayによるイベント発火");
            }); 
            this.refs.player_video.addEventListener("playing", () => {
                console.log("addEventListener playingによるイベント発火");
                //TODO
                if(comment_tl){
                    const current = this.refs.player_video.currentTime;
                    comment_tl.pause();
                    comment_tl.seek(current);
                    comment_tl.play();
                }
            });
            
            obs.on("play", () => {
                console.log("player.tag play");
                this.refs.player_video.play();
            });
            obs.on("pause", () => {
                console.log("player.tag pause");
                this.refs.player_video.pause();
            });

            obs.on("on_seeked", (current) => {  
                moveSeek(current); 
            });

            obs.on("on_change_volume", (volume) => {
                this.refs.player_video.volume = volume ;
            });
           
            obs.on("on_resize_begin", () => {
                if(comment_tl){
                    comment_tl.pause();
                }
            });

            obs.on("resizeEndEvent", (wsize) => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = this.refs.player_video.currentTime;
                    moveSeek(current);
                }
            });
            obs.on("reset_comment_timelime", () => {
                if(comment_tl){
                    createTimeLine(play_data.comments);
                    const current = this.refs.player_video.currentTime;
                    moveSeek(current);
                }
            });
        });
    </script>
</player-video>