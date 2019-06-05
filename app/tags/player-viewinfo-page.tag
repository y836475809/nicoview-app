<player-viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            --panel-padding: 4px;
            --video-panel-height: 120px;
            --user-panel-height: 30px;
            --user-thumbnail-size: 50px;
            --description-panel-height: 100px;
            grid-template-rows: var(--video-panel-height) calc(var(--user-panel-height) + var(--description-panel-height)) 1fr;
            grid-template-columns: 1fr 1fr;  
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: hidden;
            --controls-container-height: 30px;
            --toggle-icon-size: 15px;
            --toggle-icon-margin: 2px;
        }    
        .viewinfo-panel{
            width: 100%;
            height: 100%;
            padding: var(--panel-padding);
        }

        .viewinfo-video-panel{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            display: flex; 
        } 
        .video-thumbnail{
            user-select: none;
            margin-left: calc(0px - var(--panel-padding));
            width: 130px;
            height: 100px;
        }
        .video-info{
            user-select: none;
            margin-left: 5px;
            white-space: nowrap;
            overflow-x: hidden;
        }
        
        .viewinfo-description-panel{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            border: 1px solid var(--control-border-color);
            border-radius: 2px;
            margin-right:  5px;
        } 
        .description-user-thumbnail{
            user-select: none;
            padding-top: 5px;
            padding-left: 5px;
            width: var(--user-thumbnail-size); 
            height: var(--user-thumbnail-size); 
        }
        .description-user-name{
            user-select: none;
            vertical-align: middle;
            padding-left: 5px;
        }
        .description-container-normal {
            width: 100%;
            height: 100%;
        }
        .description-container-extend {
            position: absolute;
            top: 0px;
            border: solid 1px #aaa;
            border-radius: 3px;
            background-color: white; 
            box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.3);
            z-index: 999;
        }
        .description-container-normal .description-user-thumbnail
        {
            display: none;
        }
        .description-container-extend .description-user-thumbnail
        {
            visibility: visible; 
        }
        .description-container-normal .description-user-name  {
            height: 20px; 
            line-height: 20px; 
        }
        .description-container-extend .description-user-name  {
            height: var(--user-thumbnail-size); 
            line-height: var(--user-thumbnail-size); 
        }
        .description-toggle{
            display: block;
            width: var(--toggle-icon-size);
            height: var(--toggle-icon-size);
            margin: var(--toggle-icon-margin) var(--toggle-icon-margin) var(--toggle-icon-margin) auto;
        }
        .description-content {
            padding: 2px;
            width: 100%;
            height: calc(100% - var(--user-panel-height) - var(--toggle-icon-margin) * 2);  
            overflow-x: auto;
            overflow-y: auto;         
        }
        .description-content-html {
            white-space:nowrap;  
        } 
        .description-content-text {
            white-space: normal;
        } 

        .viewinfo-comments-panel{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color: var(--control-color);
        }   

        .viewinfo-controls-container {
            height: var(--controls-container-height);
        }
        .comment-checkbox{
            height: 25px;
            vertical-align:middle;
        }

        .comment-grid-container {
            width: 100%;
            height: calc(100vh - var(--video-panel-height) - var(--user-panel-height) - var(--description-panel-height)
                - var(--controls-container-height) - 4px);
        }

        .icon-contain{
            display: flex;
            margin-left: auto;
        }
        .icon-button{
            font-size: 20px;
            width: 30px;
        }
        .icon-button:hover{
            cursor: pointer;
            background-color: lightgray; 
        }
        .icon-button[data-state="false"]{
            pointer-events: none;
            opacity: 0.2;
        }
        .icon-islocal{
            font-size: 20px;
        }
        .icon-islocal[data-state="true"]{
            color: green;
        }
        .icon-islocal[data-state="false"]{
            opacity: 0.2;
        }

        .video-info > .content {
            display: flex
        }
        .video-info > .content > .label {
            min-width: calc(5em + 3px);
        }
        .video-info > .notice-deleted {
            color: red;
        }
    </style>
    
    <div class="viewinfo-panel viewinfo-video-panel">
        <div>
            <img src={this.video_thumbnail_url} class="video-thumbnail">
        </div>
        <div class="video-info">
            <div>{this.title}</div>
            <div class="content">
                <div class="label">投稿日</div>: {this.first_retrieve}
            </div>
            <div class="content">
                <div class="label">再生</div>: {this.view_counter}
            </div>
            <div class="content">
                <div class="label">コメント</div>: {this.comment_counter}
            </div>
            <div class="content">
                <div class="label">マイリスト</div>: {this.mylist_counter}
            </div>
            <i title={this.is_local?"local":""} data-state={String(this.is_local)} class="icon-islocal fas fa-book"></i>
            <i class="notice-deleted" if={this.is_deleted}>動画は削除されています</i>
        </div>
    </div>
    <div class="viewinfo-description-panel">   
        <div class="description-container {this.description_container_class}">
            <div style="display: flex;">
                <img class="description-user-thumbnail" src={this.user_thumbnail_url}>
                <div class="description-user-name">投稿者: {this.user_nickname}</div>
                <div class="description-toggle fas fa-exchange-alt" onclick={this.onclickExtDescription}></div>   
            </div>
            <hr>
            <div class="description-content {this.description_content_class}"></div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-comments-panel">
        <div style="display: flex;">
            <div class="viewinfo-controls-container">
                <input class="comment-checkbox" type="checkbox" 
                    onclick={this.onclickSyncCommentCheck} /><label>同期</label>
            </div>
            <div class="icon-contain">
                <span class="icon-button center-hv" onclick={this.onclickToggleComment}>
                        <i title="comment" class={this.toggle_comment_class}></i></span>
                <span class="icon-button center-hv" data-state={String(!this.is_deleted)} onclick={this.onclicAddDownload}>
                        <i title="download" class="fas fa-download"></i></span>
                <span class="icon-button center-hv" onclick={this.onclickUpdate}>
                    <i title="update" class="fas fa-sync-alt"></i></span>
                <span class="icon-button center-hv" onclick={this.onclickConfig}>
                    <i title="設定" class="fas fa-cog"></i></span>
            </div>
        </div>
        <div class="comment-grid-container">
            <div class="comment-grid"></div>
        </div>
    </div>
    
    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        require("slickgrid/plugins/slick.autotooltips");
        const time_format = require(`${app_base_dir}/js/time-format`);
        const SyncCommentScroll = require(`${app_base_dir}/js/sync-comment-scroll`);

        const row_height = 25;

        this.is_deleted = false;
        this.is_local = false;

        this.video_thumbnail_url = "";
        this.title =  "-";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_counter = 0;
        this.mylist_counter = 0;
        this.user_thumbnail_url = "";
        
        this.description_container_class = "description-container-normal";
        this.description_content_class = "description-content-text";

        let sync_comment_scroll = new SyncCommentScroll();
        let sync_comment_checked = this.opts.sync_comment_checked;

        const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
            return time_format.toPlayTime(value * 10 / 1000);
        };
        const dateFormatter = (row, cell, value, columnDef, dataContext)=> {
            //sec->ms
            return time_format.toDate(value * 1000);
        };

        const columns = [
            {id: "vpos", name: "時間", sortable: true, formatter: timeFormatter},
            {id: "text", name: "コメント", sortable: true},
            {id: "user_id", name: "ユーザーID", sortable: true},
            {id: "post_date", name: "投稿日", sortable: true, formatter: dateFormatter},
            {id: "no", name: "番号", sortable: true},
            {id: "mail", name: "オプション", sortable: true}
        ];
        const options = {
            rowHeight: row_height,
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("comment-grid", columns, options);

        this.onclickSyncCommentCheck = (e) => {
            sync_comment_checked = e.target.checked;
        };

        this.getSyncCommentChecked = () => {
            return sync_comment_checked;
        };

        const resizeCommentList = () => {
            const container = this.root.querySelector(".comment-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const updateSyncCommentCheckBox = () => {
            let ch_elm = this.root.querySelector(".comment-checkbox");
            ch_elm.checked = sync_comment_checked;
        };

        const watchLinkClick = (e) => {
            e.preventDefault(); 
            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            obs.trigger("play-by-videoid", video_id);
            return false;
        };

        const mylistLinkClick = (e) => {
            e.preventDefault(); 
            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            obs.trigger("load-mylist", video_id);
            return false;
        };

        const setDescription = (content_elm, description) => {
            content_elm.innerHTML = description;

            if(content_elm.childElementCount==0){
                this.description_content_class = "description-content-text";
            }else{
                this.description_content_class = "description-content-html";
                const a_tags = content_elm.querySelectorAll("a");
                a_tags.forEach(value=>{
                    if(/^https:\/\/www.nicovideo.jp\/watch\//.test(value.href)){
                        value.onclick = watchLinkClick;
                    }else if(/^https:\/\/www.nicovideo.jp\/mylist\//.test(value.href)){
                        value.onclick = mylistLinkClick;
                    }else{
                        value.onclick = (e) =>{
                            e.preventDefault();
                            return false;
                        };
                    }
                });
            }
        };

        const setDescriptionContainerClass = (class_name) => {
            this.description_container_class = class_name;
            this.update();

            if(class_name=="description-container-extend"){
                const parent_elm = this.root.querySelector(".viewinfo-description-panel");
                const elm = this.root.querySelector(".description-container");
                
                const container_width = elm.clientWidth; 
                const left = parent_elm.offsetLeft - (container_width-parent_elm.offsetWidth);
                elm.style.top = parent_elm.offsetTop + "px";
                elm.style.left = left + "px";
            }
        };

        this.onclickExtDescription = (e) => {
            if(this.description_container_class=="description-container-extend"){
                setDescriptionContainerClass("description-container-normal");
            }else{
                if(this.user_thumbnail_url != this.user_icon_url){
                    this.user_thumbnail_url = this.user_icon_url;
                }
                setDescriptionContainerClass("description-container-extend");
            }
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

            obs.trigger("show-player-comment", comment_visible);
        };

        this.onclicAddDownload = (e) => {
            const item = {
                thumb_img: this.video_thumbnail_url,
                id: this.video_id,
                name: this.title,
                state: 0
            };
            obs.trigger("add-download-item", item);
        };

        this.onclickUpdate = (e) => {
            console.log("player update video_id=", this.video_id);
            obs.trigger("update-data", this.video_id);
        };

        this.onclickConfig = (e) => {
            obs.trigger("show-comment-setting-dialog");
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

        obs.on("update-comments", (args)=> {
            const comments = args;
            setComments(comments);
        });

        obs.on("on_change_viewinfo", (args)=> {
            resizeCommentList();

            const { viewinfo, comments } = args;

            this.is_deleted = viewinfo.is_deleted;
            this.is_local = viewinfo.is_local;
            if(this.is_deleted===undefined){
                this.is_deleted = false;
            }
            if(this.is_local===undefined){
                this.is_local = false;
            }

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const thread = thumb_info.thread;
            const owner = thumb_info.owner;
            const description = video.description;

            this.video_id = video.video_id;
            this.title = video.title;
            this.video_thumbnail_url = video.thumbnailURL;
            this.first_retrieve = time_format.toDate(video.postedDateTime);
            this.view_counter = video.viewCount;
            this.comment_counter = thread.commentCount;
            this.mylist_counter = video.mylistCount;
            this.user_nickname = owner.nickname;
            this.user_icon_url = owner.iconURL;
            
            setDescription(this.root.querySelector(".description-content"), description);
            setDescriptionContainerClass("description-container-normal");

            setComments(comments);
            
            this.update();
        });

        obs.on("seek_update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommentIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        const triggerAddCommentNG = (args) => {
            obs.trigger("add-comment-ng", args);
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

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            updateSyncCommentCheckBox();
            resizeCommentList();
        });
        
        obs.on("resizeEndEvent", (size)=> {
            resizeCommentList();
        });

        obs.on("on-resized-player-split", ()=> {
            resizeCommentList();
        });
    </script>
</player-viewinfo-page>