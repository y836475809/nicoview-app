<player-info-page>
    <style scoped>
        :scope {
            --video-container-height: 100px;
            --video-controls-container-height: 30px;
            --user-container-height: 130px;
            --comment-controls-container-height: 30px;
            overflow-x: hidden;
            overflow-y: hidden;
        }    

        .info-container {
            padding: 5px;;
            width: 100%;
            height: 100%; 
        }

        .video-container {
            height: calc(var(--video-container-height) 
                + var(--video-controls-container-height));
        } 
        .video-thumbnail {
            user-select: none;
            width: 130px;
            height: 100px;
        }
        .video-info {
            user-select: none;
            white-space: nowrap;
            margin-left: 5px;
        }
        .video-info > .content {
            display: flex
        }
        .video-info > .content > .label {
            min-width: calc(5em + 3px);
        }
        .video-info > .content > .notice-deleted {
            font-weight: bold;
            color: red;
        }
        .video-controls-container {
            width: 100%;
            height: var(--video-controls-container-height);
            display: flex;  
        }

        .user-container {
            height: var(--user-container-height);
            width: 100%;
        } 

        .comments-container {
            height: calc(100% 
                - var(--video-container-height) - var(--video-controls-container-height)
                - var(--user-container-height));
            background-color: var(--control-color);
        }
        .comments-controls-container {
            height: var(--comment-controls-container-height);
            display: flex;
        }
        .comments-controls-container > label {
            user-select: none;
        }
        .comment-checkbox {
            height: 25px;
            vertical-align:middle;
        }
        .comment-checkbox + label + .icon {
            margin-left: 10px;
        }
        .comment-grid-container {
            width: 100%;
            height: calc(100% - var(--comment-controls-container-height));
        }

        .icon {
            font-size: 20px;
            color: gray;
        }
        .icon:hover {
            color: black;
        }
        .icon[data-state="false"]{
            pointer-events: none;
            opacity: 0.3;
        }
        .icon.fa-stack {
            font-size: 18px;
        }
        .icon-button {
            height: 30px;
            width: 30px;
            margin-left: 5px;
        }
        .icon-button.move-right {
            margin-left: auto;
            margin-right: 5px;
        }
        .icon-layer1 {
            left: -5px;
        }
        .icon-layer2 {
            position: relative;
            left: 25%;
            top: 25%;
            font-size: 0.6em;
        }
    </style>
    
    <div class="info-container">
        <div class="video-container">
            <div style="display: flex;">
                <div class="video-thumbnail">
                    <img src={video_thumbnail_url} class="video-thumbnail">
                </div>
                <div class="video-info">
                    <div class="content">
                        <div class="label">投稿日</div>: {first_retrieve}
                    </div>
                    <div class="content">
                        <div class="label">再生</div>: {view_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        <div class="label">コメント</div>: {comment_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        <div class="label">マイリスト</div>: {mylist_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        {videoStateOnline()} {videoStateLocal()}
                    </div>
                    <div class="content">
                        <div class="notice-deleted">{videoStateDeleted()}</div>
                    </div>
                </div>
            </div>
            <div class="video-controls-container">
                <div title="動画情報更新" class="icon-button center-v move-right">
                    <span class="icon center-hv fa-stack" 
                        data-state={String(enableUpdateData())} 
                        onclick={onclickUpdateThumbInfo}>
                        <i class="icon-layer1 fas fa-info fa-stack-1x"></i>
                        <i class="icon-layer2 fas fa-sync-alt fa-stack-1x"></i>
                    </span>
                </div>
            </div> 
        </div>
        <div class="user-container">
            <player-user obs={opts.obs}></player-user>
        </div>
        <div class="comments-container">
            <div class="comments-controls-container">
                <input class="comment-checkbox" type="checkbox" 
                    onclick={onclickSyncCommentCheck} /><label class="center-v">同期</label>
                <span class="icon center-hv" onclick={onclickToggleComment}>
                    <i title="コメント表示/非表示切り替え" class={toggle_comment_class}></i>
                </span>
                <div title="コメント更新" class="icon-button center-v move-right">
                    <span class="icon center-hv fa-stack" 
                        data-state={String(enableUpdateData())} 
                        onclick={onclickUpdateComment}>
                        <i class="icon-layer1 far fa-comment-dots fa-stack-1x"></i>
                        <i class="icon-layer2 fas fa-sync-alt fa-stack-1x"></i>
                    </span>
                </div>
            </div>
            <div class="comment-grid-container">
                <div class="comment-grid"></div>
            </div>
        </div>
    </div>
    
    <script>
        /* globals logger */
        const { remote } = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const time_format = window.TimeFormat;
        const SyncCommentScroll = window.SyncCommentScroll;

        const obs = this.opts.obs; 

        const row_height = 25;

        this.is_deleted = false;
        this.is_online = false;
        this.is_saved = false;

        this.video_thumbnail_url = "";
        this.title =  "-";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_counter = 0;
        this.mylist_counter = 0;

        let sync_comment_scroll = new SyncCommentScroll();
        let sync_comment_checked = this.opts.sync_comment_checked;

        this.enableDonwload = () => {
            return this.is_deleted === false && this.is_saved === false;
        };
        this.enableUpdateData = () => {
            return this.is_deleted === false && this.is_saved === true;
        };

        this.videoStateOnline = () => {
            if(this.is_online === true){
                return "オンライン再生";
            }else{
                return "ローカル再生";
            }
        };
        this.videoStateLocal = () => {
            if(this.is_saved === true){
                return "保存済み";
            }else{
                return "";
            }
        };
        this.videoStateDeleted = () => {
            if(this.is_deleted === true){
                return "削除されています";
            }else{
                return "";
            }
        };

        const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
            return time_format.toTimeString(value * 10 / 1000);
        };
        const dateFormatter = (row, cell, value, columnDef, dataContext)=> {
            //sec->ms
            return time_format.toDateString(value * 1000);
        };

        const columns = [
            {id: "vpos", name: "時間", sortable: true, formatter: timeFormatter},
            {id: "content", name: "コメント", sortable: true},
            {id: "user_id", name: "ユーザーID", sortable: true},
            {id: "date", name: "投稿日", sortable: true, formatter: dateFormatter},
            {id: "no", name: "番号", sortable: true},
            {id: "mail", name: "オプション", sortable: true}
        ];
        const options = {
            rowHeight: row_height,
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("comment-grid", columns, options);

        this.onclickSyncCommentCheck = (e) => {
            const checked = e.target.checked;
            sync_comment_checked = checked;
            obs.trigger("player-main-page:sync-comment-checked", checked);
        };

        const resizeCommentList = () => {
            const container = this.root.querySelector(".comment-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const updateSyncCommentCheckBox = () => {
            let ch_elm = this.root.querySelector(".comment-checkbox");
            ch_elm.checked = sync_comment_checked;
        };

        this.toggle_comment_class = "far fa-comment-dots";
        this.onclickToggleComment = (e) => {
            let comment_visible = true;
            
            if(/dots/.test(this.toggle_comment_class)){
                this.toggle_comment_class = "fas fa-comment-slash";
                comment_visible = false;
            }else{
                this.toggle_comment_class = "far fa-comment-dots";
                comment_visible = true;
            }
            this.update();

            obs.trigger("player-video:change-comment-visible", comment_visible);
        };

        this.onclicAddDownload = (e) => {
            const item = {
                thumb_img: this.video_thumbnail_url,
                id: this.video_id,
                name: this.title,
                state: 0
            };
            obs.trigger("player-main-page:add-download-item", item);
        };
        
        this.onclickUpdateThumbInfo = (e) => {
            obs.trigger("player-main-page:update-data", this.video_id, "thumbinfo");
        };

        this.onclickUpdateComment = (e) => {
            logger.debug("player video info update video_id=", this.video_id);
            obs.trigger("player-main-page:update-data", this.video_id, "comment");
        };

        const setComments = (comments) => {
            sync_comment_scroll.setComments(comments);

            const grid_table_comments = comments.map((value, index) => {
                return Object.assign(value, { id: index });
            });
            grid_table.clearSelected();
            grid_table.setData(grid_table_comments);    
            grid_table.scrollToTop();
        };

        obs.on("player-info-page:update-comments", (args)=> {
            const comments = args;
            setComments(comments);
        });

        obs.on("player-info-page:sync-comment-checked", (args)=> {
            sync_comment_checked = args;
            updateSyncCommentCheckBox();
        });

        obs.on("player-info-page:set-viewinfo-data", (args)=> {
            resizeCommentList();

            const { viewinfo, comments, state } = args;

            this.is_deleted = viewinfo.is_deleted;

            if(state){
                this.is_online = state.is_online;
                this.is_saved = state.is_saved;
            }
            
            if(this.is_deleted===undefined){
                this.is_deleted = false;
            }
            if(this.is_online===undefined){
                this.is_online = false;
            }
            if(this.is_saved===undefined){
                this.is_saved = false;
            }

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const thread = thumb_info.thread;
            const owner = thumb_info.owner;
            const description = video.description;

            this.video_id = video.video_id;
            this.title = video.title;
            this.video_thumbnail_url = video.thumbnailURL;
            this.first_retrieve = time_format.toDateString(video.postedDateTime);
            this.view_counter = video.viewCount;
            this.comment_counter = thread.commentCount;
            this.mylist_counter = video.mylistCount;
            
            const user_nickname = owner.nickname;
            const user_icon_url = owner.iconURL;
            
            obs.trigger("player-user:set-data", {
                user_nickname,
                user_icon_url, 
                description
            });

            setComments(comments);
            
            this.update();
        });

        obs.on("player-info-page:seek-update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommentIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        const triggerAddCommentNG = (args) => {
            obs.trigger("player-main-page:add-comment-ng", args);
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "コメントをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const texts = items.map(item=>{
                        return item.text;
                    });
                    triggerAddCommentNG({ ng_matching_texts: texts, ng_user_ids: [] });
                }},
                { label: "ユーザーIDをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const user_ids = items.map(item=>{
                        return item.user_id;
                    });
                    triggerAddCommentNG({ ng_matching_texts: [], ng_user_ids: user_ids });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.on("mount", () => {  
            grid_table.init(this.root.querySelector(".comment-grid"));
            grid_table.grid.registerPlugin(new Slick.AutoTooltips());

            grid_table.onDblClick(async (e, data)=>{
                const sec = data.vpos * 10 / 1000;
                obs.trigger("player-video:seek", sec);
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            resizeCommentList();
        });
        
        obs.on("window-resized", ()=> {
            resizeCommentList();
        });

        obs.on("player-info-page:split-resized", ()=> {
            resizeCommentList();
        });
    </script>
</player-info-page>