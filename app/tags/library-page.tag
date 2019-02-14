<library-page>
    <style scoped>
        :scope {
            /* width: 100%; */
            /* height: 100%; */
            --right-width: 200px;
            --search-input-width: 200px;
            --search-button-size: 25px;
            display: flex;
            height: 100%;
        }

        .gutter {    
            width: 4px;
            border-left: 1px solid var(--control-border-color);
            background-color: var(--control-color);
        } 
        .split.left{
            background-color: var(--control-color);
            width: var(--right-width);
        }
        .split.right{
            background-color: var(--control-color);
            width: calc(100% - var(--right-width));
            height: 100%;
            overflow-y: hidden;
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

        .slick-cell.l2.r2 {
            white-space: normal;
        }
    </style>

    <div class="split left">
        <library-sidebar></library-sidebar>
    </div>
    <div class="gutter"></div>
    <div class="split right">
        <div class="library-info">
            <div class="library-item-info">num of items {this.num_items}</div>
            <div class="library-search">
                <input type="search" class="library-search-input" onkeydown={onkeydownSearchInput} />
                <button title="test" onclick={onclickAdd}><span class="icono-plus"></span></button>
            </div>
        </div>
        <div id="library-grid-container">
            <div id="library-grid"></div>
        </div>
    </div>

<script>
    /* globals base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const ipc = require("electron").ipcRenderer;
    const { GridTable } = require("../js/gridtable");

    require(`${base_dir}/app/tags/library-sidebar.tag`);  
    
    this.num_items = 0;

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
        _saveColumnWidth: true,
        _saveSort: true,
    };   
    const grid_table = new GridTable("library-grid", columns, options);

    this.onkeydownSearchInput = (e) => {
        if(e.keyCode===13){
            const param = e.target.value;
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
        grid_table.filterData(param);
    });

    const loadLibraryItems = (items)=>{
        grid_table.setData(items);
        this.num_items = items.length;

        this.update();
    };

    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            const items = grid_table.getSelectedDatas();
            console.log("lib context menu data=", items);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));

    this.on("mount", () => {
        grid_table.init();

        grid_table.setFilter((column_id, value, word) => { 
            if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                return true;
            }   
            return false; 
        });

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
        
        resizeGridTable();

        ipc.send("get-library-items");
    });
    ipc.on("get-library-items-reply", (event, library_items) => {     
        loadLibraryItems(library_items);
    });    

    const resizeGridTable = () => {
        const container = this.root.querySelector("#library-grid-container");
        grid_table.resizeFitContainer(container);
    };

    obs.on("resizeEndEvent", (size)=> {
        resizeGridTable();
    });

    obs.on("library_dt_search", (param)=> {
        grid_table.filterData(param);
    });
</script>
</library-page>