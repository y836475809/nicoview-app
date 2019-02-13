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
            background-color: var(--control-color);
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
        #myGrid {
            border: 1px solid #fa0303;
            width: 90%;
            height: 80%;
        }
        .slick-cell.active {
            border-style:initial;
            border: 1px solid transparent;
            border-right: 1px dotted silver;
            border-bottom-color: silver;
        }
        .slick-cell.selected {
            background-color: #6190cd6b;
        }
        .slick-cell.l2.r2 {
            white-space: normal;
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
            <!-- <base-datatable ref="dt" params={this.params}></base-datatable> -->
            <div id="myGrid"></div>
        </div>
    </div>

<script>
    /* globals base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const ipc = require("electron").ipcRenderer;
    // const time_format = require(`${base_dir}/app/js/time_format`);
    const { GridTable } = require("../js/gridtable");

    // require(`${base_dir}/app/tags/base-datatable.tag`);  
    require(`${base_dir}/app/tags/library-sidebar.tag`);  

    // const row_hight = 100;
    // const row_img_width = 130;

    // const menu2 = new Menu();
    // menu2.append(new MenuItem({
    //     label: "Play", click() {
    //         console.log("lib context menu data=");
    //     }
    // }));
    const columns = [
        {id: "thumb_img", name: "image", height:100, width: 130},
        {id: "id", name: "id",sortable: true},
        {id: "name", name: "name", sortable: true},
        {id: "creation_date", name: "creation date", sortable: true},
        {id: "pub_date", name: "pub date", sortable: true},
        {id: "play_count", name: "play count", sortable: true},
        {id: "play_time", name: "time", sortable: true}
    ];
    const options = {
        rowHeight: 100,
        _saveState: true,
    };   
    const grid_table = new GridTable("myGrid", columns, options);
    // grid_table.init();

    this.onkeydownSearchInput = (e) => {
        if(e.keyCode===13){
            const param = e.target.value;
            // search_dt(param);
            grid_table.filterData(param);
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
        // search_dt(param);
        grid_table.filterData(param);
    });

    this.num_items = 0;

    const loadLibraryItems = (items)=>{
        // resizeDataTable();

        // this.refs.dt.setData(items);
        grid_table.setData(items);
        this.num_items = items.length;

        this.update();
    };


    // this.params = {};
    // this.params.dt = {
    //     columns : [
    //         { title: "image" },
    //         { title: "id" },
    //         { title: "name" },
    //         { title: "creation_date" },
    //         { title: "pub_date" },
    //         { title: "play_count" },
    //         { title: "time" },
    //     ],
    //     columnDefs: [
    //         { width:100, targets: [1,2,3,4,5,6] },
    //         {
    //             targets: 0,
    //             orderable: false,
    //             searchable: false,
    //             width: row_img_width,
    //             data: "image",
    //             render: function (data, type, row, meta) {
    //                 return `<img src="${data}" width="${row_img_width}" height="${row_hight}">`;
    //             },
    //         },
    //         { targets: 1, data: "id" },
    //         { targets: 2, data: "name" },
    //         { 
    //             targets: 3, 
    //             searchable: false,
    //             data: "creation_date" ,
    //             render: function (data, type, row, meta) {
    //                 return time_format.toDate(data);
    //             },
    //         },
    //         { 
    //             targets: 4, 
    //             searchable: false,
    //             data: "pub_date",
    //             render: function (data, type, row, meta) {
    //                 return time_format.toDate(data);
    //             },
    //         },
    //         { targets: 5, searchable: false, data: "play_count" },
    //         { 
    //             targets: 6, 
    //             searchable: false,
    //             data: "time",
    //             render: function (data, type, row, meta) {
    //                 return time_format.toPlayTime(data);
    //             },
    //         },
    //         { 
    //             targets: 7, 
    //             data: "tags",
    //             visible: false
    //         }
    //     ], 
    //     colResize : {
    //         handleWidth: 10,
    //         // exclude: [0],
    //         // tableWidthFixed: false
    //     },

    //     dom: "Zrt",    
    //     scrollX: true,
    //     scrollY: true,
    //     scrollCollapse:false,
    //     scroller: {
    //         displayBuffer: 10
    //     },
    //     autoWidth: false,
    //     paging: true,
    //     // displayLength:100,
    //     // lengthMenu: [ 100, 200, 300, 400, 500 ],
    //     deferRender: true,
    //     stateSave: true,
    //     dblclickRow: function(data){    
    //         const video_id = data.id;
    //         const library_data = ipc.sendSync("get-library-data", video_id);
    //         const thumb_info = library_data.viweinfo.thumb_info;   
    //         ipc.send("add-history-items", {
    //             image: thumb_info.thumbnail_url, 
    //             id: video_id, 
    //             name: thumb_info.title, 
    //             url: library_data.video_data.src
    //         });
    //         ipc.send("request-show-player", library_data);
    //     }
    // };

    // let self = this;
    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            // const items = self.refs.dt.getSelectedDatas();
            const items = grid_table.getSelectedDatas();
            console.log("lib context menu data=", items);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));

    this.on("mount", () => {
        grid_table.init();
        // this.refs.dt.showContextMenu=(e)=>{
        //     e.preventDefault();
        //     menu.popup({window: remote.getCurrentWindow()});
        // };  
        grid_table.onDblClick((e, data)=>{
            console.log("onDblClick data=", data);
            const video_id = data.id;
            const library_data = ipc.sendSync("get-library-data", video_id);
            const thumb_info = library_data.viweinfo.thumb_info;   
            ipc.send("add-history-items", {
                image: thumb_info.thumbnail_url, 
                id: video_id, 
                name: thumb_info.title, 
                url: library_data.video_data.src
            });
            ipc.send("request-show-player", library_data);
        });
        
        grid_table.onContextMenu((e)=>{
            menu.popup({window: remote.getCurrentWindow()});
        });   
        ipc.send("get-library-items");
    });
    ipc.on("get-library-items-reply", (event, library_items) => {     
        loadLibraryItems(library_items);
    });    

    const resizeDataTable = (size) => {
        // if(this.refs == undefined){
        //     return;
        // }
        // const dt_root = this.refs.dt.root;
        const info_elm = this.root.querySelector(".library-info");
        // const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
        // const margin = 4;
        const exclude_h = 
            + info_elm.offsetHeight;
        //     + dt_elm.offsetHeight 
        //     + margin;
        let ch = this.refs.base.clientHeight;
        // if(size){
        //     ch = size.h;
        // }
        // this.refs.dt.setScrollSize({
        //     w: null,
        //     h: ch - exclude_h,
        // });  
        const new_szie = {
            height: ch - exclude_h - 5,
            width: this.refs.base.clientWidth - 5
        };
        grid_table.resize(new_szie);
    };

    obs.on("resizeEndEvent", (size)=> {
        resizeDataTable(size);
    });

    // let pre_s_param = "";
    // let sc_map = new Map();
    // const search_dt = (param) => {
    //     const scroll_top = this.refs.dt.getScrollTop();
    //     sc_map.set(pre_s_param, scroll_top);

    //     this.refs.dt.search(param);
    //     if(sc_map.has(param)){
    //         // s.scrollTop(sc_map.get(param));
    //         this.refs.dt.setScrollTop(sc_map.get(param));
    //     }

    //     pre_s_param = param;
    // };
    obs.on("library_dt_search", (param)=> {
        // search_dt(param);
        grid_table.filterData(param);
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