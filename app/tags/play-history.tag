<play-history>
    <style scoped>
    </style>
    
    <base-datatable ref="dt" params={this.params}></base-datatable>

    <script>
        /* globals base_dir obs */
        const ipc = require("electron").ipcRenderer;
        require(`${base_dir}/app/tags/base-datatable.tag`);
        const time_format = require(`${base_dir}/app/js/time_format`);

        const row_img_width = 130;
        const row_hight = 100;

        // obs.on("load_play-data", (data_file_path)=> {
        // });
        this.setData = (datas) => {
            this.refs.dt.setData(datas);
        };

        this.updateData = (id, date, time) => {

        };
        
        const is_local = (url) => {
            
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
                // exclude: [0],
                // tableWidthFixed: false
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
                // console.log("lib dblclickRow data:", data); 
                const video_id = data.id;
                // const video_file_path = db.getVideoPath(data.id);
                // const video_type = db.getVideoType(data.id);
                // const commnets = db.findComments(data.id);
                // let thumb_info = db.findThumbInfo(data.id);
                // thumb_info.thumbnail_url = data.image;

                // // const video_tags = db.getVideoTags(data.id);
                // const send_data = {
                //     video_data: {
                //         src: video_file_path,
                //         type: video_type,
                //         commnets: commnets
                //     },
                //     viweinfo: {
                //         thumb_info:thumb_info,
                //         commnets: commnets
                //     }
                // };       
                ipc.send("request-player", video_id);
            }
        };

        this.on("mount", () => {

        });
    </script>
</play-history>
