<player-page>
    <style scoped>
        :scope {
            --tags-height: 60px;
            --controls-height: 50px;
            background-color: var(--control-color);
        }
        .player-container {
            margin: 0;
            width: 100%;
            height: 100%;
        }
        .tags-container {
            height: var(--tags-height);
            outline: none;
        }  
        .video-container {
            height: calc(100% - var(--tags-height) - var(--controls-height));
            background-color: black;
            outline: none;
        }  
        .controls-container {
            height: var(--controls-height);
            outline: none;
        }  
        .video-container > div {
            width: 100%;
            height: 100%;
            overflow: hidden; 
            object-fit: contain;
            object-position: center center;
        }
    </style>

    <div class="player-container">
        <div class="center-hv tags-container" tabIndex="-1" onkeyup={onkeyupTogglePlay}>
            <player-tags obs={opts.obs}></player-tags>
        </div>
        <div class="video-container" tabIndex="-1" 
            onkeyup={onkeyupTogglePlay}
            onmouseup={oncontextmenu}>
            <div>
                <player-video obs={opts.obs}></player-video>
            </div>
        </div>
        <div class="center-hv controls-container" tabIndex="-1" onkeyup={onkeyupTogglePlay}>
            <player-controls obs={opts.obs}></player-controls>
        </div>
        <open-video-form obs={obs_open_video_form}></open-video-form>
    </div>

    <script>
        /* globals riot */
        const ipc = window.electron.ipcRenderer; 
        
        const obs = this.opts.obs; 
        this.obs_open_video_form = riot.observable();

        const getPlayData = async () => {
            return await new Promise((resolve, reject) => {
                obs.trigger("player-main-page:get-play-data-callback", (args)=>{
                    resolve(args);
                });
            });
        };

        const getCurrentPlayTime = async () => {
            return await new Promise((resolve, reject) => {
                obs.trigger("player-video:get-current-time-callback", (args)=>{
                    resolve(args);
                });
            });
        };

        const resizeVideo = (org_size) => {
            const elm = this.root.querySelector(".video-container");
            const dw = org_size.width - elm.offsetWidth;
            const dh = org_size.height - elm.offsetHeight;
            window.resizeBy(dw, dh);
        };

        let contextmenu_show = false;

        this.oncontextmenu = async (e) => {
            // コンテキストメニュー表示後の画面クリックでは再生/停止しない
            if(e.button===0 && !contextmenu_show){   
                obs.trigger("player-controls:play");
            }

            if(e.button === 1){
                contextmenu_show = true;

                await ipc.invoke("app:show-player-contextmeu2");

                contextmenu_show = false;
            }

            if(e.button===2){
                contextmenu_show = true;

                const play_data = await getPlayData(); 
                const menu_id = await ipc.invoke("app:show-player-contextmeu", { play_data });
                if(menu_id){
                    const { video_id, title, thumbnailURL, online } = play_data;
                    if(menu_id=="add-bookmark-time"){
                        obs.trigger("player-video:get-current-time-callback", (current_time)=>{
                            obs.trigger("player-main-page:add-bookmark", {
                                title: title,
                                id: video_id,
                                time: current_time
                            });
                        });
                    }
                    if(menu_id=="add-stack-time"){
                        const time = await getCurrentPlayTime();
                        obs.trigger("player-main-page:add-stack-items", {
                            items:[{
                                id: video_id,
                                title: title, 
                                thumb_img:thumbnailURL,
                                time: time
                            }]
                        });
                    }
                    if(menu_id=="show-open-video-form"){
                        this.obs_open_video_form.trigger("show");
                    }
                    if(menu_id=="change-movie-size"){
                        obs.trigger("player-video:get-video-size-callback",(args)=>{
                            const org_size = args;
                            resizeVideo(org_size);
                        });
                    }
                }

                contextmenu_show = false;
            }
        };

        this.onkeyupTogglePlay = (e) => {
            if (e.keyCode === 32) {
                obs.trigger("player-controls:play");
            }
        };
    </script>    
</player-page>