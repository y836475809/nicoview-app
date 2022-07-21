<player-page>
    <style>
        :host {
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
            position: relative;
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
            <player-tags></player-tags>
        </div>
        <div class="video-container" tabIndex="-1" 
            onkeyup={onkeyupTogglePlay}
            onmouseup={oncontextmenu}>
            <div>
                <player-video></player-video>
            </div>
            <open-video-form obs={obs_open_video_form}></open-video-form>
        </div>
        <div class="center-hv controls-container" tabIndex="-1" onkeyup={onkeyupTogglePlay}>
            <player-controls></player-controls>
        </div>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;
        const { MyObservable } = window.MyObservable;
        const player_obs = riot.obs;

        export default {
            obs_open_video_form:null,
            contextmenu_show:false,
            onBeforeMount() {
                this.obs_open_video_form = new MyObservable();
            },
            async getPlayData() {
                return await player_obs.triggerReturn("player-main-page:get-play-data-callback");
            },
            async getCurrentPlayTime() {
                return await player_obs.triggerReturn("player-video:get-current-time-callback");
            },
            resizeVideo(org_size) {
                const elm = this.$(".video-container");
                const dw = org_size.width - elm.offsetWidth;
                const dh = org_size.height - elm.offsetHeight;
                window.resizeBy(dw, dh);
            },
            async oncontextmenu(e) {
                // コンテキストメニュー表示後の画面クリックでは再生/停止しない
                if(e.button===0 && !this.contextmenu_show){   
                    player_obs.trigger("player-controls:play");
                }

                if(e.button === 1){
                    this.contextmenu_show = true;

                    await myapi.ipc.popupContextMenu("player-history-stack");
                    
                    this.contextmenu_show = false;
                }

                if(e.button===2){
                    this.contextmenu_show = true;

                    const play_data = await this.getPlayData(); 
                    const menu_id = await myapi.ipc.popupContextMenu("player", { play_data });
                    if(menu_id){
                        const { video_id, title, thumbnailURL, online } = play_data; // eslint-disable-line no-unused-vars
                        if(menu_id=="add-bookmark-time"){
                            const current_time = await this.getCurrentPlayTime();
                            const bk_item = {
                                title: title,
                                id: video_id,
                                time: current_time
                            };
                            myapi.ipc.Bookmark.addItems([bk_item]);
                        }
                        if(menu_id=="add-stack-time"){
                            const time = await this.getCurrentPlayTime();
                            myapi.ipc.Stack.addItems([
                                {
                                    id: video_id,
                                    title: title, 
                                    thumb_img:thumbnailURL,
                                    time: time
                                }
                            ]);
                        }
                        if(menu_id=="show-open-video-form"){
                            this.obs_open_video_form.trigger("show");
                        }
                        if(menu_id=="change-movie-size"){
                            const org_size = await player_obs.triggerReturn("player-video:get-video-size-callback");
                            this.resizeVideo(org_size);
                        }
                    }

                    this.contextmenu_show = false;
                }
            },
            onkeyupTogglePlay(e) {
                if (e.keyCode === 32) {
                    player_obs.trigger("player-controls:play");
                }
            }
        };
    </script>    
</player-page>