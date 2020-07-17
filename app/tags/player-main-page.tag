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
        <player-info-page obs={opts.obs}>
        </player-info-page>
    </div>

    <modal-dialog obs={obs_modal_dialog} oncancel={onCancelSearch}></modal-dialog>
    <player-setting-dialog obs={opts.obs}></player-setting-dialog>

    <script>
        /* globals riot logger */
        const path = window.path;
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;  
        const { NicoPlay } = window.NicoPlay;
        const { NicoUpdate } = window.NicoUpdate;
        const { CommentFilter } = window.CommentFilter;
        const { toTimeSec } = window.TimeFormat;
        const { showMessageBox } = window.RendererDailog;
        const { NicoVideoData } = window.NicoVideoData;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs;
        this.obs_modal_dialog = riot.observable();

        let comment_filter = null;
        let nico_play = null;
        let play_data = null;

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
                await IPCClient.request("config", "set", { 
                    key:"player.infoview_width",
                    value: parseInt(ve.offsetWidth)
                });
            }
            gutter = false;
            gutter_move = false;
        };

        const play_by_video_data = async (video_data, viewinfo, comments, state) => { 
            
            if(!/mp4/.test(video_data.type)){
                throw new Error(`${video_data.type}形式は再生できません`);
            }

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const play_time_sec = toTimeSec(video.duration);

            play_data = {
                video_id: video.video_id, 
                title: video.title,
                thumbnailURL: video.thumbnailURL,
                online: state.is_online
            };

            comment_filter.setComments(comments);
            comment_filter.setPlayTime(play_time_sec);
            const filtered_comments = comment_filter.getCommnets();          

            const title = `${video.title}[${video.video_id}][${video.video_type}]`;
            document.title = title;
            obs.trigger("player-window-titlebar:set-title", {title});
            obs.trigger("player-controls:set-state", "play"); 
            obs.trigger("player-video:set-play-data", { 
                video_data: video_data,
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
                title: video.title, 
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
                    is_economy: video_data.getIsEconomy(),
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

        const playVideoOnline = async (video_id, time, is_saved) => {
            cancelPlay();

            const state = { 
                is_online: true,
                is_saved: is_saved,
                time: time
            };

            try {
                nico_play = new NicoPlay();

                this.obs_modal_dialog.trigger("show", {
                    message: "...",
                    buttons: ["cancel"],
                    cb: result=>{
                        cancelPlay();
                    }
                });

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

                const {is_economy, is_deleted, cookies, comments, thumb_info, video_url} = 
                    await nico_play.play(video_id);
                const ret = await ipcRenderer.invoke(IPC_CHANNEL.SET_COOKIE, cookies);
                if(ret!="ok"){
                    throw new Error(`error: cookieの設定に失敗 ${video_id}`);
                } 
                const video_data = {
                    src: video_url,
                    type: `video/${thumb_info.video.video_type}`,
                };
                const viewinfo = {
                    is_economy: is_economy,
                    is_deleted: is_deleted,
                    thumb_info:thumb_info,
                };
                comments.sort((a, b) => {
                    if (a.vpos < b.vpos) return -1;
                    if (a.vpos > b.vpos) return 1;
                    return 0;
                });
                await play_by_video_data(video_data, viewinfo, comments, state);      
            } catch (error) {
                if(!error.cancel){
                    logger.error(`id=${video_id}, online=${state.is_online}, is_saved=${state.is_saved}`, error);
                    await showMessageBox("error", error.message);
                }
            }

            this.obs_modal_dialog.trigger("close");
        }; 
  
        ipcRenderer.on(IPC_CHANNEL.PLAY_VIDEO, async (event, args) => {
            const { video_id, online, time, video_item } = args;

            play_data = { 
                video_id: video_id, 
                title: null,
                thumbnailURL: null,
                online: online
            };

            obs.trigger("player-window-titlebar:set-title", { title:video_id });

            if(!video_item || online){
                const is_saved = video_item !== null;
                await playVideoOnline(video_id, time, is_saved);
            }else{
                await playVideoItem(video_item, time);
            }
        });

        ipcRenderer.on(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        obs.on("player-main-page:get-play-data-callback", (cb) => {
            cb(play_data);
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

        obs.on("player-main-page:add-stack-items", (args) => {
            ipcRenderer.send(IPC_CHANNEL.ADD_STACK_ITEMS, args);
        });
  
        obs.on("player-main-page:update-data", async(video_id, update_target) => {
            logger.debug("player main update video_id=", video_id);
            const nico_update = new NicoUpdate();

            this.obs_modal_dialog.trigger("show", {
                message: "更新中...",
                buttons: ["cancel"],
                cb: result=>{
                    if(nico_update){
                        nico_update.cancel();
                    }
                }
            });

            nico_update.on("updated", async (video_id, props, update_thumbnail) => {
                try {
                    await IPCClient.request("library", "update", {video_id, props});
                    const updated_video_item = await IPCClient.request("library", "getItem", {video_id});
                    const video_data = new NicoVideoData(updated_video_item);
                    const viewinfo = {
                        is_economy: video_data.getIsEconomy(),
                        is_deleted: video_data.getIsDeleted(),
                        thumb_info: video_data.getThumbInfo()
                    };

                    comment_filter.setComments(video_data.getComments());
                    comment_filter.setPlayTime(updated_video_item.play_time);
                    const filtered_comments = comment_filter.getCommnets();

                    obs.trigger("player-tag:set-tags", viewinfo.thumb_info.tags);
                    obs.trigger("player-info-page:set-viewinfo-data", {
                        viewinfo: viewinfo, 
                        comments: filtered_comments 
                    });

                    obs.trigger("player-video:update-comments", filtered_comments);
                } catch (error) {
                    if(!error.cancel){
                        logger.error(error);
                        await showMessageBox("error", error.message);
                    }
                }
                this.obs_modal_dialog.trigger("close");
            });

            try {   
                const video_item = await IPCClient.request("library", "getItem", {video_id});
                nico_update.setVideoItem(video_item);

                if(update_target=="thumbinfo"){
                    await nico_update.updateThumbInfo();
                }else if(update_target=="comment"){
                    await nico_update.updateComment();
                }else{
                    throw new Error(`${update_target} is unknown`);
                }
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await showMessageBox("error", error.message);
                }
                this.obs_modal_dialog.trigger("close");
            }
        });

        obs.on("player-main-page:add-ng-comment", async (args) => {
            const { ng_texts, ng_user_ids } = args;

            comment_filter.ng_comment.addNGTexts(ng_texts);
            comment_filter.ng_comment.addNGUserIDs(ng_user_ids);
            try {
                comment_filter.ng_comment.save();
            } catch (error) {
                logger.error("player main save ng comment", error);
                await showMessageBox("error", `NGコメントの保存に失敗\n${error.message}`);
            }

            const comments = comment_filter.getCommnets();
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:delete-ng-comment", async (args) => {
            const { ng_texts, ng_user_ids } = args;

            comment_filter.ng_comment.deleteNGTexts(ng_texts);
            comment_filter.ng_comment.deleteNGUserIDs(ng_user_ids);
            try {
                comment_filter.ng_comment.save();
            } catch (error) {
                logger.error("player main save comment ng", error);
                await showMessageBox("error", `NGコメントの保存に失敗\n${error.message}`);
            }

            const comments = comment_filter.getCommnets();
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-limit", (args) => {
            const { do_limit } = args;

            comment_filter.setLimit(do_limit);
            const comments = comment_filter.getCommnets();
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-info-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-params", (args) => {
            obs.trigger("player-video:update-comment-display-params", args);
        });

        obs.on("player-main-page:sync-comment-checked", async (args) => {
            const checked = args;
            await IPCClient.request("config", "set", { 
                key:"player.sync_comment",
                value: checked
            });
        });

        obs.on("player-main-page:show-player-setting-dialog", () => {
            obs.trigger("player-setting-dialog:show", {
                ng_items : comment_filter.ng_comment.getNGItems(),
            });
        });

        obs.on("player-main-page:toggle-infoview", async () => {
            await toggleInfoview();
        });

        const resizeVideo = (size) => { 
            obs.trigger("player-page:get-video-size-callback", (args) => {
                const { width, height } = args;

                const dw = size.width - width;
                const dh = size.height - height;
                window.resizeBy(dw, dh);
            });
        };

        let stop_resize_event = false;
        const toggleInfoview = async () => {
            const pe = this.root.querySelector(".player-frame");
            const ve = this.root.querySelector(".info-frame");

            const infoview_show = parseInt(ve.style.width) == 0;
            await IPCClient.request("config", "set", { 
                key:"player.infoview_show",
                value: infoview_show
            });

            // 動画情報の表示/非表示の切り替え時はウィンドウリサイズイベントを通知しない
            // (動画表示部分のサイズは変更されないのでリサイズイベント不要)
            stop_resize_event = true;

            if(infoview_show){
                // 表示
                const infoview_width = await IPCClient.request("config", "get", { 
                    key:"player.infoview_width",
                    value: 200
                });
                // 動画サイズがウィンドウサイズに合わせて変化しないように
                // 動画の幅を固定してからウィンドウサイズ変更
                pe.style.width = pe.offsetWidth + "px";  
                window.resizeBy(infoview_width, 0);

                setTimeout(() => {
                    // 動画サイズを可変に戻す
                    ve.style.width = infoview_width + "px";
                    pe.style.width = `calc(100% - ${infoview_width}px)`;

                    // 非表示->表示の場合はコメントリストをリサイズする
                    obs.trigger("player-info-page:split-resized");
                    stop_resize_event = false;
                },100); 
            }else{
                // 非表示
                const infoview_width = 0;
                pe.style.width = pe.clientWidth + "px";   
                window.resizeBy(-parseInt(ve.style.width), 0);

                ve.style.width = infoview_width + "px";
                setTimeout(() => {    
                    pe.style.width = `calc(100% - ${infoview_width}px)`;
                    stop_resize_event = false;
                },100); 
            }
        };

        const menu_template = [
            {   
                label: "標準サイズに変更",
                click: () => {
                    resizeVideo(this.player_default_size);
                }
            },
            {
                label: "動画のサイズに変更",
                click: () => {
                    if(org_video_size){
                        resizeVideo(org_video_size);
                    }
                }
            },
            { type: "separator" },
            {
                label: "動画情報の表示/非表示",
                click: async () => {
                    await toggleInfoview();
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

        this.on("mount", async () => {
            const params = await IPCClient.request("config", "get", 
                { 
                    key:"player", 
                    value:{ 
                        sync_comment: false, 
                        infoview_width: 200, 
                        infoview_show: true 
                    } 
                });
                
            const vw = params.infoview_show ? params.infoview_width : 0;
            const pe = this.root.querySelector(".player-frame");
            const ve = this.root.querySelector(".info-frame");
            pe.style.width = `calc(100% - ${vw}px)`;
            ve.style.width = vw + "px"; 

            this.player_default_size = { width: 854 ,height: 480 };
            
            obs.trigger("player-info-page:sync-comment-checked", params.sync_comment);

            try {
                const data_dir = await IPCClient.request("config", "get", { key:"data_dir", value:"" });
                const do_limit = await IPCClient.request("config", "get", { key:"comment.do_limit", value:true });
                comment_filter = new CommentFilter(path.join(data_dir, "nglist.json"));
                comment_filter.setLimit(do_limit);
                comment_filter.ng_comment.load();
            } catch (error) {
                logger.error("player main load ng comment", error);
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
            if(stop_resize_event){
                return;
            }

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