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
            color: #ffffff;
            background: #7fbfff;
            cursor: pointer;
            font-size: 1.5em;
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
            padding: 5px 0 5px 10px;
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
            background-color: #0f468d6b;
        }

        .icont-item {
            margin-right: 5px;
        }

        .acdn-menu-container {
            width: 100%;
            height: calc(100vh - var(--menubar-height) - 5px);
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
                    <!-- <i show={item.icon!==undefined} style="{item.icon.style}" class="center-hv icont-item {item.icon.name}"></i> -->
                    <i show={item.icon!==undefined} class="center-hv icont-item {item.icon.name} {item.icon.class_name}"></i>
                    {item.title}
                </li>
            </ul>
        </div>
    </div>

    <script>
        const Sortable = require("sortablejs");
        let sortable = null;
        
        const obs_accordion = this.opts.obs;
        
        // const params = this.opts.params;
        // const id_name = params.name;
        this.items = this.opts.items.map(value=>{
            if(!value.icon){
                value.icon = {
                    name: "",
                    class_name: ""
                };
            }
            return value;
        });

        const menu_item_h = 30;
        

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
                return this.items[value];
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
                return Object.assign({}, this.items[index]);
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

        //TODO
        obs_accordion.on("add-items", (items) => {
            const pre_item_num = this.items.length;
            const new_items = items.map(value=>{
                if(!value.icon){
                    value.icon = {
                        name: "",
                        style: ""
                    };
                }
                return value;
            });
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

        // obs.on(`${id_name}-add-items`, (items) => {
        //     const new_items = items.map(value=>{
        //         if(!value.icon){
        //             value.icon = {
        //                 name: "",
        //                 style: ""
        //             };
        //         }
        //         return value;
        //     });
        //     Array.prototype.push.apply(this.items, new_items);
        //     if(isExpand()){
        //         chanegExpand(true);
        //     }
        //     this.update();

        //     obs.trigger(`${id_name}-state-change`, {
        //         is_expand: isExpand(), 
        //         items: getItems()
        //     });
        // });

        // obs.on(`${id_name}-selected-item-indices`, (cb) => {
        //     const sel_indices = getSelectedItemIndices();
        //     cb(sel_indices);
        // });

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

        // obs.on(`${id_name}-delete-selected-items`, () => {
        //     const sel_indices = getSelectedItemIndices();
        //     deleteItems(sel_indices);
        //     if(isExpand()){
        //         chanegExpand(true);
        //     }

        //     obs.trigger(`${id_name}-state-change`, {
        //         is_expand: isExpand(), 
        //         items: getItems()
        //     });
        // });

        obs_accordion.on("get-items", (cb) => {
            cb({
                is_expand: isExpand(), 
                items: getItems()
            });
        });
        // obs.on(`${id_name}-get-data`, (cb) => {
        //     cb({
        //         is_expand: isExpand(), 
        //         items: getItems()
        //     });
        // });

        obs_accordion.on("change-expand", (expand) => {
            chanegExpand(expand);
        });
        // obs.on(`${id_name}-change-expand`, (expand) => {
        //     chanegExpand(expand);
        // });

        this.onclickMenubar = (e) => {
            toggleExpand();
        };

        this.onclickItem = (item, e) => {
            setSelected(e.target);
            // obs.trigger(`${id_name}:click-item`, item);
            obs_accordion.trigger("item-clicked", item);
        };

        this.ondblclickItem = (item, e) => {
            // const id = e.target.getAttribute("data-id");
            // const item = this.items[id];
            // obs.trigger(`${id_name}-dlbclick-item`, item);
            obs_accordion.trigger("item-dlbclicked", item);
        };

        this.onmouseUp= (e) => {
            setSelected(e.target);
            // if(params.oncontextmenu==undefined){
            //     return;
            // }
            if(e.button===2){
                // params.oncontextmenu(e);
                obs_accordion.trigger("show-contextmenu", e);
            }
        };

        this.on("mount", () => {
            const elm = this.root.querySelector(".acdn-list");
            sortable = Sortable.create(elm, {
                onSort: (evt) => {
                    // obs.trigger(`${id_name}-state-change`, {
                    //     is_expand: isExpand(), 
                    //     items: getItems()
                    // });
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