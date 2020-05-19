<listview>
    <style scoped>
        :scope {
            --menubar-height: 30px;
            --input-height: 30px;
        }

        .listview-menubar {
            display: block;
            position: relative;
            height: var(--menubar-height);
            margin: 0;
            padding: 5px;
            line-height: 1;
            color: #111111;
            background: #f4f4f4;
            font-size: 1.5em;
            border-bottom: 1px solid lightgrey;
            user-select: none;
        }

        .listview-list {
            display: table;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #f4f4f4;
            list-style: none;
        }

        .listview-item {
            display: flex;
            height: 30px;
            padding: 5px 0 5px 10px;
            transition: all 0.5s;
            cursor: pointer;
            border-bottom: 1px solid lightgrey;
            white-space: nowrap; 
            overflow: hidden;
            user-select: none;
        }

        .listview-item:hover {
            background-color: #6190cd6b;
        }

        .listview-item.selected {
            color: white;
            background-color: #0f468d6b; 
        }

        .listview-item-icon {
            margin-right: 5px;
        }

        .listview-menu-container {
            width: 100%;
            height: calc(100% - var(--menubar-height) - var(--input-height));
            overflow-x: hidden;
        }
        
        .listview-input {
            height: var(--input-height);
            width: calc(100% - 4px);
            margin: 0 2px 0 2px;
            padding: 2px;
            border: solid 1px #ccc;
            border-radius: 2px;
        }
        .listview-input:focus {
            outline: none;
        }

        .listview-item-ghost-class {
            background-color: #C8EBFB;
        }
    </style>

    <label class="listview-menubar">{opts.title}</label>
    <input class="listview-input" type="search" placeholder="検索" 
        onkeydown={onkeydownSearchInput}>
    <div class="listview-menu-container">
        <ul class="listview-list">
            <li class="listview-item" data-id={i} each={ item, i in items }
                title={getTooltip(item)}
                onclick={onclickItem.bind(this,item)} 
                ondblclick={ondblclickItem.bind(this,item)}
                onmouseup={onmouseUp.bind(this,item)}
                onmousedown={onmouseDown.bind(this,item)}>
                <i class={getIconClass(item)}></i>
                {item.title}
            </li>
        </ul>
    </div>

    <script>
        const Sortable = window.Sortable;

        let sortable = null;
        const obs = this.opts.obs;
        const icon_class = this.opts.icon_class;
        this.getTooltip = this.opts.gettooltip;
        if(!this.getTooltip){
            this.getTooltip = (item) => {
                return item.title;
            };
        }

        const triggerChange = () => {
            obs.trigger("changed", {items:this.items});
        };

        obs.on("loadData", async (args) => {
            const { items } = args;
            this.items = items;
            this.update();
        });

        obs.on("addList", async (args) => {
            const { items } = args;
            this.items = this.items.concat(items);

            const query = getInputValue();
            filter(query);

            triggerChange();
        });

        obs.on("deleteList", () => {
            const elms = this.root.querySelectorAll(".listview-item");
            this.items = this.items.filter((item, index) => {
                return elms[index].classList.contains("selected")===false;
            });
            this.update();

            triggerChange();
        });

        const sortItems = () => {
            const order = sortable.toArray().map(value=>Number(value));
            const sorted_items = [];
            order.forEach(value => {
                sorted_items.push(this.items[value]);
            });
            this.items = sorted_items;

            this.update();

            triggerChange();
        };

        const getInputValue = () => {
            const elm = this.root.querySelector(".listview-input");
            return elm.value.toLowerCase();
        };

        const filter = (query) => {
            const elms = this.root.querySelectorAll(".listview-item");
            elms.forEach((elm, index) => {
                if (query == "") {
                    elm.style.display ="";
                }else{
                    if(this.items[index].title.toLowerCase().includes(query)){
                        
                        elm.style.display ="";
                    }else{
                        elm.style.display ="none";
                    }
                }
            });

            this.update();

            const dofilter = query!="";
            sortable.option("disabled", dofilter);
        };

        this.onkeydownSearchInput = (e) => {
            if(e.code == "Enter"){
                const query = getInputValue();
                filter(query);
            }
        };

        this.getIconClass = (item) => {
            const type = item.type;
            if(icon_class === undefined || type === undefined){
                return ""; 
            }
            const icon_name = icon_class[type];
            if(icon_name === undefined){
                return ""; 
            }
            return `center-hv listview-item-icon ${icon_name} ${this.opts.name}-item`; 
        };

        const setSelected = (target_elm, item) => {
            const elms = this.root.querySelectorAll(".listview-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            target_elm.classList.add("selected"); 
        };

        const getSelectedItems = () => {
            const elms = this.root.querySelectorAll(".listview-item");
            return this.items.filter((item, index) => {
                return elms[index].classList.contains("selected")===true;
            });
        };

        this.onclickItem = (item, e) => {
            setSelected(e.target, item);
            obs.trigger("item-clicked", item);
        };

        this.ondblclickItem = (item, e) => {
            obs.trigger("item-dlbclicked", item);
        };

        this.onmouseUp= (item, e) => {
            setSelected(e.target, item);
            if(e.button===2){
                const items = getSelectedItems();
                obs.trigger("show-contextmenu", e, { items });
            }
        };

        this.onmouseDown= (item, e) => {
            setSelected(e.target, item);
        };

        this.on("mount", () => {
            const elm = this.root.querySelector(".listview-list");
            sortable = Sortable.create(elm, {
                ghostClass: "listview-item-ghost-class",
                draggable: ".listview-item",
                onSort: (evt) => {
                    sortItems();
                }
            });            
        });
    </script>
</listview>