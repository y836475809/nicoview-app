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
        padding-left: 5px;
    }

    .column {
        display: inline-block;
    }
    input[type=radio] {
        display: none; 
    }
    input[type=radio]:checked + .button {
        background: gray;
        color: lightgray;
    }
    .label .button {
        border: 1px solid gray;
        border-radius: 2px;
        height: 100%;
        width: 100%;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    .label + .label {
        border-left: none;  
        margin-left: -1px;
    }
    .icono-caretUp {
        transform: scale(0.6) rotate(-90deg) translateX(5px);
    }
    .icono-caretDown {
        transform: scale(0.6) rotate(90deg);
    }

    .sort-kind-container .label {   
        height: 30px;
        width: 100px;
    }

    .filter-kind-container {
        margin-left: 30px;
    }
    .filter-kind-container .label {   
        height: 30px;
        width: 80px;
    }
    .filter-word-container input {
        width: 150px;
        height: 30px;
        font-size: 1.2em;
        outline: 0;
    }
    .filter-word-container .button {
        width: 30px;
        height: 30px;
        margin-left: -5px;
        background-color: #7fbfff;
    }
    .filter-word-container .button:hover {
        opacity: 0.5;
        cursor: pointer; 
    }
    .filter-word-container .icono-search {
        color: white;
        transform: scale(0.7) rotate(45deg);
        top: -1px;
        left: -1px;
    }
    .filter-word-container .icono-search:active {
        top: 1px;
        left: 1px;
    }
</style>

<div class="search-container">
    <div class="column sort-kind-container">
        <label class="column label" each="{item, i in this.sort_items}">
            <input class="column" type="radio" name="sort_select" checked={item.select} 
                onclick="{ this.onclickSort.bind(this, i) }"> 
            <span class="column button">{item.title}<span class="{item.order=='+'?'icono-caretUp':'icono-caretDown'}"></span></span>
        </label>
    </div>
    <div class="column filter-kind-container">
        <label class="column label" each="{item, i in this.search_items}">
            <input class="column" type="radio" name="search_select" checked={item.select} 
                onclick="{ this.onclickSearchTarget.bind(this, i) }"> 
            <span class="column button">{item.title}</span>
        </label>        
    </div>
    <div class="column filter-word-container">
        <input class="column input-search" type="search" class="text" onkeydown={this.onkeydownSearchInput}>
        <span class="column button" onclick={this.onclickSearch}><span class="icono-search"></span></button>
    </div>
    <pagination ref="page" onmovepage={this.onmovePage}></pagination>
    <div class="search-grid-container">
        <div class="search-grid"></div>
    </div>
</div>  

<script>
    /* globals app_base_dir riot obs debug_search_host */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    const { GridTable } = require(`${app_base_dir}/js/gridtable`);
    const { NicoSearchParams, NicoSearch } = require(`${app_base_dir}/js/niconico-search`);

    require(`${app_base_dir}/tags/pagination.tag`);
    riot.mount("pagination");

    this.sort_items = [
        { kind: "startTime",    order:"-", select: true, title:"投稿日" },
        { kind: "commentCounter", order:"-", select: false, title:"コメント数" },
        { kind: "viewCounter",    order:"-", select: false, title:"再生数" }
    ];
    this.search_items = [
        { kind: "keyword", select: false, title:"キーワード" },
        { kind: "tag",     select: true,  title:"タグ" }
    ];

    const search_offset = 1600;
    const search_limit = 32;
    const nico_search_params = new NicoSearchParams(search_limit);
    nico_search_params.page(0);
    nico_search_params.sortTarget("startTime");
    nico_search_params.sortOder("-");
    nico_search_params.cond("tag");

    const nico_search = debug_search_host?new NicoSearch(debug_search_host):new NicoSearch();

    const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
        return `<div>${value}</div>`;
    };

    const columns = [
        {id: "thumb_img", name: "image", height:100, width: 130},
        {id: "name", name: "名前"},
        {id: "info", name: "info", formatter:htmlFormatter},
        {id: "pub_date", name: "投稿日"},
        {id: "play_time", name: "時間"},
        {id: "tags", name: "タグ"},
        {id: "state", name: "state"}
    ];
    const options = {
        rowHeight: 100,
        _saveColumnWidth: true,
    };   
    const grid_table = new GridTable("search-grid", columns, options);

    this.serach = async () => {
        const search_result = await nico_search.search(nico_search_params);
        setData(search_result);
    };

    this.onmovePage = async (page) => {
        nico_search_params.page(page);
        const search_result = await nico_search.search(nico_search_params);
        setData(search_result);
    };

    const setData = (search_result) => {     
        const total_count = search_result.meta.totalCount;
        this.refs.page.setTotaCount(total_count);
        if(total_count<search_offset+search_limit){
            this.refs.page.setTotalPages(Math.ceil(total_count/search_limit));
        }else{
            this.refs.page.setTotalPages(Math.ceil((search_offset+search_limit)/search_limit))
        }
        const items = search_result.data.map(value => {
            return {
                thumb_img: value.thumbnailUrl,
                id: value.contentId,
                name: value.title,
                info: `ID:${value.contentId}<br>再生:${value.viewCounter}<br>コメント:${value.commentCounter}`,
                play_time: value.lengthSeconds,
                pub_date: value.startTime,
                tags: value.tags,
                state: "" 
            };
        });
        grid_table.setData(items);
        grid_table.grid.scrollRowToTop(0); //TODO
    };

    const setSortState = (sort_kind, order) => {
        const index = this.sort_items.findIndex(value=>{
            return value.kind == sort_kind;
        });

        this.sort_items.forEach((value) => {
            value.select = false;
        });

        this.sort_items[index].select = true;
        this.sort_items[index].order = order;
    };

    this.onclickSort = (index, e) => {
        const pre_selected = this.sort_items.findIndex(value=>{
            return value.select === true;
        });

        this.sort_items.forEach((value) => {
            value.select = false;
        });
        this.sort_items[index].select = true;

        if(pre_selected===index){
            const pre_order = this.sort_items[index].order; 
            this.sort_items[index].order = pre_order=="+"?"-":"+";
        }

        nico_search_params.sortTarget(this.sort_items[index].name);
        nico_search_params.sortOder(this.sort_items[index].order);

        this.update();
    };
    
    this.onclickSearchTarget = (index, e) => {
        this.search_items.forEach((value) => {
            value.select = false;
        });
        this.search_items[index].select = true; 

        nico_search_params.cond(this.sort_items[index].name);
    };

    this.onclickSearch = (e) => {
        const elm = this.root.querySelector(".input-search");
        const query = elm.value;
        nico_search_params.query(query);
        this.serach();

        this.refs.page.resetPage();
    };

    this.onkeydownSearchInput = (e) =>{
        if(e.keyCode===13){
            const param = e.target.value;
            nico_search_params.query(param);
            this.serach();

            this.refs.page.resetPage();
        }
    };

    const resizeGridTable = () => {
        const container = this.root.querySelector(".search-grid-container");
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
        grid_table.init(this.root.querySelector(".search-grid"));

        grid_table.onDblClick((e, data)=>{
            console.log("search dbl data=", data);
        });

        resizeGridTable();
    });

    obs.on("resizeEndEvent", (size)=>{
        resizeGridTable();
    });
    
</script>
</search-page>