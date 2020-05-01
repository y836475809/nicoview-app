<player-main-page onmousemove={mousemove} onmouseup={mouseup}>
    <style scoped>
        :scope {
            display: flex;
            height: calc(100% - var(--window-titlebar-height));
            --right-width: 300px;
            overflow: hidden;
        }
    
        .gutter {
            cursor: col-resize;
            width: 4px;
            border-left: 1px solid var(--control-border-color);
        }
    
        .split.left{
            margin: 0;
            width: calc(100% - var(--right-width));
        }

        .split.right{
            margin: 0;
            width: var(--right-width);
            height: 100%;
        }
    </style>

    <div class="player-frame split left">
        <player-page obs={opts.obs}></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div class="info-frame split right">
        <player-info-page obs={opts.obs} sync_comment_checked={sync_comment_checked}>
        </player-info-page>
    </div>

    <modal-dialog obs={obs_modal_dialog} oncancel={onCancelSearch}></modal-dialog>
    <comment-setting-dialog obs={opts.obs}></comment-setting-dialog>

    <script>
        /* globals riot logger */
        const path = window.path;
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;  
        const { NicoPlay } = window.NicoPlay;
        const { CommentNG, CommentDisplayAmount } = window.CommentFilter;
        const { toTimeSec } = window.TimeFormat;
        const { showMessageBox } = window.RemoteDailog;
        const { NicoVideoData } = window.NicoVideoData;
        const { DataIpcRenderer } = window.DataIpc;

        const obs = this.opts.obs;
        this.obs_modal_dialog = riot.observable();

        let comment_ng = null;
        let nico_play = null;

        let org_video_size = null;
        let gutter = false;
        let gutter_move = false;

        this.mousemove = (e) => {
            if(gutter){   
                gutter_move = true;  
                let pe = this.root.querySelector(".player-frame");
                let ve = this.root.querySelector(".info-frame");
                const mw = this.root.offsetWidth - e.clientX;
                ve.style.width = mw + "px";
                pe.style.width = `calc(100% - ${mw}px)`;
            }
        };
        this.mousedown = (e) => {
            if(e.which===1){
                gutter = true;     
            }
        };
        this.mouseup = async (e) => {
            if(gutter_move){
                obs.trigger("player-video:reset-comment-timelime");
                obs.trigger("player-info-page:split-resized");

                const ve = this.root.querySelector(".info-frame");
                await DataIpcRenderer.action("config", "set", { 
                    key:"player.infoview_width",
                    value: parseInt(ve.offsetWidth)
                });
            }
            gutter = false;
            gutter_move = false;
        };

        let filter_comment_func = null; 
        const filterCommentsFunc = (comments, play_time_sec) => {
            const _comments = JSON.parse(JSON.stringify(comments));
            return async (comment_ng) => {
                const do_limit = await DataIpcRenderer.action("config", "get", { key:"comment.do_limit", value:true });
                if(do_limit===true){
                    const comment_display = new CommentDisplayAmount();
                    const dp_comments = comment_display.getDisplayed(_comments, play_time_sec); 
                    return comment_ng.getComments(dp_comments); 
                }else{
                    return comment_ng.getComments(_comments); 
                }
            };
        };

        const play_by_video_data = async (video_data, viewinfo, comments, state) => { 
            
            if(!/mp4/.test(video_data.type)){
                throw new Error(`${video_data.type}形式は再生できません`);
            }

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const play_time_sec = toTimeSec(video.duration);

            filter_comment_func = filterCommentsFunc(comments, play_time_sec);
            const filtered_comments = await filter_comment_func(comment_ng);

            const title = `${video.title}[${video.video_id}][${video.video_type}]`;
            document.title = title;
            obs.trigger("player-window-titlebar:set-title", {title});
            obs.trigger("player-controls:set-state", "play"); 
            obs.trigger("player-video:set-play-data", { 
                video_data: video_data,
                viewinfo: viewinfo,
                comments: filtered_comments,
                state: state
            });
            obs.trigger("player-tag:set-tags", thumb_info.tags);
            obs.trigger("player-info-page:set-viewinfo-data", { 
                viewinfo: viewinfo, 
                comments: filtered_comments,
                state: state
            });   
            
            const history_item = {
                id: video.video_id, 
                image: video.thumbnailURL, 
                name: video.title, 
                url: video_data.src
            };
            ipcRenderer.send(IPC_CHANNEL.ADD_PLAY_HISTORY, {history_item});
        }; 

        const cancelPlay = () => {
            if(nico_play){
                nico_play.cancel();
            }
        };

        const play_msg_map = new Map([
            ["startWatch", "watch取得開始"],
            ["finishWatch", "watch取得完了"],
            ["startComment", "コメント取得開始"],
            ["finishComment", "コメント取得完了"],
            ["startPlayVideo", "再生開始"],
            ["startPlaySmile", "smile再生開始"],
            ["startHeartBeat", "HeartBeat開始"],
        ]);

        const play_by_video_id = async (video_id, state) => {
            nico_play = new NicoPlay();

            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    nico_play.cancel();
                }
            });

            try {
                nico_play.on("changeState", (state)=>{
                    logger.debug("player main changeState state=", state);
                    const msg = play_msg_map.get(state);
                    this.obs_modal_dialog.trigger("update-message", msg);
                });
                nico_play.on("cancelHeartBeat", ()=>{
                    logger.debug("player main HeartBeat cancel");
                });
                nico_play.on("errorHeartBeat", (error)=>{
                    throw error;
                });

                const {is_deleted, nico_cookies, comments, thumb_info, video_url} = 
                    await nico_play.play(video_id);
                const ret = await ipcRenderer.invoke(IPC_CHANNEL.SET_COOKIE, nico_cookies);
                if(ret!="ok"){
                    throw new Error(`error: cookieの設定に失敗 ${video_id}`);
                } 
                const video_data = {
                    src: video_url,
                    type: `video/${thumb_info.video.video_type}`,
                };
                const viewinfo = {
                    is_deleted: is_deleted,
                    thumb_info:thumb_info,
                };
                comments.sort((a, b) => {
                    if (a.vpos < b.vpos) return -1;
                    if (a.vpos > b.vpos) return 1;
                    return 0;
                });
                await play_by_video_data(video_data, viewinfo, comments, state);

                this.obs_modal_dialog.trigger("close");       
            } catch (error) {
                logger.error(error);
                if(!error.cancel){
                    await showMessageBox("error", error.message);
                }

                this.obs_modal_dialog.trigger("close");
            }
        }; 

        const playVideoItem = async (video_item, time=0) => {
            cancelPlay();

            const state = { 
                is_online: false,
                is_saved: true,
                time: time
            };
            try {
                const video_data = new NicoVideoData(video_item);
                const video = {
                    src: video_data.getVideoPath(),
                    type: `video/${video_data.getVideoType()}`,
                };
                const viewinfo = {
                    is_deleted: video_data.getIsDeleted(),
                    thumb_info: video_data.getThumbInfo()      
                };      
                const comments = video_data.getComments();
                await play_by_video_data(video, viewinfo, comments, state);
            } catch (error) {
                logger.error(`id=${video_item.id}, online=${state.is_online}, is_saved=${state.is_saved}`, error);
                await showMessageBox("error", error.message);
            }
        }; 

        const playNiconicoOnline = async (video_id, video_item, time=0) => {
            cancelPlay();

            const state = { 
                is_online: true,
                is_saved: video_item !== null,
                time: time
            };
            try {
                play_by_video_id(video_id, state);               
            } catch (error) {
                logger.error(`id=${video_id}, online=${state.is_online}, is_saved=${state.is_saved}`, error);
                await showMessageBox("error", error.message);
            }
        }; 

        ipcRenderer.on(IPC_CHANNEL.PLAY_BY_VIDEO_DATA, async (event, args) => {
            const { video_id, video_item, time } = args;

            await playVideoItem(video_item, time);
        });

        ipcRenderer.on(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, (event, args) => {
            const { video_id, video_item, time } = args;

            playNiconicoOnline(video_id, video_item, time);
        });

        ipcRenderer.on(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        obs.on("player-main-page:metadata-loaded", (args) => {
            org_video_size = args;
        });

        obs.on("player-main-page:search-tag", (args) => {
            ipcRenderer.send(IPC_CHANNEL.SEARCH_TAG, args);
        });

        obs.on("player-main-page:load-mylist", (args) => {
            ipcRenderer.send(IPC_CHANNEL.LOAD_MYLIST, args);
        });

        obs.on("player-main-page:add-bookmark", (args) => {
            ipcRenderer.send(IPC_CHANNEL.ADD_BOOKMARK, args);
        });

        obs.on("player-main-page:add-download-item", (args) => {
            ipcRenderer.send(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, args);
        });

        obs.on("player-main-page:update-data", async(video_id, update_target) => {
            logger.debug("player main update video_id=", video_id);
            this.obs_modal_dialog.trigger("show", {
                message: "更新中...",
                buttons: ["cancel"],
                cb: result=>{
                    logger.debug("player main update cancel video_id=", video_id);
                    ipcRenderer.send(IPC_CHANNEL.CANCEL_UPDATE_DATA, video_id);
                    this.obs_modal_dialog.trigger("close");
                }
            });

            const video_item = await ipcRenderer.invoke(IPC_CHANNEL.UPDATE_DATA, { video_id, update_target });
            const video_data = new NicoVideoData(video_item);
            const viewinfo = {
                is_deleted: video_data.getIsDeleted(),
                thumb_info: video_data.getThumbInfo()      
            }; 
            const play_time_sec = video_item.play_time;

            const comments = video_data.getComments();              
            filter_comment_func = filterCommentsFunc(comments, play_time_sec);
            const filtered_comments = await filter_comment_func(comment_ng);

            obs.trigger("player-tag:set-tags", viewinfo.thumb_info.tags);
            obs.trigger("player-info-page:set-viewinfo-data", { 
                viewinfo: viewinfo, 
                comments: filtered_comments 
            });   

            obs.trigger("player-video:update-comments", filtered_comments);

            this.obs_modal_dialog.trigger("close");
            logger.info("player main update video_id=", video_id);
        });

        obs.on("player-main-page:add-comment-ng", async (args) => {
            comment_ng.addNG(args);
            try {
                comment_ng.save();
            } catch (error) {
                logger.error("player main save comment ng", error);
                await showMessageBox("error", `NGコメントの保存に失敗\n${error.message}`);
            }

            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:delete-comment-ng", async (args) => {
            comment_ng.deleteNG(args);
            try {
                comment_ng.save();
            } catch (error) {
                logger.error("player main save comment ng", error);
                await showMessageBox("error", `NGコメントの保存に失敗\n${error.message}`);
            }

            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-limit", async (args) => {
            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-params", (args) => {
            obs.trigger("player-video:update-comment-display-params", args);
        });

        obs.on("player-main-page:sync-comment-checked", async (args) => {
            const checked = args;
            await DataIpcRenderer.action("config", "set", { 
                key:"player.sync_comment",
                value: checked
            });
        });

        const resizeVideo = (size) => { 
            obs.trigger("player-page:get-video-size-callback", (args) => {
                const { width, height } = args;

                const dw = size.width - width;
                const dh = size.height - height;
                window.resizeBy(dw, dh);
            });
        };

        const menu_template = [
            {
                label: "表示",
                submenu: [
                    {
                        label: "標準サイズ",
                        click: () => {
                            resizeVideo(this.player_default_size);
                        }
                    },
                    {
                        label: "標準サイズx1.5",
                        click: () => {
                            const size = this.player_default_size;
                            resizeVideo({width: size.width * 1.5, height: size.height * 1.5});
                        }
                    },
                    {
                        label: "動画のサイズ",
                        click: () => {
                            if(org_video_size){
                                resizeVideo(org_video_size);
                            }
                        }
                    },
                ]
            },
            {
                label: "設定",
                submenu: [
                    {
                        label: "NG設定",
                        click: () => {
                            obs.trigger("comment-setting-dialog:show", {
                                ng_items : comment_ng.getNG(),
                                selected_tab: "comment-ng"
                            });
                        }
                    },
                    {
                        label: "コメント表示",
                        click: () => {
                            obs.trigger("comment-setting-dialog:show", {
                                ng_items : comment_ng.getNG(),
                                selected_tab: "comment-display"
                            });
                        }
                    }
                ]
            },
            {
                label: "ヘルプ",
                submenu: [
                    { role: "reload" },
                    { role: "forcereload" },
                    { role: "toggledevtools" },
                ]
            }         
        ];

        this.on("mount", async () => {
            const params = await DataIpcRenderer.action("config", "get", 
                { 
                    key:"player", 
                    value:{ sync_comment: false, infoview_width: 200 } 
                });
            this.player_default_size = { width: 854 ,height: 480 };
            this.sync_comment_checked = params.sync_comment;
            const vw = params.infoview_width;
            if(vw){
                let pe = this.root.querySelector(".player-frame");
                let ve = this.root.querySelector(".info-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }

            obs.trigger("player-info-page:sync-comment-checked", params.sync_comment);

            try {
                const data_dir = await DataIpcRenderer.action("config", "get", { key:"data_dir", value:"" });
                comment_ng = new CommentNG(path.join(data_dir, "nglist.json"));
                comment_ng.load();
            } catch (error) {
                logger.error("player main load comment ng", error);
                obs.trigger("player-page:toastr", {
                    type: "error",
                    title: "NGコメントリストの読み込み失敗",
                    message: error.message,
                });
            }

            const menu = Menu.buildFromTemplate(menu_template);
            obs.trigger("player-window-titlebar:set-menu", {menu});

            ipcRenderer.send(IPC_CHANNEL.READY_PLAYER);
        });   

        let resize_begin = false;
        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            if(resize_begin===false){
                resize_begin = true;
                obs.trigger("player-video:resize-begin");
            }

            clearTimeout(timer);
            timer = setTimeout(() => {
                resize_begin = false;
                obs.trigger("window-resized");    
            }, timeout);
        });
    </script>
</player-main-page>