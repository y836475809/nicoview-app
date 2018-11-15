<library-page>
    <style scoped>
        :scope {
            --datatable-border-color: gray;
            /* width: 100%; */
            /* height: 100%; */
            --right-width: 200px;
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
        .library-item-info{
            height: 25px;
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

        .sideMenu > h2 {
            font-size: 1.5em;
            background-color: #2d8fdd;
            color: white;
            text-align: center;
            height: 45px;
            line-height: 45px;
            margin: 0;
            user-select: none;
        }
        .search-item {
            border-bottom: 1px solid gray;
            padding-left: 10px;
            background-color: white;
            line-height: 30px;
            user-select: none;
            cursor: pointer;
            display: flex;
        }
        .search-item > div {
            margin: 0;
            width: 100%;
            /* background-color: blue; */
        }
        .search-item:first-child {
            border-top: 1px solid gray;
           }
        .search-item:hover {
            background-color: #eee;
        }
        .search-item.select{
            background: lightgrey;
            opacity: 0.7;
        }
        div.search-item-del {
            margin: 0;
            margin-left: auto;
            width: 30px;
            color: gray;
            transform: scale(0.5) rotate(45deg);
        }
    </style>

    <div class="split left">
        <div class="sideMenu" onmouseup={sidebar_mouseup}>
            <h2>Search</h2>
            <div class="search items">
                <div class="search-item" onclick={onclickClearSearch}>Clear</div>
                <div class="search-item" each="{ task, i in tasks }" data-id={i}>
                    <div onmouseup={search_item_mouseup} onclick={onclickItem}>{ task.label }</div>
                    <!-- <div class="search-item-del" data-id={i} onclick={onclickDelItem}><span class="icono-cross"></span></div> -->
                    <div class="search-item-del icono-cross" data-id={i} onclick={onclickDelItem}></div>
                </div>
            </div>
        </div>
    </div>
    <div class="gutter"></div>
    <div class="split right">
        <div ref="base" class="table-base">
            <div class="library-item-info">num of items {this.num_items}</div>
            <input type="search" class="library-search-input" onkeydown={onkeydownSearchInput} />
            <button onclick={onclickAdd}>test</button>
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
    const Sortable = require("sortablejs");
    const path = require("path");
    const pref = require("../js/preference");
    const serializer = require("../js/serializer");
    require(`${base_dir}/app/tags/base-datatable.tag`);  

    // const menu2 = new Menu();
    // menu2.append(new MenuItem({
    //     label: "Play", click() {
    //         console.log("lib context menu data=");
    //     }
    // }));

    let sortable = null;

    // this.tasks = [
    //     { label: "all", param: "" },
    //     { label: "sm1", param: "sm1" },
    //     { label: "sm5", param: "sm5" },
    // ];
    const seach_path = path.join(pref.getDataPath(), "seach.json");
    try {
        this.tasks = serializer.load(seach_path);
    } catch (error) {
        this.tasks = [];
    }

    this.search_item_mouseup = (e) => {
        console.log("search_item_mouseup=", e);
        if(e.which!==1){
            return;
        }
        console.log("index=", e);
        
        let elms = this.root.querySelectorAll(".search-item.select");
        elms.forEach((elm) => {
            elm.classList.toggle("select");  
        });
        e.target.classList.toggle("select"); 
        
        const param = e.item.task.param;
        search_dt(param);
        
    };
    // this.sidebar_mouseup = (e) => {
    //     if(e.which===3){
    //         menu2.popup({window: remote.getCurrentWindow()});
    //     }
    // };
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
        this.tasks.push({ label: param, param: param });
        const tmp = this.tasks.slice();
        this.tasks = [];
        this.update();
        this.tasks = tmp.slice();
        this.update();

        serializer.save(seach_path, this.tasks, (error)=>{
            if(error){
                console.log(error);
            }
        });
    };
    this.onclickDelItem = (e) => {
        
        const del_index = parseInt(e.target.getAttribute("data-id"));
        console.log("onclickDelItem=", e);
        console.log("onclickDelItem del_index=", del_index);
        let tmp = [];
        this.tasks.forEach((task, i) => {
            if(i!==del_index){
                tmp.push(task);
            }    
        });
        
        this.tasks = [];
        this.update();
        this.tasks = tmp.slice();
        this.update();
        
        serializer.save(seach_path, this.tasks, (error)=>{
            if(error){
                console.log(error);
            }
        });
    };
    this.onclickClearSearch = () =>{
        search_dt("");
    };

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
                data: "creation_date" ,
                render: function (data, type, row, meta) {
                    return time_format.toDate(data);
                },
            },
            { 
                targets: 4, 
                data: "pub_date",
                render: function (data, type, row, meta) {
                    return time_format.toDate(data);
                },
            },
            { targets: 5, data: "play_count" },
            { 
                targets: 6, 
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
        dom: "Zfrt",    
        scrollX: true,
        scrollY: "100px" ,
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
        // const el = document.getElementById("items");
        const el = this.root.querySelector(".search.items");
        sortable = Sortable.create(el, {
            onSort: (evt) => {
                const  order = sortable.toArray();
                console.log("onSort sortable array=", order);

                let sorted_items = [];
                order.forEach(i => {
                    sorted_items.push(this.tasks[i]);
                });
                this.tasks = [];
                this.update();

                this.tasks = sorted_items.slice();
                this.update();

                serializer.save(seach_path, this.tasks, (error)=>{
                    if(error){
                        console.log(error);
                    }
                });
            }
        });

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
        const dt_elm1 = dt_root.querySelector("div.dataTables_filter");
        const dt_elm3 = dt_root.querySelector("div.dataTables_scrollHead");
        const info_elm = this.root.querySelector(".library-item-info");
        const margin = 10;
        const exclude_h = dt_elm1.offsetHeight 
            + dt_elm3.offsetHeight 
            + info_elm.offsetHeight 
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