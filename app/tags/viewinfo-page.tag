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
        } 
        .viewinfo-description{
            height: 100%;
            white-space:nowrap;  
            overflow-x: auto;
            overflow-y: auto;
        } 
        .viewinfo-description-text{
            height: 100%;
            white-space: normal;; 
            overflow-x: auto;
            overflow-y: auto;
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
    <div class="viewinfo-panel viewinfo-description-panel">
        <div ref="description" class="viewinfo-panel {this.description_class}"></div>
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

        //TODO
        const linkClick = (e) => {
            e.preventDefault(); 
            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            
            console.log("linkClick e=", e, ", video_id=", video_id);

            obs.triggrt("get-library-data-callback", {
                video_ids:[video_id],
                cb: (data_map) => {
                    if(data_map.has(video_id)){
                        obs.triggrt("request-send-video-data", data_map.get(video_id));
                    }else{
                        obs.trigger("request-send-videoid", video_id);
                    }
                }
            });
            return false;
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

            //TODO
            if(this.refs.description.firstElementChild){
                this.refs.description.removeChild(this.refs.description.firstElementChild);
            }
            const tempEl = document.createElement("div");
            tempEl.innerHTML = viewinfo.thumb_info.description;
            if(tempEl.childElementCount==0){
                this.description_class = "viewinfo-description-text";
            }else{
                this.description_class = "viewinfo-description";  
                const ll = tempEl.querySelectorAll("a");
                ll.forEach(value=>{
                    console.log(value.href);
                    if(/^https:\/\/www.nicovideo.jp\/watch\//.test(value.href)){
                        value.onclick = linkClick;   
                    }else{
                        value.onclick = (e) =>{
                            e.preventDefault();
                            return false;
                        };
                    }
                });   
            }
            this.refs.description.appendChild(tempEl);

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