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
            margin: 0;
            overflow-y: hidden;
            --row-height: 25px;
            font-family: Verdana, Geneva, Tahoma, sans-serif;
            font-size: 12px;
            box-sizing: border-box;
        }    
        .viewinfo-panel{
            padding: var(--panel-padding);
        }
        .viewinfo-video-panel{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            background-color:whitesmoke;
            display: flex; 
        } 
        .viewinfo-thumbnail{
            width: calc(130px - var(--panel-padding) * 2);
            height: calc(var(--video-panel-height) - var(--panel-padding) * 2);
        }
        .viewinfo-video-panel-info{
            margin-left: 5px;
            white-space: nowrap;
            overflow-x: hidden;
            width: 100%;
        }
        
        .viewinfo-description-panel{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            border: 1px solid gray;
            margin: 1px;
        } 
        .viewinfo-comments-panel{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color:whitesmoke;
        }
        table{
            table-layout: fixed;
        }
        table.dataTable thead tr th{
            overflow: hidden; 
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: center;         
        }
        table.dataTable tbody td {
            padding: 0px;
            margin: 0px;
            height: var(--row-height);
            overflow: hidden; 
            text-overflow: ellipsis;
            white-space: nowrap; 
            padding-left: 4px;
            padding-right: 4px;
        }
        table.dataTable thead tr th:first-child, 
        table.dataTable tbody tr td:first-child {  
            border-left: 1px solid gray;
        }
        table.dataTable thead tr th {  
            border-top: 1px solid gray;
            border-right: 1px solid gray;
            border-bottom: 1px solid gray;
        }
        table.dataTable tbody td {
            border-right: 1px solid gray;
        }
        table.dataTable thead th, 
        table.dataTable thead td {
            padding: 4px 4px;
            border-bottom: 1px solid gray;
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
            <div>{this.message.POSTED} : {this.first_retrieve}</div>
            <div>{this.message.VIEW} : {this.view_counter}</div>
            <div>{this.message.COMMENT} : {this.comment_num}</div>
            <div>{this.message.MYLIST} : {this.mylist_counter}</div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-description-panel">
        {this.description}
    </div>
    <div class="viewinfo-panel viewinfo-comments-panel">
        <input class="viewinfo-checkbox" type="checkbox" onclick={this.onclickSyncCommentCheck} /><label>sync</label>
        <base-datatable ref="dt" params={this.params} ></base-datatable>
    </div>

    <script>
        /* globals obs */
        const time_format = require("../js/time_format");
        const SyncCommentScroll = require("../js/sync_comment_scroll");
        this.message = require("../js/message");
        require("./base-datatable.tag");

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

        this.onclickSyncCommentCheck = (e) => {
            sync_comment_checked = e.target.checked;
        };

        this.getSyncCommentChecked = () => {
            return sync_comment_checked;
        };

        const resizeCommnetList = () => {
            if(this.refs==undefined){
                return;
            }

            const dt_elm = this.refs.dt.root.querySelector("div.dataTables_scrollHead");
            const vp_elm = this.root.querySelector(".viewinfo-video-panel");
            const dp_elm = this.root.querySelector(".viewinfo-description-panel");            
            const ch_elm = this.root.querySelector(".viewinfo-checkbox");
            const margin = 10;
            const exclude_h = vp_elm.offsetHeight + dp_elm.offsetHeight
                    + dt_elm.offsetHeight + ch_elm.offsetHeight 
                    + margin;
            const h = this.root.clientHeight - exclude_h;
            this.refs.dt.ress({
                w: null,
                h: h
            });
        };

        const updateSyncCommentCheckBox = () => {
            let ch_elm = this.root.querySelector(".viewinfo-checkbox");
            ch_elm.checked = sync_comment_checked;
        };

        this.params = {};
        this.params.dt = {
            columns : [
                { title: this.message.TIME },
                { title: this.message.COMMENT },
                { title: this.message.USER_ID },
                { title: this.message.POSTED },
                { title: this.message.NO },
                { title: this.message.OPTION }
            ],
            columnDefs: [
                { width:100, targets: [0,2,3,4,5] },
                { width:200, targets: [1] },
                { orderable: false, targets: "_all" },
                {
                    targets: 0,
                    orderable: false,
                    data: "vpos",
                    render: function (data, type, row, meta) {
                        return time_format.toPlayTime(data*10/1000);
                    },
                    width:200
                },
                { targets: 1, data: "text"},
                { targets: 2, data: "user_id"},
                { 
                    targets: 3, 
                    data: "date" ,
                    render: function (data, type, row, meta) {
                        return time_format.format(data);
                    },
 
                },
                { targets: 4, data: "no" },
                { targets: 5, data:  "mail" }
            ], 
            colResize : {
                handleWidth: 10,
                tableWidthFixed: false
            },
            dom: "Zrt",
            scrollX: true,
            scrollY: true,
            scrollCollapse:false,
            scroller: {
                displayBuffer: 20,
                row_height: row_height
            },
            autoWidth: false,
            paging: true,
            displayLength:100,
            lengthMenu: [ 100, 200, 300, 400, 500 ],
            deferRender: true,
            stateSave: true,
            dblclickRow: function(data){
                console.log("comment-list dblclickRow data:", data); 
            }
        };

        obs.on("on_change_viweinfo", (viewinfo)=> {
            resizeCommnetList();

            this.thumbnail_url = viewinfo.thumb_info.thumbnail_url;
            this.title = viewinfo.thumb_info.title;
            this.first_retrieve = time_format.format(viewinfo.thumb_info.first_retrieve);
            this.view_counter = viewinfo.thumb_info.view_counter;
            this.comment_num = viewinfo.thumb_info.comment_num;
            this.mylist_counter = viewinfo.thumb_info.mylist_counter;
            this.description = viewinfo.thumb_info.description;

            sync_comment_scroll.setComments(viewinfo.commnets);

            this.refs.dt.setData(viewinfo.commnets);

            this.update();
        });

        obs.on("seek_update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommnetIndex(current_sec);
            this.refs.dt.scrollto(comment_index);
        });

        this.on("mount", () => {                 
            updateSyncCommentCheckBox();
        });
        
        obs.on("pageResizedEvent", (size)=> {
            resizeCommnetList();
        });
    </script>
</viewinfo-page>