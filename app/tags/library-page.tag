<library-page id="library-page">
    <style scoped>
        :scope .table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>

<div class="table-base">
    <base-datatable ref="dt" params={this.params}></base-datatable>
</div>

<script>
    /* globals base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const ipc = require("electron").ipcRenderer;
    const DB = require(`${base_dir}/app/js/db`).DB;
    const time_format = require(`${base_dir}/app/js/time_format`);
    
    require(`${base_dir}/app/tags/base-datatable.tag`);  

    let db = new DB();

    this.loadData = (data_file_path)=>{
        if(!data_file_path){ 
            return;
        }

        try {
            // const dirpath = serializer.load(`${data_path}/db/dirpath.json`);
            // const video = serializer.load(`${data_path}/db/video.json`);
            // db.setData(dirpath, video);
            db.load(data_file_path);
            const video = db.video_info;

            let datas = new Array();
            video.forEach((value, key) => {
                datas.push({
                    image: db.getThumbPath(key),
                    id: key,
                    name: value["video_name"],
                    creation_date: value["creation_date"],
                    pub_date: value["pub_date"],
                    play_count: value["play_count"],
                    time: value["time"]}
                );
            });

            this.refs.dt.setData(datas);
        } catch (error) {
            obs.trigger("on_error", error);  
        }
    };

    this.params = {};
    this.params.dt = {
        columns : [
            { title: "image" },
            { title: "id" },
            { title: "name" },
            { title: "creation_date" },
            { title: "pub_date" },
            { title: "play_count" },
            { title: "time" }
        ],
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                data: "image",
                render: function (data, type, row, meta) {
                    return `<img src="${data}" width="130" height="100">`;
                },
            },
            { targets: 1, data: "id" },
            { targets: 2, data: "name" },
            { 
                targets: 3, 
                data: "creation_date" ,
                render: function (data, type, row, meta) {
                    return time_format.format(data);
                },
            },
            { 
                targets: 4, 
                data: "pub_date",
                render: function (data, type, row, meta) {
                    return time_format.format(data);
                },
            },
            { targets: 5, data: "play_count" },
            { targets: 6, data: "time" }
        ], 
        colResize : {
            handleWidth: 10,
            exclude: [0],
        },
        dom: "Zlfrtip",  
        scrollY:"400px",
        scrollCollapse:false,
        autoWidth: true,
        paging: true,
        displayLength:100,
        lengthMenu: [ 100, 200, 300, 400, 500 ],
        deferRender: true,
        stateSave: true,
        dblclickRow: function(data){
            console.log("lib dblclickRow data:", data); 
            const video_file_path = db.getVideoPath(data.id);
            const video_type = db.getVideoType(data.id);
            const commnets = db.findComments(data.id);
            const thumb_info = db.findThumbInfo(data.id);
            // const video_tags = db.getVideoTags(data.id);
            const send_data = {
                video_data: {
                    src: video_file_path,
                    type: video_type,
                    commnets: []
                },
                thumb_info: thumb_info
            };       
            ipc.send("request-show-player", send_data);
        }
    };

    let self = this;
    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            const datas = self.refs.dt.getSelectedDatas();
            console.log("lib context menu data=", datas);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));

    this.on("mount", function () {
        this.refs.dt.showContextMenu=(e)=>{
            e.preventDefault();
            menu.popup({window: remote.getCurrentWindow()});
        };       
    });

    obs.on("load_data", (data_file_path)=> {
        this.loadData(data_file_path);
    });

    obs.on("pageResizedEvent", (size)=> {
        if(this.refs!==undefined){
            const dt_root = this.refs.dt.root;
            const dt_elm1 = dt_root.querySelector("div.dataTables_length");
            const dt_elm2 = dt_root.querySelector("div.dataTables_paginate");
            const dt_elm3 = dt_root.querySelector("div.dataTables_scrollHead");
            const margin = 10;
            const exclude_h = dt_elm1.offsetHeight + dt_elm2.offsetHeight + dt_elm3.offsetHeight + margin;
            this.refs.dt.ress({
                w: size.w,
                h: size.h - exclude_h,
            });
        }
    });
</script>
</library-page>