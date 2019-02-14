<viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            --panel-padding: 4px;
            --video-panel-height: 100px;
            --description-panel-height: 100px;
            grid-template-rows: var(--video-panel-height) var(--description-panel-height) 1fr;
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
            width: calc(130px - var(--panel-padding) * 2);
            height: calc(var(--video-panel-height) - var(--panel-padding) * 2);
        }
        .viewinfo-video-panel-info{
            user-select: none;
            margin-left: 5px;
            white-space: nowrap;
            overflow-x: hidden;
        }
        
        /* TODO: add scrolly auto */
        .viewinfo-description-panel{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            border: 1px solid var(--control-border-color);
        } 
        .viewinfo-comments-panel{
            grid-row: 3 / 4;
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
            <img src={this.thumbnail_url} alt="thumbnail" class="viewinfo-thumbnail">
        </div>
        <div class="viewinfo-video-panel-info">
            <div>{this.title}</div>
            <div>投稿日 : {this.first_retrieve}</div>
            <div>再生 : {this.view_counter}</div>
            <div>コメント : {this.comment_num}</div>
            <div>マイリスト : {this.mylist_counter}</div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-description-panel">
        {this.description}
    </div>
    <div class="viewinfo-panel viewinfo-comments-panel">
        <input class="viewinfo-checkbox" type="checkbox" onclick={this.onclickSyncCommentCheck} /><label>sync</label>
        <div id="comment-grid-container">
            <div id="comment-grid"></div>
        </div>
    </div>

    <script>
        /* globals obs */
        const { GridTable } = require("../js/gridtable");
        require("slickgrid/plugins/slick.autotooltips");
        const time_format = require("../js/time_format");
        const SyncCommentScroll = require("../js/sync_comment_scroll");

        const row_height = 25;

        this.thumbnail_url = "";
        this.title =  "";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_num = 0;
        this.mylist_counter = 0;
        this.description = "";

        let sync_comment_scroll = new SyncCommentScroll();
        let sync_comment_checked = this.opts.sync_comment_checked;

        const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
            return time_format.toPlayTime(value * 10 / 1000);
        };

        const columns = [
            {id: "vpos", name: "時間", sortable: true, formatter: timeFormatter},
            {id: "text", name: "コメント", sortable: true},
            {id: "user_id", name: "ユーザーID", sortable: true},
            {id: "post_date", name: "投稿日", sortable: true},
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
            const container = this.root.querySelector("#comment-grid-container");
            const new_height = $(window).height() - container.offsetTop - 5;
            const new_width = container.clientWidth - 5;
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

        obs.on("on_change_viweinfo", (viewinfo)=> {
            resizeCommnetList();

            this.thumbnail_url = viewinfo.thumb_info.thumbnail_url;
            this.title = viewinfo.thumb_info.title;
            this.first_retrieve = time_format.toDate(viewinfo.thumb_info.first_retrieve);
            this.view_counter = viewinfo.thumb_info.view_counter;
            this.comment_num = viewinfo.thumb_info.comment_num;
            this.mylist_counter = viewinfo.thumb_info.mylist_counter;
            this.description = viewinfo.thumb_info.description;

            sync_comment_scroll.setComments(viewinfo.commnets);

            const commnets = viewinfo.commnets.map(value => {
                return Object.assign(value, { id: value.no });
            });
            grid_table.setData(commnets);
        });

        obs.on("seek_update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommnetIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        this.on("mount", () => {  
            grid_table.init();
            grid_table.grid.registerPlugin(new Slick.AutoTooltips());

            updateSyncCommentCheckBox();
            resizeCommnetList();
        });
        
        obs.on("resizeEndEvent", (size)=> {
            resizeCommnetList();
        });
    </script>
</viewinfo-page>