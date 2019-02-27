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
        width: 100px;
    }
    .label .button{
        border: 1px solid gray;
        box-sizing: border-box;
        border-radius: 2px;
        /* padding-left: 10px; */
        height: 100%;
        width: 100%;
    }

    .sort-kind-container .label .button {
        padding-left: 10px; 
    }

    .label + .label {
        border-left: none;  
        /* border-left: none; */
        margin-left: -1px;
        /* border-left: 5px solid black; */
    }

    .sort-kind-container .icono-caretUp{
        margin-left: auto;
        transform: scale(0.6) rotate(-90deg);
    }
    .sort-kind-container .icono-caretDown {
        margin-left: auto;
        margin-bottom: 5px;
        transform: scale(0.6) rotate(90deg);
    }

    .filter-kind-container .label{   
        display: inline-block;
        height: 30px;
        width: 80px;
    }

    .filter-kind-container .label:first-child {
        margin-left: 30px;
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
        <!-- <label class="label">
            <input ref="sort_select_pubdate" type="radio" name="sort_select" class="radio" onclick={ this.onclickSort.bind(this,"sort-state-pubdate") }> 
            <span class="button">投稿日<span class="sort-state-pubdate icono-caretDown"></span></span>
        </label>
        <label class="label">
            <input ref="sort_select_numcomment" type="radio" name="sort_select" class="radio" onclick={ this.onclickSort.bind(this,"sort-state-numcomment") }> 
            <span class="button">コメント数<span class="sort-state-numcomment icono-caretDown"></span></span>
        </label>
        <label class="label">
            <input ref="sort_select_numplay" type="radio" name="sort_select" class="radio" onclick={ this.onclickSort.bind(this,"sort-state-numplay") }> 
            <span class="button">再生数<span class="sort-state-numplay icono-caretDown"></span></span>
        </label> -->
        <label class="label" each={item, i in this.sort_items}>
            <input ref={item.ref_name} type="radio" name="sort_select" 
                class="radio" onclick={ this.onclickSort.bind(this, item) }> 
            <span class="button">{item.title}<span class="{item.class} icono-caretDown"></span></span>
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

    this.sort_items = [
        { ref_name:"sort_select_pubdate", title:"投稿日", class: "sort-state-pubdate", select: true },
        { ref_name:"sort_select_numcomment", title:"コメント数", class: "sort-state-numcomment", select: false },
        { ref_name:"sort_select_numplay", title:"再生数", class: "sort-state-numplay", select: false }
    ];

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

    const initSortState = () => {
        setSortState("sort_select_pubdate", -1);
    };

    const setSortState = (ref_name, order) => {
        // const radios = [
        //     [this.refs.sort_select_pubdate, "sort-state-pubdate"],
        //     [this.refs.sort_select_numcomment, "sort-state-numcomment"],
        //     [this.refs.sort_select_numplay, "sort-state-numplay"]
        // ];  
        const radios = {
            "sort_select_pubdate": "sort-state-pubdate",
            "sort_select_numcomment": "sort-state-numcomment",
            "sort_select_numplay": "sort-state-numplay"
        };  
        for (const key in radios) {
            if (radios.hasOwnProperty(key)) {
                this.refs[key].checked = false;
            }
        }

        const elm = this.refs[ref_name];
        elm.checked = true;

        const icon_class_name = radios[ref_name];
        const elm_icon = this.root.querySelector(`.${icon_class_name}`);
        elm_icon.classList.remove("icono-caretUp");
        elm_icon.classList.remove("icono-caretDown");
        if(order>0){
            elm_icon.classList.add("icono-caretUp");
        }else{
            elm_icon.classList.add("icono-caretDown");
        }
    };

    const fffsame = () => {
        let pre = 0;
        return () => {
            let current;
            const radios = [
                this.refs.sort_select_pubdate,
                this.refs.sort_select_numcomment,
                this.refs.sort_select_numplay
            ];

            for(let i=0; i<radios.length; i++){
                if (radios[i].checked) {
                    current = i;
                    break;
                }
            }

            const result = pre == current;
            pre = current;
            console.log("fff result=", result);
            return result;
        };  
    };
    const ffff = fffsame();

    //TODO:
    this.onclickSort = (sort_item, e) => {
        const is_same = ffff();
        if(is_same){
            const elm = this.root.querySelector(`.${sort_item.class}`);
            if(elm.classList.contains("icono-caretUp")){
                elm.classList.replace("icono-caretUp", "icono-caretDown");
            }else{
                elm.classList.replace("icono-caretDown", "icono-caretUp");
            }
        }
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

        initSortState();
        resizeGridTable();
    });

    obs.on("resizeEndEvent", (size)=>{
        resizeGridTable();
    });
</script>
</search-page>