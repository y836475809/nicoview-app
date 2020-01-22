<accordion>
    <style scoped>
        :scope {
            max-width: 360px;
            --menubar-height: 30px;
        }

        .acdn-menubar {
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

        .acdn-list {
            display: table;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #f4f4f4;
            list-style: none;
        }

        .acdn-item {
            display: flex;
            height: 30px;
            padding: 5px 0 5px 20px;
            transition: all 0.5s;
            cursor: pointer;
            border-bottom: 1px solid lightgrey;
            white-space: nowrap; 
            overflow: hidden;
        }

        .acdn-item:hover {
            background-color: #6190cd6b;
        }

        .acdn-item.selected {
            color: white;
            background-color: #0f468d6b; 
        }

        .icont-item {
            margin-right: 5px;
        }

        .acdn-menu-container {
            width: 100%;
            /* height: calc(50vh - var(--menubar-height) - 5px); */
            overflow: auto;
        }

        .toggle-menu {
            overflow: hidden;
            transition-duration: 300ms;
        }
        
        .query-input {
            height: 30px;
            width: calc(100% - 4px);
            margin: 0 2px 0 2px;
            padding: 2px;
            border: solid 1px #ccc;
            border-radius: 2px;
        }     
        .search-container {
            display: flex;
        }

        .acdn-item-ghost-class {
            background-color: #C8EBFB;
        }
    </style>

    <label class="acdn-menubar" onclick={this.onclickMenubar}>{opts.title}</label>
    <input class="query-input" type="search" placeholder="検索" 
        onkeydown={onkeydownSearchInput}>
    <div class="acdn-menu-container">
        <div class="toggle-menu">
            <ul class="acdn-list">
                <li class="acdn-item" data-id={i} each={ item, i in this.items }
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
        const obs_accordion = this.opts.obs;
        const icon_class = this.opts.icon_class;

        const triggerChange = () => {
            obs_accordion.trigger("changed", {items:this.items});
        };

        obs_accordion.on("loadData", async (args) => {
            const { items } = args;
            this.items = items;
            this.update();
            chanegExpand(true);

            triggerChange();
        });

        obs_accordion.on("addList", async (args) => {
            const { items } = args;
            this.items = this.items.concat(items);

            const query = getInputValue();
            filter(query);

            triggerChange();
        });

        obs_accordion.on("deleteList", () => {
            const elms = this.root.querySelectorAll(".acdn-item");
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
            const elms = this.root.querySelectorAll(".acdn-item");
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
            return `center-hv icont-item ${icon_name} ${this.opts.storname}-item`; 
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
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            target_elm.classList.add("selected"); 
        };

        const getSelectedItems = () => {
            const elms = this.root.querySelectorAll(".acdn-item");
            return this.items.filter((item, index) => {
                return elms[index].classList.contains("selected")===true;
            });
        };

        this.onclickMenubar = (e) => {
            toggleExpand();
        };

        this.onclickItem = (item, e) => {
            setSelected(e.target, item);
            obs_accordion.trigger("item-clicked", item);
        };

        this.ondblclickItem = (item, e) => {
            obs_accordion.trigger("item-dlbclicked", item);
        };

        this.onmouseUp= (item, e) => {
            setSelected(e.target, item);
            if(e.button===2){
                const items = getSelectedItems();
                obs_accordion.trigger("show-contextmenu", e, { items });
            }
        };

        this.onmouseDown= (item, e) => {
            setSelected(e.target, item);
        };

        this.on("mount", () => {
            const elm = this.root.querySelector(".acdn-list");
            sortable = Sortable.create(elm, {
                ghostClass: "acdn-item-ghost-class",
                draggable: ".acdn-item",
                onSort: (evt) => {
                    sortItems();
                }
            });            
        });
    </script>
</accordion>