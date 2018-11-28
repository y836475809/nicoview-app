<play-history>
    <style scoped>
    </style>
    
    <base-datatable ref="dt" params={this.params}></base-datatable>

    <script>
        /* globals base_dir */
        const ipc = require("electron").ipcRenderer;
        require(`${base_dir}/app/tags/base-datatable.tag`);
        const time_format = require(`${base_dir}/app/js/time_format`);

        const row_img_width = 130;
        const row_hight = 100;

        this.setData = (datas) => {
            this.refs.dt.setData(datas);
        };

        this.updateData = (id, date, time) => {

        };

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
