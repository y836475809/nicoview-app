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
        const { remote, clipboard } = window.electron;
        const ipc = window.electron.ipcRenderer;
        const { Menu } = remote;
        const { getWatchURL } = window.NicoURL;  
        const { toTimeString } = window.TimeFormat;
        
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

        const resizeVideo = (org_size) => {
            const elm = this.root.querySelector(".video-container");
            const dw = org_size.width - elm.offsetWidth;
            const dh = org_size.height - elm.offsetHeight;
            window.resizeBy(dw, dh);
        };

        const createContextMenu = async (self) => {
            const play_data = await getPlayData();

            const menu_items = [
                { 
                    id: "add-bookmark",
                    label: "ブックマーク", click() {
                        const { video_id, title } = play_data;
                        obs.trigger("player-main-page:add-bookmark", {
                            title: title,
                            id: video_id,
                            time: 0
                        });
                    }
                },
                { 
                    id: "add-bookmark-time",
                    label: "ブックマーク(時間)", click() {
                        const { video_id, title } = play_data;
                        obs.trigger("player-video:get-current-time-callback", (current_time)=>{
                            obs.trigger("player-main-page:add-bookmark", {
                                title: title,
                                id: video_id,
                                time: current_time
                            });
                        });
                    }
                },
                { label: "後で見る", async click() {
                    const { video_id, title, thumbnailURL } = play_data;
                    const time = await getCurrentPlayTime();
                    obs.trigger("player-main-page:add-stack-items", 
                        {
                            items:[{
                                id: video_id,
                                title: title, 
                                thumb_img:thumbnailURL,
                                time: time
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
                            title: title,
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
                        ipc.send("app:play-video", {
                            video_id: video_id,
                            time: 0,
                            online:online
                        });
                    }
                },
                { type: "separator" },
                {
                    label: "動画のサイズに変更",
                    click: () => {
                        obs.trigger("player-video:get-video-size-callback",(args)=>{
                            const org_size = args;
                            resizeVideo(org_size);
                        });
                    }
                },
                { type: "separator" },
                {
                    label: "ヘルプ",
                    submenu: [
                        { role: "reload" },
                        { role: "forcereload" },
                        { role: "toggledevtools" },
                    ]
                } 
            ];
            
            menu_items.forEach(menu_item => {
                const id = menu_item.id;
                menu_item.enabled = getMenuEnable(id, play_data);
            });

            return Menu.buildFromTemplate(menu_items);
        };

        const createVideoItemsContextMenu = async () => {
            const createMenuItems = (items) => {
                return items.map(item=>{
                    const { id, title, time } = item;
                    const getTitle = () => {
                        if(time){
                            return `[${toTimeString(time)}] ${title}`;
                        }else{
                            return title;
                        } 
                    };
                    return { 
                        label: getTitle(), click() {
                            ipc.send("app:play-video", {
                                video_id: id,
                                time: time?time:0,
                                online: false
                            });
                        }
                    };
                });
            };

            const history_num = await ipc.invoke("config:get", { key: "player.contextmenu.history_num", value: 5 });
            const stack_num = await ipc.invoke("config:get", { key: "player.contextmenu.stack_num", value: 5 });
            const history_items = (await ipc.invoke("history:getItems")).slice(1, history_num+1);
            const stack_items = (await ipc.invoke("stack:getItems")).slice(0, stack_num);
            
            const menu_items = createMenuItems(history_items);
            if(stack_items.length > 0){
                menu_items.push({ type: "separator" });
                Array.prototype.push.apply(menu_items, createMenuItems(stack_items));
            }
            return Menu.buildFromTemplate(menu_items.concat());
        };
    
        let contextmenu_show = false;
        const popupContextMenu = (context_menu) => {
            context_menu.addListener("menu-will-show", () => {
                contextmenu_show = true;
            });
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    contextmenu_show = false;
                }, 200); 
            });     
            context_menu.popup({window: remote.getCurrentWindow()});
        };

        this.oncontextmenu = async (e) => {
            // コンテキストメニュー表示後の画面クリックでは再生/停止しない
            if(e.button===0 && !contextmenu_show){   
                obs.trigger("player-controls:play");
            }

            if(e.button === 1){
                const context_menu = await createVideoItemsContextMenu();
                popupContextMenu(context_menu);
            }

            if(e.button===2){
                const context_menu = await createContextMenu(this);
                popupContextMenu(context_menu);
            }
        };

        this.onkeyupTogglePlay = (e) => {
            if (e.keyCode === 32) {
                obs.trigger("player-controls:play");
            }
        };
    </script>    
</player-page>