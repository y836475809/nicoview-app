<player-main-page onmousemove={mousemove} onmouseup={mouseup}>
    <style scoped>
        :scope {
            display: flex;
            height: 100%;
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

    <div id="player-frame" class="split left">
        <player-page obs={this.opts.obs} ref="player_frame"></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div id="viewinfo-frame" class="split right">
        <player-viewinfo-page obs={this.opts.obs} ref="viewinfo_frame" sync_comment_checked={this.sync_comment_checked}>
        </player-viewinfo-page>
    </div>

    <modal-dialog obs={obs_modal_dialog} oncancel={this.onCancelSearch}></modal-dialog>
    <comment-setting-dialog obs={this.opts.obs}></comment-setting-dialog>

    <script>
        /* globals rootRequire riot */
        const path = require("path");
        const {remote} = require("electron");
        const { ipcRenderer } = require("electron");
        const { IPC_CHANNEL } = rootRequire("app/js/ipc-channel");
        const { Menu, MenuItem } = remote;
        const { ConfigRenderer } = rootRequire("app/js/config");
        const { NicoPlay } = rootRequire("app/js/nico-play");
        const { CommentNG, CommentDisplayAmount } = rootRequire("app/js/comment-filter");
        const { toTimeSec } = rootRequire("app/js/time-format");
        const { showMessageBox } = rootRequire("app/js/remote-dialogs");
        const { NicoVideoData } = rootRequire("app/js/nico-data-file");

        const obs = this.opts.obs;
        this.obs_modal_dialog = riot.observable();
        const config_renderer = new ConfigRenderer();

        let comment_ng = null;
        let nico_play = null;

        let org_video_size = null;
        let gutter = false;
        let gutter_move = false;

        this.mousemove = (e) => {
            if(gutter){   
                gutter_move = true;  
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
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
        this.mouseup = (e) => {
            if(gutter_move){
                obs.trigger("player-video:reset-comment-timelime");
                obs.trigger("player-viewinfo-page:split-resized");
            }
            gutter = false;
            gutter_move = false;
        };

        const resizeVideo = (size) => { 
            const h = this.refs.player_frame.getTagsPanelHeight() 
                    + this.refs.player_frame.getControlPanelHeight();
            const pf_elm = document.getElementById("player-frame");

            const dh = size.height + h - pf_elm.offsetHeight;
            const new_height = window.outerHeight + dh;

            const dw = size.width - pf_elm.offsetWidth;
            const new_width = window.outerWidth + dw;

            window.resizeTo(new_width, new_height);
        };

        let template = [
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
            }           
        ];
        if(process.env.NODE_ENV == "DEBUG"){
            template.push({
                label: "ツール",
                submenu: [
                    { role: "reload" },
                    { role: "forcereload" },
                    { role: "toggledevtools" },
                ]
            });
        }else{
            template.push({
                label: "ツール",
                submenu: [
                    { role: "toggledevtools" },
                ]
            });
        }
        const menu = Menu.buildFromTemplate(template);
        remote.getCurrentWindow().setMenu(menu);

        let filter_comment_func = null; 
        const filterCommentsFunc = (comments, play_time_sec) => {
            const _comments = JSON.parse(JSON.stringify(comments));
            return async (comment_ng) => {
                const do_limit = await config_renderer.get("comment.do-limit", true);
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

            document.title = `${video.title}[${video.video_id}][${video.video_type}]`;            
            obs.trigger("player-controls:set-state", "play"); 
            obs.trigger("player-video:set-play-data", { 
                video_data: video_data,
                viewinfo: viewinfo,
                comments: filtered_comments,
                state: state
            });
            obs.trigger("player-tag:set-tags", thumb_info.tags);
            obs.trigger("player-viewinfo-page:set-viewinfo-data", { 
                viewinfo: viewinfo, 
                comments: filtered_comments,
                state: state
            });   
            
            const history_item = {
                id: video.video_id, 
                image: video.largeThumbnailURL, 
                name: video.title, 
                url: video_data.src
            };
            ipcRenderer.send(IPC_CHANNEL.ADD_PLAY_HISTORY, history_item);
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
                    console.log(state);
                    const msg = play_msg_map.get(state);
                    this.obs_modal_dialog.trigger("update-message", msg);
                });
                nico_play.on("cancelHeartBeat", ()=>{
                    console.log("hb canceled");
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
                console.log(error);
                if(!error.cancel){
                    await showMessageBox("error", error.message);
                }

                this.obs_modal_dialog.trigger("close");
            }
        }; 
        
        const playNiconico = async (video_id, is_online, time=0) => {
            cancelPlay();

            const video_item = await ipcRenderer.invoke(IPC_CHANNEL.GET_VIDEO_ITEM, video_id);
            const state = { 
                is_online: video_item === null?true:is_online,
                is_saved: video_item !== null,
                time: time
            };
            try {
                //play online
                if(state.is_online===true){
                    play_by_video_id(video_id, state);
                }else{
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
                }                   
            } catch (error) {
                console.error(error);
                await showMessageBox("error", error.message);
            }
        }; 

        ipcRenderer.on(IPC_CHANNEL.PLAY_BY_VIDEO_ID, (event, args) => {
            const { video_id, time, is_online } = args;

            playNiconico(video_id, is_online, time);
        });

        obs.on("player-main-page:play-by-videoid", async (args) => {
            const { video_id, time } = args;
            const is_online = false;

            playNiconico(video_id, is_online, time);
        });

        obs.on("player-main-page:play-by-videoid-online", (args) => {
            const { video_id, time } = args;
            const is_online = true;

            if(process.env.NODE_ENV == "DEBUG"){
                const state = {
                    is_online: true,
                    is_saved: false,
                    time: time
                };
                cancelPlay();
                play_by_video_id(video_id, state);   
            }else{
                playNiconico(video_id, is_online, time);
            }
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

        obs.on("player-main-page:test-play-by-data", async (arg) => {
            cancelPlay();

            const { video_data, viewinfo, comments, state } = arg;
            await play_by_video_data(video_data, viewinfo, comments, state);
        });

        obs.on("player-main-page:update-data", async(video_id, update_target) => {
            console.log("player main update video_id=", video_id);
            this.obs_modal_dialog.trigger("show", {
                message: "更新中...",
                buttons: ["cancel"],
                cb: result=>{
                    console.log("player main cancel update video_id=", video_id);
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
            obs.trigger("player-viewinfo-page:set-viewinfo-data", { 
                viewinfo: viewinfo, 
                comments: filtered_comments 
            });   

            obs.trigger("player-video:update-comments", filtered_comments);

            this.obs_modal_dialog.trigger("close");
            console.log("player main prog_dialog.close update video_id=", video_id);
        });

        obs.on("player-main-page:add-comment-ng", async (args) => {
            comment_ng.addNG(args);
            try {
                comment_ng.save();
            } catch (error) {
                console.log("error comment_ng: ", error);
            }

            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-viewinfo-page:update-comments", comments);
        });

        obs.on("player-main-page:delete-comment-ng", async (args) => {
            comment_ng.deleteNG(args);
            try {
                comment_ng.save();
            } catch (error) {
                console.log("error comment_ng: ", error);
            }

            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-viewinfo-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-limit", async (args) => {
            const comments = await filter_comment_func(comment_ng);
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-viewinfo-page:update-comments", comments);
        });

        obs.on("player-main-page:update-comment-display-params", (args) => {
            obs.trigger("player-video:update-comment-display-params", args);
        });

        this.on("mount", async () => {
            const params = await config_renderer.get("player", {
                "sync-comment": false,
                "infoview-width": 200
            }); 
            this.player_default_size = { width: 854 ,height: 480 };
            this.sync_comment_checked = params["sync-comment"];
            const vw = params["infoview-width"];
            if(vw){
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }

            try {
                comment_ng = new CommentNG(path.join(await config_renderer.get("data-dir"), "nglist.json"));
                comment_ng.load();
            } catch (error) {
                console.log("comment ng load error=", error);
            }

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
            obs.trigger("player-page:window-resizing");

            clearTimeout(timer);
            timer = setTimeout(() => {
                resize_begin = false;
                obs.trigger("window-resized");    
            }, timeout);
        });

        window.onbeforeunload = (e) => {
            cancelPlay();

            const ve = document.getElementById("viewinfo-frame");  
            config_renderer.set("player", {
                "sync-comment": this.refs.viewinfo_frame.getSyncCommentChecked(),
                "infoview-width": parseInt(ve.offsetWidth)
            });
        };
    </script>
</player-main-page>