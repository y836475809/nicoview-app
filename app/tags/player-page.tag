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
        const { remote, clipboard, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { BookMark } = window.BookMark;   
        const { getWatchURL } = window.NicoURL;  
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        
        const obs = this.opts.obs; 
        this.obs_open_video_form = riot.observable();

        const getPlayData = async () => {
            return await new Promise((resolve, reject) => {
                obs.trigger("player-main-page:get-play-data-callback", (args)=>{
                    resolve(args);
                });
            });
        };

        const getMenuEnable = (menu_id, data) => {
            const { title, thumbnailURL } = data;

            if(menu_id == "show-open-video-form"){
                return true;
            }

            if(menu_id == "copy-url"){
                return true;
            }

            if(menu_id == "reload"){
                return true;
            }

            if(!title || !thumbnailURL) {
                return false;
            }

            return true;
        };

        const createMenu = (self, play_data) => {
            const menu_templete = [
                { 
                    id: "add-bookmark",
                    label: "ブックマーク", click() {
                        const { video_id, title } = play_data;
                        const bk_item = BookMark.createVideoItem(title, video_id);
                        obs.trigger("player-main-page:add-bookmark", bk_item);
                    }
                },
                { 
                    id: "add-bookmark-time",
                    label: "ブックマーク(時間)", click() {
                        const { video_id, title } = play_data;
                        obs.trigger("player-video:get-current-time-callback", (current_time)=>{
                            const bk_item = BookMark.createVideoItem(title, video_id, current_time);
                            obs.trigger("player-main-page:add-bookmark", bk_item);                            
                        });
                    }
                },
                { label: "後で見る", click() {
                    const { video_id, title, thumbnailURL } = play_data;
                    obs.trigger("player-main-page:add-stack-items", 
                        {
                            items:[{
                                id: video_id,
                                name: title, 
                                thumb_img:thumbnailURL
                            }]
                        });
                }},
                { type: "separator" },
                { 
                    id: "add-download",
                    label: "ダウンロードに追加", click() {
                        const { video_id, title, thumbnailURL } = play_data;
                        const item = {
                            thumb_img: thumbnailURL,
                            id: video_id,
                            name: title,
                            state: 0
                        };
                        obs.trigger("player-main-page:add-download-item", item);
                    }
                },   
                { type: "separator" },
                { 
                    id: "copy-url",
                    label: "urlをコピー", click() {
                        const { video_id } = play_data;
                        const url = getWatchURL(video_id);
                        clipboard.writeText(url);
                    }
                },
                { type: "separator" },
                { 
                    id: "show-open-video-form",
                    label: "動画ID/URLを指定して再生", click() {
                        self.obs_open_video_form.trigger("show");
                    }
                },               
                { type: "separator" },
                { 
                    id: "reload",
                    label: "再読み込み", click() {
                        const { video_id, online } = play_data;
                        ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                            video_id: video_id,
                            time: 0,
                            online:online
                        });
                    }
                },
            ];
            return Menu.buildFromTemplate(menu_templete);
        };
    
        let contextmenu_show = false;
        this.oncontextmenu = async (e) => {
            // コンテキストメニュー表示後の画面クリックでは再生/停止しない
            if(e.button===0 && !contextmenu_show){   
                obs.trigger("player-controls:play");
            }

            if(e.button===2){
                const play_data = await getPlayData();
                const context_menu = createMenu(this, play_data);
                context_menu.items.forEach(menu => {
                    const id = menu.id;
                    menu.enabled = getMenuEnable(id, play_data);
                });
                context_menu.addListener("menu-will-show", () => {
                    contextmenu_show = true;
                });
                context_menu.addListener("menu-will-close", () => {
                    setTimeout(()=>{
                        contextmenu_show = false;
                    }, 200); 
                });
                context_menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on("player-page:get-video-size-callback", (cb) => { 
            const elm = this.root.querySelector(".video-container");
            cb({ 
                width: elm.offsetWidth,
                height: elm.offsetHeight 
            });
        });

        this.onkeyupTogglePlay = (e) => {
            if (e.keyCode === 32) {
                obs.trigger("player-controls:play");
            }
        };
    </script>    
</player-page>