<player-main-page onmousemove={mousemove} onmouseup={mouseup}>
    <style scoped>
        :scope {
            display: flex;
            height: 100%;
            --right-width: 300px;
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
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu, MenuItem, dialog} = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoPlay } = require(`${app_base_dir}/js/nico-play`);
        const { IPCMsg, IPCMonitor } = require(`${app_base_dir}/js/ipc-monitor`);
        const { CommentFilter } = require(`${app_base_dir}/js/comment-filter`);

        const obs = this.opts.obs;
        this.obs_modal_dialog = riot.observable();
        
        const ipc_monitor = new IPCMonitor();
        ipc_monitor.listenRemote();

        const comment_filter = new CommentFilter(SettingStore.getSettingFilePath("nglist.json"));

        let nico_play = null;

        let org_video_size = null;
        let gutter = false;
        let gutter_move = false;

        const pref_sync_comment = "player-sync-comment";
        const pref_default_size = "player-default-size";
        const pref_size = "player-size";
        const pref_infoview_width = "player-infoview-width";

        this.sync_comment_checked = SettingStore.getValue(pref_sync_comment, false);
        this.player_default_size = SettingStore.getValue(pref_default_size, { width: 854 ,height: 480 });

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

        let template = [{
            label: "View",
            submenu: [
                {
                    label: "x1",
                    click: () => {
                        resizeVideo(this.player_default_size);
                    }
                },
                {
                    label: "x1.5",
                    click: () => {
                        const size = this.player_default_size;
                        resizeVideo({width: size.width * 1.5, height: size.height * 1.5});
                    }
                },
                {
                    label: "orgnal size",
                    click: () => {
                        if(org_video_size){
                            resizeVideo(org_video_size);
                        }
                    }
                },
            ]
        },
        {
            label: "Tools",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools" },
            ]
        }];
        const menu = Menu.buildFromTemplate(template);
        remote.getCurrentWindow().setMenu(menu);

        const play_by_video_data = (video_data, viewinfo, comments) => {              
            comment_filter.setComments(comments);
            const filtered_comments = comment_filter.getComments();

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            document.title = `${video.title}[${video.video_id}][${video.video_type}]`;
            obs.trigger("player-controls:set-state", "play"); 
            obs.trigger("player-video:set-play-data", { 
                video_data: video_data, 
                comments: filtered_comments 
            });
            obs.trigger("player-tag:set-tags", thumb_info.tags);
            obs.trigger("player-viewinfo-page:set-viewinfo-data", { 
                viewinfo: viewinfo, 
                comments: filtered_comments });   
            
            const history_item = {
                id: video.video_id, 
                image: video.largeThumbnailURL, 
                name: video.title, 
                url: video_data.src
            };
            ipc_monitor.addPlayHistory(history_item);       
        }; 

        const cancelPlay = () => {
            if(nico_play){
                nico_play.cancel();
            }
        };

        const play_by_video_id = async (video_id) => {
            nico_play = new NicoPlay();

            this.obs_modal_dialog.trigger("show", {
                message: "...",
                buttons: ["cancel"],
                cb: result=>{
                    nico_play.cancel();
                }
            });

            try {
                const {is_deleted, nico_cookies, comments, thumb_info, video_url} = 
                    await nico_play.play(video_id, (state)=>{
                        this.obs_modal_dialog.trigger("update-message", state);
                        console.log(state);
                    }, (error)=>{
                        if(error.cancel){
                            console.log("hb canceled");
                        }else{
                            throw error;
                        }
                    });
                const ret = ipc_monitor.setCookieSync(nico_cookies);
                if(ret!="ok"){
                    throw new Error(`error: fault set nicohistory ${video_id}`);
                } 
                const video_data = {
                    src: video_url,
                    type: `video/${thumb_info.video.video_type}`,
                };
                const viewinfo = {
                    is_deleted: is_deleted,
                    is_local: false,
                    thumb_info:thumb_info,
                };
                comments.sort((a, b) => {
                    if (a.vpos < b.vpos) return -1;
                    if (a.vpos > b.vpos) return 1;
                    return 0;
                });
                play_by_video_data(video_data, viewinfo, comments);

                this.obs_modal_dialog.trigger("close");       
            } catch (error) {
                console.log(error);
                if(!error.cancel){
                    dialog.showMessageBox(remote.getCurrentWindow(),{
                        type: "error",
                        buttons: ["OK"],
                        message: error.message
                    });
                }

                this.obs_modal_dialog.trigger("close");
            }
        }; 

        ipc_monitor.on(IPCMsg.PLAY, (event, args) => {
            cancelPlay();

            const { video_id, data } = args;
            if(data==null){
                play_by_video_id(video_id);
            }else{
                const { video_data, viewinfo, comments } = data;
                play_by_video_data(video_data, viewinfo, comments);
            }
        });

        obs.on("player-main-page:play-by-videoid", (video_id) => {
            ipc_monitor.playByID(video_id);
        });

        obs.on("player-main-page:search-tag", (args) => {
            ipc_monitor.searchTag(args);
        });

        obs.on("player-main-page:load-mylist", (args) => {
            ipc_monitor.loadMylist(args);
        });

        obs.on("player-main-page:test-play-by-data", (arg) => {
            cancelPlay();

            const { video_data, viewinfo, comments } = arg;
            play_by_video_data(video_data, viewinfo, comments);
        });
        obs.on("player-main-page:test-play-by-videoid", (video_id) => {
            cancelPlay();

            play_by_video_id(video_id);
        });

        obs.on("player-main-page:update-data", async(video_id) => {
            console.log("player main update video_id=", video_id);
            this.obs_modal_dialog.trigger("show", {
                message: "update...",
                buttons: ["cancel"],
                cb: result=>{
                    console.log("player main cancel update video_id=", video_id);
                    ipc_monitor.cancelUpdateData(video_id);
                }
            });

            await new Promise((resolve, reject) => {
                ipc_monitor.updateData(video_id);
                ipc_monitor.on(IPCMsg.RETURN_UPDATE_DATA, (event, args) => {
                    console.log("return-update-data result=", args);
                    resolve();   
                });
            });
            
            this.obs_modal_dialog.trigger("close");
            console.log("player main prog_dialog.close update video_id=", video_id);
        });

        obs.on("player-main-page:add-download-item", (args) => {
            ipc_monitor.addDonwloadItem(args);
        });

        obs.on("player-main-page:add-comment-ng", (args) => {
            comment_filter.addNG(args);
            try {
                comment_filter.save();
            } catch (error) {
                console.log("error comment_filter: ", error);
            }

            const comments = comment_filter.getComments();
            comments.sort((a, b) => {
                if (a.vpos < b.vpos) return -1;
                if (a.vpos > b.vpos) return 1;
                return 0;
            });
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-viewinfo-page:update-comments", comments);
        });

        obs.on("player-main-page:delete-comment-ng", (args) => {
            comment_filter.deleteNG(args);
            try {
                comment_filter.save();
            } catch (error) {
                console.log("error comment_filter: ", error);
            }

            const comments = comment_filter.getComments();
            comments.sort((a, b) => {
                if (a.vpos < b.vpos) return -1;
                if (a.vpos > b.vpos) return 1;
                return 0;
            });
            obs.trigger("player-video:update-comments", comments);
            obs.trigger("player-viewinfo-page:update-comments", comments);
        });

        obs.on("player-main-page:show-comment-setting-dialog", () => {
            obs.trigger("comment-setting-dialog:show", comment_filter.getNG());
        });

        obs.on("player-main-page:update-comment-display-params", (args) => {
            obs.trigger("player-video:update-comment-display-params", args);
        });

        this.on("mount", () => {
            const vw = SettingStore.getValue(pref_infoview_width, 200);
            if(vw){
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }

            try {
                comment_filter.load();
            } catch (error) {
                console.log("comment ng load error=", error);
            }
        });   
  
        obs.on("player-main-page:metadata-loaded", (video_size) => {
            org_video_size =  video_size;
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

            const h = this.refs.player_frame.getTagsPanelHeight() 
                    + this.refs.player_frame.getControlPanelHeight();
            const pf_elm = document.getElementById("player-frame");
            const width = pf_elm.offsetWidth;
            const height = pf_elm.offsetHeight - h;

            const ve = document.getElementById("viewinfo-frame");  

            SettingStore.setValue(pref_size, { width: width, height: height });
            SettingStore.setValue(pref_infoview_width, parseInt(ve.offsetWidth));
            SettingStore.setValue(pref_sync_comment, this.refs.viewinfo_frame.getSyncCommentChecked());
        };
    </script>
</player-main-page>