<player-viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            --panel-padding: 4px;
            --video-panel-height: calc(100px + 6px);
            --user-panel-height: 30px;
            --user-thumbnail-size: 50px;
            --description-panel-height: 100px;
            grid-template-rows: var(--video-panel-height) calc(var(--user-panel-height) + var(--description-panel-height)) 1fr;
            grid-template-columns: 1fr 1fr;  
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: hidden;
            --row-height: 25px;
            --toggle-icon-size: 15px;
            --toggle-icon-margin: 2px;
        }    
        .viewinfo-panel{
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
        .comment-checkbox{
            height: 25px;
            vertical-align:middle;
        }
        .icon-button{
            font-size: 20px;
            margin-left: auto;
        }
        .icon-button:hover{
            cursor: pointer; 
            opacity: 0.5;
        }
    </style>
    
    <div class="viewinfo-panel viewinfo-video-panel">
        <div>
            <img src={this.video_thumbnail_url} class="video-thumbnail">
        </div>
        <div class="video-info">
            <div>{this.title}</div>
            <div>投稿日 : {this.first_retrieve}</div>
            <div>再生 : {this.view_counter}</div>
            <div>コメント : {this.comment_counter}</div>
            <div>マイリスト : {this.mylist_counter}</div>
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
            <div>
                <input class="comment-checkbox" type="checkbox" 
                    onclick={this.onclickSyncCommentCheck} /><label>同期</label>
            </div>
            <span class="icon-button center-hv" onclick={this.onclickUpdate}>
                <i title="update" class="fas fa-sync-alt"></i></span>
        </div>
        <div class="comment-grid-container">
            <div class="comment-grid"></div>
        </div>
    </div>
    
    <script>
        /* globals app_base_dir obs */
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        require("slickgrid/plugins/slick.autotooltips");
        const time_format = require(`${app_base_dir}/js/time_format`);
        const SyncCommentScroll = require(`${app_base_dir}/js/sync_comment_scroll`);

        const row_height = 25;

        this.video_thumbnail_url = "";
        this.title =  "";
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
            const new_height = $(window).height() - container.offsetTop;
            const new_width = container.clientWidth;
            const new_szie = {
                height: new_height,
                width: new_width
            };
            grid_table.resize(new_szie);
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

        this.onclickUpdate = (e) => {
            console.log("player update video_id=", this.video_id);
            obs.trigger("update-data", this.video_id);
        };

        obs.on("on_change_viewinfo", (viewinfo)=> {
            resizeCommentList();

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const thread = thumb_info.thread;
            const owner = thumb_info.owner;
            const comments = viewinfo.comments;
            const description = video.description;

            this.video_id = video.video_id;
            this.title = video.title;
            this.video_thumbnail_url = video.thumbnailURL;
            this.first_retrieve = time_format.toDate(video.postedDateTime);
            this.view_counter = video.viewCount;
            this.comment_counter = video.viewCount;
            this.mylist_counter = thread.commentCount;
            this.user_nickname = owner.nickname;
            this.user_icon_url = owner.iconURL;
            
            setDescription(this.root.querySelector(".description-content"), description);
            setDescriptionContainerClass("description-container-normal");

            sync_comment_scroll.setComments(comments);

            const grid_table_comments = comments.map(value => {
                return Object.assign(value, { id: value.no });
            });
            grid_table.setData(grid_table_comments);
            grid_table.scrollToTop();
            
            this.update();
        });

        obs.on("seek_update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommentIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        this.on("mount", () => {  
            grid_table.init(this.root.querySelector(".comment-grid"));
            grid_table.grid.registerPlugin(new Slick.AutoTooltips());

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