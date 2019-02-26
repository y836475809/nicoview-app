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

    #search-grid-container input[type=radio] {
        display: none; 
    }
    #search-grid-container input[type=radio]:checked + .button{
        background: gray;
    }
    .label{   
        display: inline-block;
        height: 30px;
        width: 100px;      
    }
    .label .button{
        border: 1px solid gray;    
        box-sizing: border-box;
        border-radius: 2px;
        padding-left: 10px;
        height: 100%;
        width: 100%;
    }
    .label .button .icono-caretUp{
        margin-left: auto;
    }
    .label .button .icono-caretDown {
        margin-left: auto;
        margin-bottom: 5px;
    }
</style>

<div id="search-grid-container">
    <label class="label">
        <input type="radio" name="sort_select" class="radio" onclick={this.onclickPageSelect.bind(this,0)}> 
                                        //TODO:
        <span class="button">text1<span id="ppp" class="icono-caretUp"></span></span>
    </label>
    <label class="label">
        <input type="radio" name="sort_select" class="radio" onclick={this.onclickPageSelect.bind(this,1)}> 
        <span class="button">text2<span class="icono-caretUp"></span></span>
    </label>
    <label class="label">
        <input type="radio" name="sort_select" class="radio" onclick={this.onclickPageSelect.bind(this,2)}> 
        <span class="button">text3<span class="icono-caretUp"></span></span>
    </label>
    <div id="search-grid"></div>
</div>  

<script>
    /* globals app_base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const { GridTable } = require(`${app_base_dir}/js/gridtable`);

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

    //TODO:
    this.onclickPageSelect = (index, e) => {
        // select_page(index);
        const elm = this.root.querySelector("#ppp");
        elm.classList.remove("icono-caretUp");
        elm.classList.add("icono-caretDown");
        // e.target.classList.add("flow");
    };

    const resizeGridTable = () => {
        const container = this.root.querySelector("#search-grid-container");
        grid_table.resizeFitContainer(container);
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

        resizeGridTable();
    });

    obs.on("resizeEndEvent", (size)=>{
        resizeGridTable();
    });
</script>
</search-page>