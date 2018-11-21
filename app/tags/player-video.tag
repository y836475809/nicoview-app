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
        <video ref="player_video" id="player" autoplay preload="metadata" controls>
        </video>
    </div>

    <script>
        /* globals base_dir obs */
        const CommentTimeLineManager = require(`${base_dir}/app/js/comment_timeline_manager`);
        
        let ctls = null;
        let video_size = null;

        let get_time_func = ()=>{
            return this.refs.player_video.currentTime*1000;
        };
        let createTimeLines = (commnets, div_num)=>{
            const parent_id = "player-video-screen";
            const row_num = 12;
            const interval_ms = 100;
            const duration = 3000;

            ctls = new CommentTimeLineManager(
                parent_id, 
                div_num, 
                row_num, 
                interval_ms, 
                get_time_func);
            ctls.create(commnets, duration);
            console.log("ctl_list.length=", ctls.timelines.length);
            console.log(".comment.length=", document.querySelectorAll(".comment").length);
        };

        const moveSeek = (current) => {
            if(this.refs.player_video.paused){
                this.refs.player_video.currentTime = current;
                if(ctls!=null){
                    ctls.seek(current * 1000);
                }
            }else{
                this.refs.player_video.pause();
                this.refs.player_video.currentTime = current;
                this.refs.player_video.play();
            } 
        };
        
        
        // // TODO : move player-controls
        // window.addEventListener("keyup", (e) => {
        //     const video = this.refs.player_video;
        //     if(video.ended || video.readyState != 4){
        //         return;
        //     }
        //     if(e.key==" "){
        //         if(video.paused){
        //             video.play();
        //         }else{
        //             video.pause();
        //         }
        //     }
        // }, true);

        obs.on("receivedData", (data) => {
            console.log("data=", data);

            let video = this.refs.player_video;
            video.src = data.src;
            video.type = data.type;
         
            if(ctls){
                ctls.delete();
            }
            ctls = null;
            if(data.commnets.length>0){
                const div_num = 200;
                createTimeLines(data.commnets, div_num);
            }

            video.load();
        });

        this.on("mount", function () {
            console.log("mount");

            this.refs.player_video.addEventListener("loadedmetadata", (event) => {
                video_size = {
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
                if(ctls!=null){
                    ctls.play();
                }
            });
            this.refs.player_video.addEventListener("pause", () => {
                console.log("addEventListener pauseによるイベント発火");
                if(ctls!=null){
                    ctls.pause();
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
                if(ctls!=null){
                    const current = this.refs.player_video.currentTime;
                    console.log("addEventListener playingによるイベント発火 current= ", current);
                    ctls.pause();
                    ctls.seek(current * 1000);
                    ctls.play();
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
                if(ctls!=null){
                    ctls.pause();
                }
            });

            obs.on("resizeEndEvent", (wsize) => {
                if(ctls!=null){
                    ctls.reset();
                    const current = this.refs.player_video.currentTime;
                    moveSeek(current);
                }
            });
            obs.on("reset_comment_timelime", () => {
                if(ctls!=null){
                    ctls.pause();
                    ctls.reset();
                    const current = this.refs.player_video.currentTime;
                    moveSeek(current);
                }
            });
        });
    </script>
</player-video>