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
    </style>

    <label class="acdn-menubar" onclick={this.onclickMenubar}>{opts.title}</label>
    <input class="query-input" type="search" placeholder="検索" 
        onkeydown={onkeydownSearchInput}>
    <div class="acdn-menu-container">
        <div class="toggle-menu">
            <ul class="acdn-list">
                <li class="acdn-item" each={ item in this.items }
                    title={item.title}
                    onclick={this.onclickItem.bind(this,item)} 
                    ondblclick={this.ondblclickItem.bind(this,item)}
                    onmouseup={this.onmouseUp.bind(this,item)}>
                    <i class={getIconClass(item)}></i>
                    {item.title}
                </li>
            </ul>
        </div>
    </div>

    <script>
        const Sortable = require("sortablejs");

        let sortable = null;
        const menu_item_h = 30;
        const obs_accordion = this.opts.obs;

        const store = this.riotx.get(this.opts.storname);

        store.change("loaded", (state, store) => {
            this.item_attr_map = store.getter("attmap");
            this.items = store.getter("state").items;
            this.update();
            chanegExpand(true);
        });
        store.change("changed", (state, store) => {
            this.item_attr_map = store.getter("attmap");
            const query = getInputValue();
            filter(query);
        });

        const getInputValue = () => {
            const elm = this.root.querySelector(".query-input");
            return elm.value.toLowerCase();
        };

        const filter = (query) => {
            this.items = store.getter("filter", {query});
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
            if(this.item_attr_map.has(item)==false){
                return ""; 
            }
            const icon = this.item_attr_map.get(item);
            if(icon!==undefined && icon.name!==undefined && icon.class_name!==undefined){
                return `center-hv icont-item ${icon.name} ${icon.class_name}`;
            }
            return "";
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

        const sortItems = () => {
            const order = sortable.toArray();
            const sorted_items = [];
            order.forEach(value => {
                sorted_items.push(this.items[value]);
            });

            store.commit("updateData", {items:sorted_items});
        };

        const setSelected = (target_elm, item) => {
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            target_elm.classList.add("selected"); 

            const selected_items = [item];
            store.commit("setSelectedData", {selected_items});
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
                obs_accordion.trigger("show-contextmenu", e);
            }
        };

        this.on("mount", () => {
            const elm = this.root.querySelector(".acdn-list");
            sortable = Sortable.create(elm, {
                onSort: (evt) => {
                    sortItems();
                }
            });            
        });
    </script>
</accordion>