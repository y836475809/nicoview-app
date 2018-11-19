<library-page>
    <style scoped>
        :scope {
            --datatable-border-color: gray;
            /* width: 100%; */
            /* height: 100%; */
            --right-width: 200px;
            --search-input-width: 200px;
            --search-button-size: 25px;
            display: flex;
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
 
        .gutter {    
            width: 4px;
            border-left: 1px solid var(--control-border-color);
        } 
        .split.left{
            width: var(--right-width);
        }
        .split.right{
            width: calc(100% - var(--right-width));
        }

        .library-info{
            display: flex;
        }
        .library-item-info{
            height: 25px;
            line-height: 25px;
            vertical-align: middle;
            user-select: none;
        }
        .library-search{
            display: flex;
            width: calc(var(--search-input-width) + var(--search-button-size) + 6px);
            margin: 0;
            margin-left: auto;
            margin-right: 15px;
            margin-bottom: 4px;     
        }
        .library-search > button{ 
            margin: auto;
            width: var(--search-button-size);
            height: var(--search-button-size);
        }
        .library-search-input{
            width: var(--search-input-width);
            height: var(--search-button-size);
        }
        .library-search > button > span {
            margin: 0;
            top: -5px;
            left: -10px;
            color: black;
            transform: scale(0.5);
        }
    </style>

    <div class="split left">
        <library-sidebar></library-sidebar>
    </div>
    <div class="gutter"></div>
    <div class="split right">
        <div ref="base" class="table-base">
            <div class="library-info">
                <div class="library-item-info">num of items {this.num_items}</div>
                <div class="library-search">
                    <input type="search" class="library-search-input" onkeydown={onkeydownSearchInput} />
                    <button title="test" onclick={onclickAdd}><span class="icono-plus"></span></button>
                </div>
            </div>
            <base-datatable ref="dt" params={this.params}></base-datatable>
        </div>
    </div>

<script>
    /* globals base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const ipc = require("electron").ipcRenderer;
    const DB = require(`${base_dir}/app/js/db`).DB;
    const time_format = require(`${base_dir}/app/js/time_format`);

    require(`${base_dir}/app/tags/base-datatable.tag`);  
    require(`${base_dir}/app/tags/library-sidebar.tag`);  

    // const menu2 = new Menu();
    // menu2.append(new MenuItem({
    //     label: "Play", click() {
    //         console.log("lib context menu data=");
    //     }
    // }));
    this.onkeydownSearchInput = (e) => {
        if(e.keyCode===13){
            const param = e.target.value;
            search_dt(param);
        }
    };
    this.onclickAdd = () => {
        const search_elm = this.root.querySelector(".library-search-input");
        const param = search_elm.value;
        if(!param){
            return;
        }
        obs.trigger("on_add_search_item", param);
    };
    obs.on("on_change_search_item", (param)=> {
        search_dt(param);
    });

    this.num_items = 0;

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
                    // tags: value["tags"]
                );
            });

            this.refs.dt.setData(datas);
            this.num_items = datas.length;
            this.update();
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
            { title: "time" },
            // { title: "tags" },
        ],
        columnDefs: [
            { width:100, targets: [1,2,3,4,5,6] },
            {
                targets: 0,
                orderable: false,
                searchable: false,
                width: 130,
                data: "image",
                render: function (data, type, row, meta) {
                    return `<img src="${data}" width="130" height="100">`;
                },
            },
            { targets: 1, data: "id" },
            { targets: 2, data: "name" },
            { 
                targets: 3, 
                searchable: false,
                data: "creation_date" ,
                render: function (data, type, row, meta) {
                    return time_format.toDate(data);
                },
            },
            { 
                targets: 4, 
                searchable: false,
                data: "pub_date",
                render: function (data, type, row, meta) {
                    return time_format.toDate(data);
                },
            },
            { targets: 5, searchable: false, data: "play_count" },
            { 
                targets: 6, 
                searchable: false,
                data: "time",
                render: function (data, type, row, meta) {
                    return time_format.toPlayTime(data);
                },
            },
            // { 
            //     targets: 7, 
            //     data: "tags",
            //     render: function (data, type, row, meta) {
            //         return `<div style="height:100px;overflow: hidden;overflow-y: auto;">${data}</div>`;
            //     },
            // }
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
            displayBuffer: 50
        },
        autoWidth: false,
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
            let thumb_info = db.findThumbInfo(data.id);
            thumb_info.thumbnail_url = data.image;

            // const video_tags = db.getVideoTags(data.id);
            const send_data = {
                video_data: {
                    src: video_file_path,
                    type: video_type,
                    commnets: commnets
                },
                viweinfo: {
                    thumb_info:thumb_info,
                    commnets: commnets
                }
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

    this.on("mount", () => {
        this.refs.dt.showContextMenu=(e)=>{
            e.preventDefault();
            menu.popup({window: remote.getCurrentWindow()});
        };       
    });

    const resizeDataTable = (size) => {
        if(this.refs == undefined){
            return;
        }
        const dt_root = this.refs.dt.root;
        const info_elm = this.root.querySelector(".library-info");
        const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
        const margin = 4;
        const exclude_h = 
            + info_elm.offsetHeight 
            + dt_elm.offsetHeight 
            + margin;
        let ch = this.refs.base.clientHeight;
        if(size){
            ch = size.h;
        }
        this.refs.dt.ress({
            w: null,
            h: ch - exclude_h,
        });  
    };

    obs.on("load_data", (data_file_path)=> {
        resizeDataTable();
        
        this.loadData(data_file_path);
    });

    obs.on("resizeEndEvent", (size)=> {
        resizeDataTable(size);
    });

    let pre_s_param = "";
    let sc_map = new Map();
    const search_dt = (param) => {
        const dt_root = this.refs.dt.root;
        let s = dt_root.querySelector("div.dataTables_scrollBody");
        const scroll_top = s.scrollTop;
        sc_map.set(pre_s_param, scroll_top);

        this.refs.dt.search(param);
        if(sc_map.has(param)){
            // s.scrollTop(sc_map.get(param));
            this.refs.dt.scrollto2(sc_map.get(param));
        }

        pre_s_param = param;
    };
    obs.on("library_dt_search", (param)=> {
        search_dt(param);
        // const dt_root = this.refs.dt.root;
        // let s = dt_root.querySelector("div.dataTables_scrollBody");
        // const scroll_top = s.scrollTop;
        // sc_map.set(pre_s_param, scroll_top);

        // this.refs.dt.search(param);
        // if(sc_map.has(param)){
        //     // s.scrollTop(sc_map.get(param));
        //     this.refs.dt.scrollto2(sc_map.get(param));
        // }

        // pre_s_param = param;
    });
</script>
</library-page>