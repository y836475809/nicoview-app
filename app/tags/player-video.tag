<player-video >
    <style scoped>
        :scope { 
            position: relative;
            --video-id-form-width: 300px;
            --video-id-form-height: 30px;
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

        .video-id-form-none {
            display: none;
        }
        .video-id-form {
            display: flex;
            position: fixed;
            width: var(--video-id-form-width);
            height: var(--video-id-form-height);
            left: calc(50% - var(--video-id-form-width));
            top: calc(50% - var(--video-id-form-height));
            background-color: rgba(209, 203, 203);
            border-radius: 2px;
            z-index: 10;
        }
        .video-id-form .label {
            width: 20px;
            margin: 5px;    
            user-select: none;
        }
        .video-id-form input {
            width: calc(var(--video-id-form-width) 
                        - 20px - 50px - 20px);
            margin: 3px;
        }
        .video-id-form .play-button {
            width: 50px;
            margin: 2px 0 2px 0;      
        }
        .video-id-form .close-button {
            width: 20px;
            margin: 2px;   
            cursor: pointer;   
            user-select: none;
        }
    </style>

    <div id="player-video-screen" onmousedown={mousedown} onmouseup={oncontextmenu}>
        <video ref="player_video" id="player" autoplay preload="metadata">
        </video>
        <div class="{video_id_form_display}">
            <div class="video-id-form">
                <div class="label center-hv">ID</div>
                <input type="text" onkeydown={onkeydownPlayByVideoID}>
                <button class="play-button" onclick={onclickPlayByVideoID}>再生</button>
                <div class="close-button center-hv" title="閉じる" onclick={onclickCloseVideoIDForm}>x</div>
            </div>
        </div>
    </div>

    <script>
        /* globals app_base_dir */
        const { remote, clipboard } = require("electron");
        const { Menu } = remote;
        const { CommentTimeLine, NicoScript } = require(`${app_base_dir}/js/comment-timeline`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { BookMark } = require(`${app_base_dir}/js/bookmark`);
        const { getNicoURL } = require(`${app_base_dir}/js/niconico`);

        const obs = this.opts.obs; 

        const comment_params = SettingStore.getCommentParams();

        let video_elm = null;
        let play_data = null;
        let comment_tl = null;

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

        this.on("mount", function () {
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

        const getMenuEnable = (menu_id, data) => {
            if(menu_id == "show-video-id-form"){
                return true;
            }

            if(!data) {
                return false;
            }
            
            const { state } = data;
            if(menu_id=="add-download" && state.is_saved===true){
                return false;
            }

            return true;
        };

        const self = this;
        const createMenu = () => {
            const nemu_templete = [
                { 
                    id: "add-bookmark",
                    label: "ブックマーク", click() {
                        const { video_id, title } = play_data.viewinfo.thumb_info.video;
                        const bk_item = BookMark.createVideoItem(title, video_id);
                        obs.trigger("player-main-page:add-bookmark", bk_item);
                    }
                },
                { 
                    id: "add-download",
                    label: "ダウンロードに追加", click() {
                        const { video_id, title, thumbnailURL } = play_data.viewinfo.thumb_info.video;
                        const item = {
                            thumb_img: thumbnailURL,
                            id: video_id,
                            name: title,
                            state: 0
                        };
                        obs.trigger("player-main-page:add-download-item", item);
                    }
                },   
                { 
                    id: "copy-url",
                    label: "urlをコピー", click() {
                        const { video_id } = play_data.viewinfo.thumb_info.video;
                        const url = getNicoURL(video_id);
                        clipboard.writeText(url);
                    }
                },
                { 
                    id: "show-video-id-form",
                    label: "IDを指定して再生", click() {
                        showVideoIDForm(self);
                    }
                },               
                { 
                    type: "separator" 
                },
                { 
                    id: "reload",
                    label: "再読み込み", click() {
                        const { viewinfo, state } = play_data;
                        const { video_id } = viewinfo.thumb_info.video;

                        if(state.is_online===true){
                            obs.trigger("player-main-page:play-by-videoid-online", video_id);
                        }else{
                            obs.trigger("player-main-page:play-by-videoid", video_id);
                        }
                    }
                },
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        const context_menu = createMenu();
        this.oncontextmenu= (e) => {
            if(e.button===2){
                context_menu.items.forEach(menu => {
                    const id = menu.id;
                    menu.enabled = getMenuEnable(id, play_data); //play_data !== null;
                });
                context_menu.popup({window: remote.getCurrentWindow()});
            }
        };
        this.video_id_form_display = "video-id-form-none";
        const playByVideoID = () => {
            const elm = this.root.querySelector(".video-id-form input");
            const video_id = elm.value;
            obs.trigger("player-main-page:play-by-videoid", video_id); 
        }
        this.onkeydownPlayByVideoID = (e) => {
            if(e.code == "Enter"){
                playByVideoID();
            }
        }
        this.onclickPlayByVideoID = (e) => {
            playByVideoID();
        };
        this.onclickCloseVideoIDForm = (e) => {
            this.video_id_form_display = "video-id-form-none";
        };
        const showVideoIDForm = (self) => {
            self.video_id_form_display = "";
        };
    </script>
</player-video>