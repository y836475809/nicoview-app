<search-page>
<style scoped>
    :scope{
        width: 100%;
        height: 100%;
    }

    .search-container {
        background-color: var(--control-color);
        width: 100%;
        height: 100%;
    }

    .sort-kind-container,
    .filter-kind-container {
        display: inline-block;
    }

    .sort-kind-container input[type=radio],
    .filter-kind-container input[type=radio]
     {
        display: none; 
    }
    .sort-kind-container input[type=radio]:checked + .button,
    .filter-kind-container input[type=radio]:checked + .button
    {
        background: gray;
    }
    .sort-kind-container .label{   
        display: inline-block;
        height: 30px;
        width: 120px;
    }
    .label .button{
        border: 1px solid gray;
        box-sizing: border-box;
        border-radius: 2px;
        padding-left: 10px;
        height: 100%;
        width: 100%;
    }
    .sort-kind-container .icono-caretUp{
        margin-left: auto;
    }
    .sort-kind-container .icono-caretDown {
        margin-left: auto;
        margin-bottom: 5px;
    }

    .filter-kind-container .label{   
        display: inline-block;
        height: 30px;
        width: 80px;
    }
    .filter-word-container form {
        display: inline-block;
    }
    .filter-word-container button {
        width: 25px;
        height: 25px;
    }
    .filter-word-container {
        display: inline-block;
    }
    .filter-word-container .icono-search {
        color: #2C7CFF;
        transform: scale(0.6) rotate(45deg);
    }
</style>

<div class="search-container">
    <div class="sort-kind-container">
        <label class="label">
            <input type="radio" name="sort_select" class="radio" onclick={this.onclickSort.bind(this,0)}> 
            <span class="button">投稿順<span id="ppp" class="icono-caretDown"></span></span>
        </label>
        <label class="label">
            <input type="radio" name="sort_select" class="radio" onclick={this.onclickSort.bind(this,1)}> 
            <span class="button">コメント数順<span class="icono-caretDown"></span></span>
        </label>
        <label class="label">
            <input type="radio" name="sort_select" class="radio" onclick={this.onclickSort.bind(this,2)}> 
            <span class="button">再生数順<span class="icono-caretDown"></span></span>
        </label>
    </div>
    <div class="filter-kind-container">
        <label class="label">
            <input type="radio" name="filter_select" onclick={this.onclickSort.bind(this,0)}> 
            <span class="button">キーワード</span>
        </label>
        <label class="label">
            <input type="radio" name="filter_select" onclick={this.onclickSort.bind(this,1)}> 
            <span class="button">タグ</span>
        </label>
    </div>
    <div class="filter-word-container">
        <form>
            <input type="search" class="text">
            <button type="button"><span class="icono-search"></span></button>
        </form>
    </div>
    <div id="grid-container">
        <div id="search-grid"></div>
    </div>
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
    this.onclickSort = (index, e) => {
        // select_page(index);
        const elm = this.root.querySelector("#ppp");
        elm.classList.remove("icono-caretUp");
        elm.classList.add("icono-caretDown");
        // e.target.classList.add("flow");
    };

    const resizeGridTable = () => {
        const container = this.root.querySelector("#grid-container");
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