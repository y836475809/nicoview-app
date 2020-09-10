<player-info-page>
    <style scoped>
        :scope {
            --video-container-height: 130px;
            --user-container-height: 130px;
            --comment-controls-container-height: 35px;
            overflow-x: hidden;
            overflow-y: hidden;
        }    

        .info-container {
            padding: 5px;;
            width: 100%;
            height: 100%; 
        }

        .video-container {
            height: var(--video-container-height);
        } 
        .video-thumbnail {
            user-select: none;
            width: 160px;
            height: calc(var(--video-container-height) - 5px);
            object-fit: contain;
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

        .user-container {
            height: var(--user-container-height);
            width: 100%;
        } 

        .controls-container {
            height: var(--comment-controls-container-height);
            display: flex;
        }
        .controls-container > label {
            height: 32px;
            user-select: none;
        }
        .controls-container input[type='checkbox']:hover {
            cursor: pointer;
        }
        .comment-checkbox {
            height: 32px;
            vertical-align:middle;
        }
        .comment-checkbox + label  {
            position: relative;
            top: 3px;
            margin-right: 10px;
        }
        .comment-state {
            user-select: none;
        }
        .comment-grid-container {
            width: 100%;
            height: calc(100% 
                - var(--video-container-height) 
                - var(--user-container-height) - var(--comment-controls-container-height));
            background-color: var(--control-color);
        }

        .icon {
            font-size: 18px;
            color: gray;
        }
        .icon:hover {
            color: black;
        }
        .icon[data-state="false"] {
            pointer-events: none;
            opacity: 0.3;
        }
        .icon-button {
            height: 30px;
            width: 30px;
            margin-left: 5px;
            cursor: pointer;
        }
        .move-right {
            display: flex;
            margin-left: auto;
        }
    </style>
    
    <div class="info-container">
        <div class="video-container">
            <div style="display: flex;">
                <div class="video-thumbnail" title={video_thumbnail_tooltip}>
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
                        {videoStateEconomy()}
                    </div>
                    <div class="content">
                        <div class="notice-deleted">{videoStateDeleted()}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="user-container">
            <player-user obs={opts.obs}></player-user>
        </div>
        <div class="controls-container">
            <input class="center-v comment-checkbox comment-visible" type="checkbox" 
                onclick={onclickCommentVisibleCheck} />
                <label class="center-v" title="コメントの表示/非表示">表示</label>
            <div class="comment-state center-v" title="表示制限、フィルタリングしたコメント数/全コメント数">
                {comment_state}
            </div>
            <div class="move-right">
                <div title="設定ダイアログ表示" class="icon-button center-hv">                      
                    <span class="icon fas fa-cog" onclick={onclickShowSettingDialog}></span> 
                </div>
                <div title="動画情報更新" class="icon-button center-hv">
                    <span class="icon center-hv" 
                        data-state={String(enableUpdateData())} 
                        onclick={onclickUpdateThumbInfo}>
                        <i class="fas fa-info"></i>
                    </span>
                </div>     
                <div title="コメント更新" class="icon-button center-hv">
                    <span class="icon center-hv" 
                        data-state={String(enableUpdateData())} 
                        onclick={onclickUpdateComment}>
                        <i class="far fa-comment-dots"></i>
                    </span>
                </div>
            </div>
        </div>
        <div class="comment-grid-container">
            <div class="comment-grid"></div>
        </div>
    </div>
    
    <script>
        /* globals logger */
        const { remote } = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const time_format = window.TimeFormat;
        const { SyncCommentScroll } = window.SyncCommentScroll;

        const obs = this.opts.obs; 

        const row_height = 25;

        this.is_economy = false;
        this.is_deleted = false;
        this.is_online = false;
        this.is_saved = false;

        this.video_thumbnail_url = "";
        this.title =  "-";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_counter = 0;
        this.mylist_counter = 0;
        this.comment_state = "";

        this.video_thumbnail_tooltip = "";

        let sync_comment_scroll = new SyncCommentScroll();
        let sync_comment_checked = true;

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
        this.videoStateEconomy = () => {
            // if(this.is_economy === true){
            //     return "エコノミー";
            // }else{
            //     return "";
            // }
            return this.is_economy ? "エコノミー" : "高画質";
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
            {id: "vpos", name: "時間", formatter: timeFormatter},
            {id: "content", name: "コメント"},
            {id: "user_id", name: "ユーザーID"},
            {id: "date", name: "投稿日", formatter: dateFormatter},
            {id: "no", name: "番号"},
            {id: "mail", name: "オプション"}
        ];
        const options = {
            rowHeight: row_height,
        };   
        const grid_table = new GridTable("comment-grid", columns, options);

        this.onclickCommentVisibleCheck = (e) => {
            const comment_visible = e.target.checked;
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

        this.onclickShowSettingDialog = (e) => {
            obs.trigger("player-main-page:show-player-setting-dialog");
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

        obs.on("player-info-page:set-viewinfo-data", (args)=> {
            grid_table.resizeGrid();

            const { viewinfo, comments, all_comment_num, state } = args;

            this.is_economy = viewinfo.is_economy;
            this.is_deleted = viewinfo.is_deleted;

            if(state){
                this.is_online = state.is_online;
                this.is_saved = state.is_saved;
            }
            
            if(this.is_economy===undefined){
                this.is_economy = false;
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

            this.video_thumbnail_tooltip = 
                `投稿日: ${this.first_retrieve}\n`
                + `再生: ${this.view_counter.toLocaleString()}\n`
                + `コメント: ${this.comment_counter.toLocaleString()}\n`
                + `マイリスト: ${this.mylist_counter.toLocaleString()}\n`
                + `状態: ${this.videoStateOnline()} ${this.videoStateLocal()}\n`
                + `画質: ${this.videoStateEconomy()}`; 
            const state_deleted = this.videoStateDeleted();
            if(state_deleted){
                this.video_thumbnail_tooltip += `\n${state_deleted}`;
            }

            this.comment_state = 
                `${comments.length.toLocaleString()}/${all_comment_num.toLocaleString()}`;
            
            const user_id = owner.id;
            const user_nickname = owner.nickname;
            const user_icon_url = owner.iconURL;
            
            obs.trigger("player-user:set-data", {
                user_id,
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

        obs.on("player-info-page:reset-comment-scroll", ()=> {
            if(sync_comment_scroll){
                sync_comment_scroll.reset();
            }
        });

        const triggerAddNGComment = (args) => {
            obs.trigger("player-main-page:add-ng-comment", args);
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "コメントをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const texts = items.map(item=>{
                        return item.content;
                    });
                    triggerAddNGComment({ ng_texts: texts, ng_user_ids: [] });
                }},
                { label: "ユーザーIDをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const user_ids = items.map(item=>{
                        return item.user_id;
                    });
                    triggerAddNGComment({ ng_texts: [], ng_user_ids: user_ids });
                }},
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        this.on("mount", () => {  
            grid_table.init(".comment-grid");
            grid_table.setupResizer(".comment-grid-container");

            grid_table.onDblClick(async (e, data)=>{
                const sec = data.vpos * 10 / 1000;
                obs.trigger("player-video:seek", sec);
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            const ch_elm = this.root.querySelector(".comment-checkbox.comment-visible");
            ch_elm.checked = true;          
        });

        obs.on("player-info-page:split-resized", ()=> {
            grid_table.resizeGrid();
        });
    </script>
</player-info-page>