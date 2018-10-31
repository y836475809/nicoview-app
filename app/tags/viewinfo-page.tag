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
        }
        #info{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            background-color: darkgray;
        } 
        #description{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            background-color: rgb(167, 133, 133);
        } 
        #comment-list{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color: rgb(139, 39, 39);
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
        }
    </style>
    
    <div id="info">test1</div>
    <div ref="description" id="description">test2</div>
    <div ref="base" id="comment-list">
        <base-datatable ref="dt" params={this.params}></base-datatable>
    </div>

    <script>
        /* globals obs */
        const time_format = require("../js/time_format");
        require("./base-datatable.tag");

        const pp = (e) =>{
            console.log("pp = ", e);
        };

        this.params = {};
        this.params.dt = {
            columns : [
                { title: "time" },
                { title: "comment" },
                { title: "user_id" },
                { title: "pub_date" },
                { title: "no" },
                { title: "option" }
            ],
            columnDefs: [
                {
                    targets: 0,
                    orderable: false,
                    data: "vpos",
                    render: function (data, type, row, meta) {
                        return time_format.toPlayTime(data*10);
                    },
                },
                { targets: 1, data: "text" },
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
            },
            // dom: "Zlfrtip",
            dom: "Zrt",
            scrollX: true,
            scrollY: "100px",
            scrollCollapse:false,
            scroller: true,
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

            this.refs.dt.setData(viewinfo.commnets);
        });

        obs.on("on_scroll", (index)=> {
            this.refs.dt.scrollto(index);
        });

        // this.description.innerHTML = "<a href=# onclick={pp}>test</a>";
        this.on("mount", () => {      
            // this.description = "<a href=\"http://www.newcredge.com/\">test</a>";
            // let elm = document.getElementById("description");
            // elm.innerHTML = "<a href=# onclick={pp}>test</a>";
            this.root.querySelectorAll(".dlink").forEach((link) => {
                link.addEventListener("click", pp);
            });       
        });
        obs.on("pageResizedEvent", (size)=> {
            if(this.refs!==undefined){
                // const ch = this.root.clientHeight;
                // const margin = 10;
                // const exclude_h = 200 + margin + 40;
                const dt_root = this.refs.dt.root;
                const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
                const margin = 10;
                const exclude_h = dt_elm.offsetHeight + margin;
                const h = this.refs.base.clientHeight - exclude_h;
                this.refs.dt.ress({
                    w: size.w,
                    h: h
                });
            }
        });
    </script>
</viewinfo-page>