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
                <li show={true} class="acdn-item" each={ item,i in this.items }
                    title={item.title}
                    data-id={i}
                    data-itemid={item.id}
                    onclick={this.onclickItem.bind(this,item)} 
                    ondblclick={this.ondblclickItem.bind(this,item)}
                    onmouseup={this.onmouseUp.bind(this,item)}>
                    <!-- <i show={item.icon!==undefined} class="center-hv icont-item {getIconClass(item)}"></i> -->
                    <i class="{getIconClass(item)}"></i>
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

        if(!store){
            this.items = this.opts.items.map((value, index) => {
                const item = Object.assign({}, value);
                item.id = index;
                item.visible = true;
                return item;
            });
        }else{
            // this.items = store.getter("items").map((value, index) => {
            //     const item = Object.assign({}, value);
            //     item.id = index;
            //     item.visible = true;
            //     return item;
            // });
            this.items = store.getter("state").items;
            this.item_attr_map = store.getter("attmap");
   
            store.change("loaded", (state, store) => {
                this.item_attr_map = store.getter("attmap");
                this.items = store.getter("state").items;
                this.update();
                chanegExpand(true);
            });
            store.change("changed", (state, store) => {
                // this.bookmark_data = state;
                // this.update();
                // this.bookmark_store.save(state);
                // this.items = store.getter("items");
                this.item_attr_map = store.getter("attmap");
                const query = getInputValue();
                filter(query);

                // this.update();
            });
        }

        const getInputValue = () => {
            const elm = this.root.querySelector(".query-input");
            return elm.value.toLowerCase();
        };

        const filter = (query) => {
            if(store){
                this.items = store.getter("filter", {query});
                this.update();
                chanegExpand(true);

                const dofilter = query!="";
                sortable.option("disabled", dofilter);
            }else{
                const dofilter = query!="";
                if(dofilter){
                    this.items.forEach(item=>{
                        item.visible = item.title.toLowerCase().includes(query);
                    });
                }else{     
                    this.items.forEach(item=>{
                        item.visible = true;
                    });
                }

                this.update();
                chanegExpand(true);
                sortable.option("disabled", dofilter);
            }
        };

        this.onkeydownSearchInput = (e) => {
            if(e.code == "Enter"){
                const query = getInputValue();
                filter(query);
            }
        };

        this.getIconClass = (item) => {
            if(!store){
                return "";
            }
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
            if(store){
                const elm = getMenuElm();
                if(is_expand){
                    const length = this.items.length;
                    const _clientH = length * menu_item_h + 30;
                    elm.style.height = _clientH + "px";
                }else{
                    elm.style.height = "0px";
                }  

                return;
            }
            const elm = getMenuElm();
            if(is_expand){
                const length = this.items.filter(item=>{
                    return item.visible === true;
                }).length;
                const _clientH = length * menu_item_h + 30;
                elm.style.height = _clientH + "px";
            }else{
                elm.style.height = "0px";
            }
        };

        const isExpand = () => {
            const elm = getMenuElm();
            return elm.clientHeight!==0;
        };

        const toggleExpand = () => {
            const elm = getMenuElm();
            chanegExpand(elm.clientHeight===0);
        };

        const getItems = () => {
            const order = sortable.toArray();
            return order.map(value => {
                const item = Object.assign({}, this.items[value]);
                delete item.icon;
                delete item.id;
                delete item.visible;
                return item;
            });
        };

        const sortItems = () => {
            const order = sortable.toArray();
            const sorted_items = [];
            order.forEach(value => {
                sorted_items.push(this.items[value]);
            });

            store.commit("updateData", {items:sorted_items});
        };

        const getSelectedItemIds = () => {
            const Ids = [];
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm) => {
                if(elm.classList.contains("selected")){
                    Ids.push(parseInt(elm.dataset.itemid));
                }
            });
            return Ids;
        };

        const deleteItems = (/** @type {Array} */ ids) => {            
            this.items = this.items.filter((value)=>{
                return !ids.includes(value.id);
            });

            this.update();
        };

        const setSelected = (target_elm, item) => {
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            target_elm.classList.add("selected"); 

            const selected_items = [item];
            // elms.forEach((elm, index) => {
            //     if(elm.classList.contains("selected")===true){
            //         sels.push(index);
            //     }
            // });

            if(store){
                // await store.action("setselectedData", {selected_items});
                // store.mutation("setselectedData", {selected_items});
                store.commit("setselectedData", {selected_items});
            }
        };

        const cnvItems = (items) => {
            const ids = this.items.map(item => {
                return item.id;
            });
            const max_id = Math.max(...ids);
            return items.map((item, index) => {
                item.id = max_id + index + 1;
                item.visible = true;
                return item;
            });
        };

        obs_accordion.on("add-items", (items) => {
            if(store){
                return;
            }

            const pre_item_num = this.items.length;
            
            const new_items = cnvItems(items);
            Array.prototype.push.apply(this.items, new_items);
            if(isExpand()){
                chanegExpand(true);
            }
            if(pre_item_num===0){
                chanegExpand(true);
            }
            this.update();

            obs_accordion.trigger("state-changed", {
                is_expand: isExpand(), 
                items: getItems()
            });
        });

        obs_accordion.on("delete-selected-items", () => {
            if(store){
                return;
            }
            
            const sel_ids = getSelectedItemIds();
            deleteItems(sel_ids);
            if(isExpand()){
                chanegExpand(true);
            }

            obs_accordion.trigger("state-changed", {
                is_expand: isExpand(), 
                items: getItems()
            });
        });

        obs_accordion.on("get-selected-items", (cb) => {
            const ids = getSelectedItemIds();
            const selected_items = this.items.filter(item => {
                return ids.includes(item.id);
            }).map(value=>{
                const item = Object.assign({}, value);
                delete item.icon;
                delete item.id;
                return item;
            });
            cb(selected_items);
        });

        obs_accordion.on("change-expand", (expand) => {
            chanegExpand(expand);
        });

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
                    if(store){
                        sortItems();
                    }else{
                        obs_accordion.trigger("state-changed", {
                            is_expand: isExpand(), 
                            items: getItems()
                        });
                    }
                }
            });
            chanegExpand(this.opts.expand);
        });
    </script>
</accordion>