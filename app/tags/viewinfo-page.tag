<viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            --info-height: 100px;
            --description-height: 100px;
            grid-template-rows: var(--info-height) var(--description-height) 1fr;
            grid-template-columns: 1fr 1fr;  
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
            --row-height: 25px;
            font-family: Verdana, Geneva, Tahoma, sans-serif;
            font-size: 12px;
        }    
        #info{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            background-color: darkgray;
            display: flex;
        } 
        #info .right{
            margin-left: 5px;
            white-space: nowrap;
            overflow-x: hidden;
            width: 100%;
        }
        
        #description{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            background-color: rgb(167, 133, 133);
        } 
        #comment-list{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color: #cccccc;
            /* border: 2px solid #111; */
        }
        table.dataTable tbody td {
            padding: 0px;
            margin: 0px;
            height: var(--row-height);
        }
        table tbody tr td:nth-of-type(2) {
            max-width: 200px;
            overflow: hidden; 
            text-overflow: ellipsis;
            white-space: nowrap; 
        }
        table tbody tr td:nth-of-type(1),
        table tbody tr td:nth-of-type(3),
        table tbody tr td:nth-of-type(4),
        table tbody tr td:nth-of-type(5),
        table tbody tr td:nth-of-type(6) {
            overflow: hidden; 
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: center;
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
    </style>
    
    <div id="info">
        <div>
            <img src={this.thumbnail_url} alt="test" width="100" height="70">
        </div>
        <div class="right">
            <div>{this.title}</div>
            <div>{this.message.POSTED} {this.first_retrieve}</div>
            <div>{this.message.VIEW} {this.view_counter}</div>
            <div>{this.message.COMMENT} {this.comment_num}</div>
            <div>{this.message.MYLIST} {this.mylist_counter}</div>
        </div>
    </div>
    <div ref="description" id="description">
        {this.description}
    </div>
    <div ref="base" id="comment-list">
        <base-datatable ref="dt" params={this.params} ></base-datatable>
    </div>

    <script>
        /* globals obs */
        const time_format = require("../js/time_format");
        this.message = require("../js/message");
        require("./base-datatable.tag");

        let info_height = 0;
        let description_height = 0;

        this.thumbnail_url = "";
        this.title =  "";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_num = 0;
        this.mylist_counter = 0;
        this.description = "";

        const pp = (e) =>{
            console.log("pp = ", e);
        };

        const row_height = 25;

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
                { className: "dt-head-nowrap", targets: "_all" },
                {
                    targets: 0,
                    orderable: false,
                    data: "vpos",
                    render: function (data, type, row, meta) {
                        return time_format.toPlayTime(data*10);
                    },
                },
                { targets: 1, data: "text"},
                { targets: 2, data: "user_id" },
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
                // exclude: [0],
                tableWidthFixed: false
            },
            // dom: "Zlfrtip",
            dom: "rt",
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
            const dt_root = this.refs.dt.root;
            const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
            const margin = 10;
            const exclude_h = dt_elm.offsetHeight + margin;
            const h = this.refs.base.clientHeight - exclude_h;
            this.refs.dt.ress({
                w: null,
                h: h,
            });

            this.thumbnail_url = viewinfo.thumb_info.thumbnail_url;
            this.title = viewinfo.thumb_info.title;
            this.first_retrieve = time_format.format(viewinfo.thumb_info.first_retrieve);
            this.view_counter = viewinfo.thumb_info.view_counter;
            this.comment_num = viewinfo.thumb_info.comment_num;
            this.mylist_counter = viewinfo.thumb_info.mylist_counter;
            this.description = viewinfo.thumb_info.description;

            this.refs.dt.setData(viewinfo.commnets);

            this.update();
        });

        obs.on("on_scroll", (index)=> {
            this.refs.dt.scrollto(index);
        });

        // this.description.innerHTML = "<a href=# onclick={pp}>test</a>";
        this.on("mount", () => {     
            const css_style = getComputedStyle(this.root);
            info_height = parseInt(css_style.getPropertyValue("--info-height"));
            description_height = parseInt(css_style.getPropertyValue("--description-height"));
 
            // this.description = "<a href=\"http://www.newcredge.com/\">test</a>";
            // let elm = document.getElementById("description");
            // elm.innerHTML = "<a href=# onclick={pp}>test</a>";
            this.root.querySelectorAll(".dlink").forEach((link) => {
                link.addEventListener("click", pp);
            });       
        });
        obs.on("pageResizedEvent", (size)=> {
            if(this.refs!==undefined){
                const dt_root = this.refs.dt.root;
                const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
                const margin = 10;
                const exclude_h = info_height + description_height + dt_elm.offsetHeight + margin;
                const h = this.root.clientHeight - exclude_h;
                this.refs.dt.ress({
                    w: size.w,
                    h: h
                });
            }
        });
    </script>
</viewinfo-page>