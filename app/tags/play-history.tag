<play-history>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
        .table-base {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
            overflow-y: hidden;
        }
        table.dataTable tbody td {
            padding: 0px;
            margin: 0px;
            padding-left: 4px;
            padding-right: 4px;
        }
    </style>
    
    <div ref="base" class="table-base">
        <base-datatable ref="dt" params={this.params}></base-datatable>
    </div>

    <script>
        /* globals base_dir obs */
        const ipc = require("electron").ipcRenderer;
        require(`${base_dir}/app/tags/base-datatable.tag`);
        const time_format = require(`${base_dir}/app/js/time_format`);
        const serializer = require(`${base_dir}/app/js/serializer`);

        const history_max_size = 100;
        const row_img_width = 130;
        const row_hight = 100;

        let history_items = [];

        const loadHistory = (file_path) => {
            resizeDataTable();
            
            try {
                history_items = serializer.load(file_path);
                history_items.sort((a, b) => {
                    return a.play_date < b.play_date;
                });
                this.refs.dt.setData(history_items);      
            } catch (error) {
                console.error(error);
                // obs.trigger("on_error", error);  
            }
        };

        const addHistory = (image, id, name, url) => {
            if(history_items.length >= history_max_size){
                history_items.pop();
            }
            history_items.unshift({
                image: image,
                id: id,
                name: name,
                play_date: Date.now(), 
                play_time: 0,
                url: url                
            });
            this.refs.dt.setData(history_items);
        };

        const setHistory = (image, id, name, url) => {
            const index = history_items.findIndex(item => item.id === id);
            if(index === -1){
                addHistory(image, id, name, url);
            }else{
                let item = history_items[index];
                item.play_date = Date.now();
                if(url != item.url){
                    item.image = image;
                    item.url = url;
                }
                history_items.sort((a, b) => {
                    return a.play_date < b.play_date;
                });
                this.refs.dt.setData(history_items);
            }
        };

        obs.on("load_history", (file_path)=> {
            loadHistory(file_path);
        });

        obs.on("save_history", (file_path) => {
            if(!file_path){
                return;
            }

            serializer.save(file_path, history_items, (error)=>{
                if(error){
                    console.error(error);
                }
            });
        });

        obs.on("set_history", (image, id, name, url)=> {
            setHistory(image, id, name, url);
        });      

        const resizeDataTable = (size) => {
            if(this.refs == undefined){
                return;
            }
            const dt_root = this.refs.dt.root;
            const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
            const margin = 4;
            const exclude_h = 
                + dt_elm.offsetHeight 
                + margin;
            let ch = this.refs.base.clientHeight;
            if(size){
                ch = size.h;
            }
            this.refs.dt.setScrollSize({
                w: null,
                h: ch - exclude_h,
            });  
        };

        obs.on("resizeEndEvent", (size)=> {
            resizeDataTable(size);
        });

        this.params = {};
        this.params.dt = {
            columns : [
                { title: "image" },
                { title: "id" },
                { title: "name" },
                { title: "play_date" },
                { title: "play_time" },
                { title: "url" },
            ],
            columnDefs: [
                { width:100, targets: [1,2,3,4] },
                {
                    targets: 0,
                    orderable: false,
                    searchable: false,
                    width: row_img_width,
                    data: "image",
                    render: function (data, type, row, meta) {
                        return `<img src="${data}" width="${row_img_width}" height="${row_hight}">`;
                    },
                },
                { targets: 1, data: "id" },
                { targets: 2, data: "name" },
                { 
                    targets: 3, 
                    searchable: false,
                    data: "play_date" ,
                    render: function (data, type, row, meta) {
                        return time_format.toDate(data);
                    },
                },
                { 
                    targets: 4, 
                    searchable: false,
                    data: "play_time",
                    render: function (data, type, row, meta) {
                        return time_format.toPlayTime(data);
                    },
                },
                { targets: 5, searchable: false, data: "url" }
            ], 
            colResize : {
                handleWidth: 10,
            },

            dom: "Zrt",    
            scrollX: true,
            scrollY: true,
            scrollCollapse:false,
            scroller: {
                displayBuffer: 10
            },
            autoWidth: false,
            deferRender: true,
            stateSave: true,
            dblclickRow: function(data){
                const video_id = data.id;
                const url = data.url;    
                ipc.send("request-play", video_id, url);
            }
        };

        this.on("mount", () => {
        });
    </script>
</play-history>
