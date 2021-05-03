<listview>
    <style scoped>
        :scope {
            --input-height: 30px;
            --serach-button-width: 30px;
            --item-height: 30px;
            --item-duration: 300ms;
            --icon-size: 15px;
        }

        .listview-list {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #f4f4f4;
            list-style: none;
        }

        .listview-item {
            display: flex;
            width: 100%;
            height: var(--item-height);
            padding: 0 0 0 5px;
            cursor: pointer;
            border-bottom: 1px solid lightgrey;
            overflow: hidden;
            user-select: none;
            transition: height var(--item-duration), 
                padding var(--item-duration),
                border-bottom var(--item-duration);
        }

        .listview-item:hover {
            background-color: #6190cd6b;
        }

        .listview-item.selected {
            color: white;
            background-color: #0f468d6b; 
        }
        .listview-item-hide { 
            height: 0;
            padding: 0 0 0 5px;
            border-bottom: 0px;
        } 
        .listview-item-show {
            height: var(--item-height);
            padding: 5px 0 5px 5px;
            border-bottom: 1px solid lightgrey;
        }

        .listview-item-default-icon {
            font-size: var(--icon-size);
            pointer-events: none;
        }
        .listview-item-default-icon-color {
            color: royalblue;
        }
        .listview-item-marked-icon-color {
            color: red;
        }

        .title-wraper {
            padding: 5px 0 5px 0;
            width: calc(100% - var(--icon-size) * 2 - 5px);
            height: 100%;
        }
        .title {
            margin-left: 5px;
            margin-right: 5px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            pointer-events: none;
        }

        .delete-button {
            margin-right: 10px;
            margin-left: auto;
            opacity: 0;
        }
        .listview-item:hover > .delete-button {
            opacity: 1;
        }
        .delete-button > i {
            font-size: var(--icon-size);
            color: gray;
            pointer-events: none;
        }
        .delete-button:hover > i {
            color: black;
        }

        .listview-menu-container {
            width: 100%;
            height: calc(100% - var(--input-height) - 5px);
            overflow-x: hidden;
        }
        
        .listview-input {
            border: solid 1px #ccc;
            border-right-width: 0px !important;
            border-radius: 2px;
            height: var(--input-height);
            width: calc(100% - var(--serach-button-width));
            margin-bottom: 5px;
            padding: 2px;   
        }
        .listview-input:focus {
            outline: none;
        }
 
        .search-button > i,
        .clear-button > i {
            font-size: 1.2em;
            color: gray;
        }
        .search-button > i:hover,
        .clear-button > i:hover {
            color: black;
        }
        .search-button,
        .clear-button {
            border: 1px solid #ccc;
            background-color: white;
            height: var(--input-height);
            cursor: pointer;      
        }
        .search-button {            
            border-left-width: 0px !important;
            border-right-width: 0px !important;
            width: calc(var(--serach-button-width) - 5px);
        }
        .clear-button {            
            border-left-width: 0px !important;
            width: var(--serach-button-width);
        }

        .listview-item-ghost-class {
            background-color: #C8EBFB;
        }
        
        .dblclick > i {
            transition-duration: 0.2s;
        }
        .dblclick:hover > i {
            transform: scale(1.5);
	        transition-duration: 0.2s;
        }
    </style>
    
    <div style="display: flex;">
        <input class="listview-input" placeholder="検索" onkeydown={onkeydownSearchInput}>
        <div class="search-button center-hv" title="検索" onclick={onclickSearch}>
            <i class="fas fa-search"></i>
        </div>
        <div class="clear-button center-hv" title="全て表示" onclick={onclickShowAll}>
            <i class="fas fa-times-circle"></i>
        </div>
    </div>
    <div class="listview-menu-container">
        <ul class="listview-list">
            <li class="listview-item {item.state}" data-id={i} each={ item, i in items }
                title={getTooltip(item)}>
                <div class="dblclick center-hv" title="クリック動作"
                    onclick={onclickItem.bind(this,item)} 
                    ondblclick={ondblclickItem.bind(this,item)}
                    onmouseup={onmouseUp.bind(this,item)}
                    onmousedown={onmouseDown.bind(this,item)}>
                    <i class={getIconClass(item)}></i>
                </div>           
                <div class="title-wraper center-v"
                    onclick={onclickItemAsdblclick.bind(this,item)} 
                    ondblclick={ondblclickItem.bind(this,item)}
                    onmouseup={onmouseUp.bind(this,item)}
                    onmousedown={onmouseDown.bind(this,item)}>
                    <div class="title">
                        {getTitle(item)}
                    </div> 
                </div>
                <div class="delete-button center-hv" title="削除"
                    onclick={onclickDelete.bind(this,i)}>
                    <i class="fas fa-times"></i>
                </div>
            </li>
        </ul>
    </div>

    <script>
        const Sortable = window.Sortable;
        const myapi = window.myapi;
        let item_duration = 300;
        let sortable = null;
        const obs = this.opts.obs;

        const default_icon = "fas fa-square listview-item-default-icon";
        
        this.getTooltip = this.opts.gettooltip;
        if(!this.getTooltip){
            this.getTooltip = (item) => {
                return item.title;
            };
        }
        this.getTitle = this.opts.gettitle;
        if(!this.getTitle){
            this.getTitle = (item) => {
                return item.title;
            };
        }
        this.getIcon = this.opts.geticon;
        if(!this.getIcon){
            this.getIcon = (item) => {
                return default_icon;
            };
        }  

        const confirm = !this.opts.confirm?[]:this.opts.confirm;

        const triggerChange = () => {
            const items = JSON.parse(JSON.stringify(this.items)).map(item=>{
                delete item.state;
                return item;
            });
            obs.trigger("changed", {items});
        };

        const triggerDelete = (items) => {
            const deleted_items = JSON.parse(JSON.stringify(items)).map(item=>{
                delete item.state;
                return item;
            });
            obs.trigger("items-deleted", {items:deleted_items});
        };

        const deleteConfirm = async () => {
            if(confirm.includes("delete") === false){
                return true;
            }
            const ret = await myapi.ipc.Dialog.showMessageBox({
                message: "削除しますか?", 
                okcancel: true
            });
            return ret;
        };

        obs.on("loadData", async (args) => {
            const { items } = args;
            this.items = items;
            this.update();
        });

        obs.on("addList", async (args) => {
            const { items } = args;

            items.forEach(item => {
                item.state = "listview-item-hide";
            });
            this.items = this.items.concat(items);
            this.update();

            setTimeout(() => { 
                const elms = this.root.querySelectorAll(".listview-item-hide");
                elms.forEach(elm => {
                    elm.classList.add("listview-item-show"); 
                });
                elms.forEach(elm => {
                    elm.classList.remove("listview-item-hide"); 
                    elm.classList.remove("listview-item-show"); 
                });

                const query = getInputValue();
                filter(query);
                triggerChange();
            }, 50);
        });

        obs.on("deleteList", async () => {
            if(await deleteConfirm() === false){
                return;
            }
            const elms = this.root.querySelectorAll(".listview-item");

            elms.forEach(elm => {
                if(elm.classList.contains("selected")===true){
                    elm.classList.add("listview-item-hide"); 
                }
            });

            setTimeout(() => { 
                const deleted_items = this.items.filter((item, index) => {
                    return elms[index].classList.contains("selected")===true;
                });

                this.items = this.items.filter((item, index) => {
                    return elms[index].classList.contains("selected")===false;
                });
                this.update();
                triggerChange();
                triggerDelete(deleted_items);
            }, item_duration);
        });

        obs.on("select-item-by-index", (args) => {
            const { index } = args;
            if(index < 0){
                return;
            }
            const elms = this.root.querySelectorAll(".listview-item");
            if(index >= elms.length){
                return;
            }
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            elms[index].classList.add("selected");  
        });

        obs.on("toggle-mark", (args) => {
            const { items } = args;
            items.forEach(item => {
                item.marked = !item.marked;
            });
            updateItemIcon();
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

        const setInputValue = (value) => {
            const elm = this.root.querySelector(".listview-input");
            elm.value = value;
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

        this.onclickSearch = (e) => {
            const query = getInputValue();
            filter(query);
        };

        this.onclickShowAll = (e) => {
            setInputValue("");
            filter("");
        };

        this.getIconClass = (item) => {
            let icon = this.getIcon(item);
            if(!icon){
                icon = default_icon;
            }
            const color = item.marked?"marked":"default";
            return `center-hv ${icon} listview-item-${color}-icon-color`;
        };

        const setSelected = (target_elm, item) => {
            const elms = this.root.querySelectorAll(".listview-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            const target = target_elm.closest(".listview-item");
            if(target){
                target.classList.add("selected"); 
            }
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

        this.onclickItemAsdblclick = (item, e) => {
            setSelected(e.target, item);
            obs.trigger("item-dlbclicked", item);
        };

        const updateItemIcon = () => {
            this.update();
            triggerChange();
        };

        this.onmouseUp = (item, e) => {
            setSelected(e.target, item);
            if(e.button===2){
                const items = getSelectedItems();
                const cb = () => {
                    (async ()=>{
                        const menu_id = await myapi.ipc.popupContextMenu("listview-toggle-mark");
                        if(menu_id=="toggle-mark"){
                            items.forEach(item => {
                                item.marked = !item.marked;
                            });
                            updateItemIcon();
                        }
                    })();   
                };
                obs.trigger("show-contextmenu", e, { items, cb });
            }
        };

        this.onmouseDown= (item, e) => {
            setSelected(e.target, item);
        };

        this.onclickDelete = async (i, e) => {
            if(await deleteConfirm() === false){
                return;
            }

            e.target.parentElement.classList.add("listview-item-hide"); 
 
            setTimeout(() => { 
                const deleted_items = this.items.splice(i, 1);
                this.update();
                triggerChange();
                triggerDelete(deleted_items);
            }, item_duration);
        };

        this.on("mount", () => {
            const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
            item_duration = parseInt(prop);

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