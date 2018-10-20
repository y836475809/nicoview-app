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
            border: 1px solid #FF6600;
        }
    </style>

    <div id="player-video-screen">
        <video ref="palyermain" id="player" autoplay preload="metadata" controls>
        </video>
    </div>

    <script>
        /* globals base_dir obs */
        // var $ = jQuery = require("jquery");
        // var anime = require("animejs");

        // let comment_anime = null;
        // let my = [];
        let ctls = null;
        // var create_comment_elm = require("../../comment")
        // let comment_elm = require(`${base_dir}/comment`);
        // let nico_comment = require(`${base_dir}/nico_comment`);
        const CommentTimeLineManager = require(`${base_dir}/app/js/comment_timeline_manager`);
        
        let get_time_func = ()=>{
            return this.refs.palyermain.currentTime*1000;
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

        obs.on("receivedData", (data) => {
            console.log("data=", data);

            let video = this.refs.palyermain;
            video.src = data.src;
            video.type = data.type;
         
            const div_num = 200;
            createTimeLines(data.commnets, div_num);

            video.load();
        });
        
        this.on("mount", function () {
            console.log("mount");

            this.refs.palyermain.addEventListener("loadedmetadata", (event) => {
                const video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                };
                obs.trigger("resizePlayer", video_size);
                obs.trigger("seek_reload", this.refs.palyermain.duration);
            });

            this.refs.palyermain.addEventListener("loadeddata", (event) => {
                console.log("loadeddata event=", event);
            });
            this.refs.palyermain.addEventListener("play", () => {
                console.log("addEventListener playによるイベント発火");
                // comment_anime.play();
                ctls.play();
            });
            this.refs.palyermain.addEventListener("pause", () => {
                console.log("addEventListener pauseによるイベント発火");
                // comment_anime.pause();
                ctls.pause();
            });

            this.refs.palyermain.addEventListener("timeupdate", () => {
                const current = this.refs.palyermain.currentTime;
                obs.trigger("seek_update", current);
            });
            this.refs.palyermain.addEventListener("progress", function(){
                console.log("addEventListener progressによるイベント発火");
            }); 
            this.refs.palyermain.addEventListener("waiting", function(){
                console.log("addEventListener waitingによるイベント発火");
            }); 
            this.refs.palyermain.addEventListener("canplay", function(){
                console.log("addEventListener canplayによるイベント発火");
            }); 
            this.refs.palyermain.addEventListener("playing", function(){
                console.log("addEventListener playingによるイベント発火");
            });
            
            obs.on("play", () => {
                console.log("player.tag play");
                this.refs.palyermain.play();
            });
            obs.on("pause", () => {
                console.log("player.tag pause");
                this.refs.palyermain.pause();
            });

            obs.on("on_seeked", (current) => {           
                if(this.refs.palyermain.paused){
                    this.refs.palyermain.currentTime = current;
                    ctls.seek(current * 1000);
                }else{
                    console.log("player paused");
                    this.refs.palyermain.pause();
                    ctls.pause();

                    this.refs.palyermain.currentTime = current;
                    ctls.seek(current * 1000);

                    this.refs.palyermain.play();
                    ctls.play();
                }    
            });

            obs.on("resizeEndEvent", function (wsize) {
                // ff()
            });
        });
    </script>
</player-video>