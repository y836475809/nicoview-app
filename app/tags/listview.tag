<listview>
    <style scoped>
        :scope {
            --menubar-height: 30px;
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
            cursor: pointer;
            font-size: 1.5em;
            border-bottom: 1px solid lightgrey;
        }

        .listview-list {
            display: table;
            width: 100%;
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
            overflow: auto;
        }

        .toggle-menu {
            overflow: hidden;
            transition-duration: 300ms;
        }
        
        .listview-input {
            height: 30px;
            width: calc(100% - 4px);
            margin: 0 2px 0 2px;
            padding: 2px;
            border: solid 1px #ccc;
            border-radius: 2px;
        }

        .listview-item-ghost-class {
            background-color: #C8EBFB;
        }
    </style>

    <label class="listview-menubar" onclick={this.onclickMenubar}>{opts.title}</label>
    <input class="listview-input" type="search" placeholder="検索" 
        onkeydown={onkeydownSearchInput}>
    <div class="listview-menu-container">
        <div class="toggle-menu">
            <ul class="listview-list">
                <li class="listview-item" data-id={i} each={ item, i in this.items }
                    title={item.title}
                    onclick={this.onclickItem.bind(this,item)} 
                    ondblclick={this.ondblclickItem.bind(this,item)}
                    onmouseup={this.onmouseUp.bind(this,item)}
                    onmousedown={this.onmouseDown.bind(this,item)}>
                    <i class={getIconClass(item)}></i>
                    {item.title}
                </li>
            </ul>
        </div>
    </div>

    <script>
        const Sortable = window.Sortable;

        let sortable = null;
        const menu_item_h = 30;
        const obs = this.opts.obs;
        const icon_class = this.opts.icon_class;

        const triggerChange = () => {
            obs.trigger("changed", {items:this.items});
        };

        obs.on("loadData", async (args) => {
            const { items } = args;
            this.items = items;
            this.update();
            chanegExpand(true);
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
            chanegExpand(true);

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
            chanegExpand(true);

            triggerChange();
        };

        const getInputValue = () => {
            const elm = this.root.querySelector(".query-input");
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
            chanegExpand(true);

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

        const getMenuElm = () => {
            return this.root.querySelector(".toggle-menu");
        };

        const chanegExpand = (is_expand) => {
            if(!this.items){
                return;
            }

            const elm = getMenuElm();
            if(is_expand){
                const length = this.items.length;
                const _clientH = length * menu_item_h + 30;
                elm.style.height = _clientH + "px";
            }else{
                elm.style.height = "0px";
            }  
        };

        const toggleExpand = () => {
            const elm = getMenuElm();
            chanegExpand(elm.clientHeight===0);
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

        this.onclickMenubar = (e) => {
            toggleExpand();
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