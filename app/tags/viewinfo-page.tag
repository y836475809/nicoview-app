<viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            --panel-padding: 4px;
            --video-panel-height: 100px;
            --user-panel-height: 60px;
            --user-thumbnail-size: 50px;
            --description-panel-height: 100px;
            grid-template-rows: var(--video-panel-height) var(--user-panel-height) var(--description-panel-height) 1fr;
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
        .viewinfo-thumbnail{
            user-select: none;
            margin-left: calc(0px - var(--panel-padding));
            width: calc(130px - var(--panel-padding) * 2);
            height: calc(var(--video-panel-height) - var(--panel-padding) * 2);
        }
        .viewinfo-video-panel-info{
            user-select: none;
            margin-left: 5px;
            white-space: nowrap;
            overflow-x: hidden;
        }
        
        .viewinfo-user-panel{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            display: flex; 
        } 
        .viewinfo-user-thumbnail{
            user-select: none;
            margin-left: calc(0px - var(--panel-padding));
            width: var(--user-thumbnail-size); 
            height: var(--user-thumbnail-size); 
        }
        .viewinfo-user-name{
            user-select: none;
            padding-left: 5px;
            vertical-align: middle;
            height: var(--user-thumbnail-size); 
            line-height: var(--user-thumbnail-size); 
        }

        .viewinfo-description-panel{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            border: 1px solid var(--control-border-color);
            margin-right:  5px;
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
        .description-toggle{
            display: block;
            width: var(--toggle-icon-size);
            height: var(--toggle-icon-size);
            margin: var(--toggle-icon-margin) var(--toggle-icon-margin) var(--toggle-icon-margin) auto;
        }
        .description-content {
            padding: 2px;
            width: 100%;
            height: calc(100% - var(--toggle-icon-size) - var(--toggle-icon-margin) * 2);  
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
            grid-row: 4 / 5;
            grid-column: 1 / 3; 
            background-color: var(--control-color);
        }
        
        .viewinfo-checkbox{
            height: 25px;
            vertical-align:middle;
        }
    </style>
    
    <div class="viewinfo-panel viewinfo-video-panel">
        <div>
            <img src={this.thumbnail_url} class="viewinfo-thumbnail">
        </div>
        <div class="viewinfo-video-panel-info">
            <div>{this.title}</div>
            <div>投稿日 : {this.first_retrieve}</div>
            <div>再生 : {this.view_counter}</div>
            <div>コメント : {this.comment_num}</div>
            <div>マイリスト : {this.mylist_counter}</div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-user-panel">
            <img src={this.user_icon_url} class="viewinfo-user-thumbnail">
            <div class="viewinfo-user-name">{this.user_nickname}</div>
    </div> 
    <div class="viewinfo-description-panel">   
        <div class="description-container {this.description_container_class}">
            <div class="description-toggle fas fa-exchange-alt" onclick={this.onclickExtDescription}></div>   
            <div class="description-content {this.description_content_class}"></div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-comments-panel">
        <input class="viewinfo-checkbox" type="checkbox" onclick={this.onclickSyncCommentCheck} /><label>同期</label>
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

        this.thumbnail_url = "";
        this.title =  "";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_num = 0;
        this.mylist_counter = 0;
        
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

        const resizeCommnetList = () => {
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
            let ch_elm = this.root.querySelector(".viewinfo-checkbox");
            ch_elm.checked = sync_comment_checked;
        };

        const watchLinkClick = (e) => {
            e.preventDefault(); 
            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            obs.trigger("player-html:play-by-videoid", video_id);
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
                    }else{
                        value.onclick = (e) =>{
                            e.preventDefault();
                            return false;
                        };
                    }
                });
            }
        };

        this.onclickExtDescription = (e) => {
            if(this.description_container_class=="description-container-extend"){
                this.description_container_class = "description-container-normal";
                this.update();
            }else{
                this.description_container_class = "description-container-extend";
                this.update();

                const parent_elm = this.root.querySelector(".viewinfo-description-panel");
                const elm = this.root.querySelector(".description-container");
                
                const container_width = elm.clientWidth; 
                const left = parent_elm.offsetLeft - (container_width-parent_elm.offsetWidth);
                elm.style.top = parent_elm.offsetTop + "px";
                elm.style.left = left + "px";
                
            }
        };

        obs.on("on_change_viweinfo", (viewinfo)=> {
            resizeCommnetList();

            this.thumbnail_url = viewinfo.thumb_info.thumbnail_url;
            this.title = viewinfo.thumb_info.title;
            this.first_retrieve = time_format.toDate(viewinfo.thumb_info.first_retrieve);
            this.view_counter = viewinfo.thumb_info.view_counter;
            this.comment_num = viewinfo.thumb_info.comment_num;
            this.mylist_counter = viewinfo.thumb_info.mylist_counter;
            this.user_nickname = viewinfo.thumb_info.user_nickname;
            this.user_icon_url = viewinfo.thumb_info.user_icon_url;
            
            setDescription(this.root.querySelector(".description-content"), viewinfo.thumb_info.description);

            sync_comment_scroll.setComments(viewinfo.commnets);

            const commnets = viewinfo.commnets.map(value => {
                return Object.assign(value, { id: value.no });
            });
            grid_table.setData(commnets);

            this.update();
        });

        obs.on("seek_update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommnetIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        this.on("mount", () => {  
            grid_table.init(this.root.querySelector(".comment-grid"));
            grid_table.grid.registerPlugin(new Slick.AutoTooltips());

            updateSyncCommentCheckBox();
            resizeCommnetList();
        });
        
        obs.on("resizeEndEvent", (size)=> {
            resizeCommnetList();
        });

        obs.on("on-resized-player-split", ()=> {
            resizeCommnetList();
        });
    </script>
</viewinfo-page>