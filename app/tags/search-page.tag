<search-page>
<style scoped>
    :scope{
        width: 100%;
        height: 100%;
    }

    #search-grid-container {
        background-color: var(--control-color);
        width: 100%;
        height: 100%;
    }
</style>

<div id="search-grid-container">
    <div id="search-grid"></div>
</div>  

<script>
    /* globals obs $ */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const { GridTable } = require("../js/gridtable");

    const columns = [
        {id: "thumb_img", name: "image", height:100, width: 130},
        {id: "id", name: "id"},
        {id: "info", name: "info"},
        {id: "pub_date", name: "pub date"},
        {id: "state", name: "state"}
    ];
    const options = {
        rowHeight: 100,
        _saveColumnWidth: true,
    };   
    const grid_table = new GridTable("search-grid", columns, options);

    this.serach = () => {
        console.log("serach");
    };

    const resizeDataTable = (size) => {
        const container = this.root.querySelector("#search-grid-container");
        const new_height = $(window).height() - container.offsetTop - 5;
        const new_width = container.clientWidth - 5;
        const new_szie = {
            height: new_height,
            width: new_width
        };
        grid_table.resize(new_szie);
    };

    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            const items = grid_table.getSelectedDatas();
            console.log("search context menu data=", items);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));
    
    this.on("mount", () => {
        grid_table.init();

        grid_table.onDblClick((e, data)=>{
        });

        resizeDataTable();
    });

    obs.on("resizeEndEvent", (size)=>{
        resizeDataTable();
    });
</script>
</search-page>