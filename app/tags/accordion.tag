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
            transition: all 0.5s;
        }
    </style>

    <label class="acdn-menubar" onclick={this.onclickMenubar}>{opts.title}</label>
    <div class="acdn-menu-container">
        <div class="toggle-menu">
            <ul class="acdn-list">
                <li class="acdn-item" each={ item,i in this.items }
                    title={item.title}
                    data-id={i}
                    onclick={this.onclickItem.bind(this,item)} 
                    ondblclick={this.ondblclickItem.bind(this,item)}
                    onmouseup={this.onmouseUp}>
                    <i show={item.icon!==undefined} class="center-hv icont-item {item.icon.name} {item.icon.class_name}"></i>
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
        
        this.items = this.opts.items;

        const getMenuElm = () => {
            return this.root.querySelector(".toggle-menu");
        };

        const chanegExpand = (is_expand) => {
            const elm = getMenuElm();
            if(is_expand){
                const _clientH = this.items.length * menu_item_h;
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
                return Object.create(this.items[value]);
            });
        };

        const getSelectedItemIndices = () => {
            const sel_indices = [];
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm, index) => {
                if(elm.classList.contains("selected")){
                    sel_indices.push(index);
                }
            });
            return sel_indices;
        };

        const deleteItems = (/** @type {Array} */ indices) => {
            /** @type {Array} */
            const order = sortable.toArray();

            const cp_items = order.map(value=>{
                const index = parseInt(value);
                return Object.create(this.items[index]);
            });
            this.items = cp_items.filter((value, index)=>{
                return !indices.includes(index);
            });
            this.update();
        };

        const setSelected = (target_elm) => {
            const elms = this.root.querySelectorAll(".acdn-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            target_elm.classList.add("selected"); 
        };

        obs_accordion.on("add-items", (items) => {
            const pre_item_num = this.items.length;
            Array.prototype.push.apply(this.items, items);
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
            const sel_indices = getSelectedItemIndices();
            deleteItems(sel_indices);
            if(isExpand()){
                chanegExpand(true);
            }

            obs_accordion.trigger("state-changed", {
                is_expand: isExpand(), 
                items: getItems()
            });
        });

        obs_accordion.on("get-selected-items", (cb) => {
            const indices = getSelectedItemIndices();
            const items = getItems();
            const selected_items = items.filter((item, index) => {
                return indices.includes(index);
            });
            cb(selected_items);
        });
        
        obs_accordion.on("get-selected-indices", (cb) => {
            const indices = getSelectedItemIndices();
            cb(indices);
        });

        obs_accordion.on("change-expand", (expand) => {
            chanegExpand(expand);
        });

        this.onclickMenubar = (e) => {
            toggleExpand();
        };

        this.onclickItem = (item, e) => {
            setSelected(e.target);
            obs_accordion.trigger("item-clicked", item);
        };

        this.ondblclickItem = (item, e) => {
            obs_accordion.trigger("item-dlbclicked", item);
        };

        this.onmouseUp= (e) => {
            setSelected(e.target);
            if(e.button===2){
                obs_accordion.trigger("show-contextmenu", e);
            }
        };

        this.on("mount", () => {
            const elm = this.root.querySelector(".acdn-list");
            sortable = Sortable.create(elm, {
                onSort: (evt) => {
                    obs_accordion.trigger("state-changed", {
                        is_expand: isExpand(), 
                        items: getItems()
                    });
                }
            });
            chanegExpand(this.opts.expand);
        });
    </script>
</accordion>