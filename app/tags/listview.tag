<listview>
    <style scoped>
        :scope {
            --input-height: 30px;
            --item-height: 30px;
            --item-duration: 300ms;
            --icon-size: 12px;
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
            padding: 5px 0 5px 5px;
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

        .title-wraper {
            width: calc(100% - var(--icon-size) - 25px);
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
        .delete-button > i:hover {
            color: black;
        }

        .listview-menu-container {
            width: 100%;
            height: calc(100% - var(--input-height) - 5px);
            overflow-x: hidden;
        }
        
        .listview-input {
            height: var(--input-height);
            width: 100%;
            margin-bottom: 5px;
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
    
    <input class="listview-input" type="search" placeholder="検索" 
        onkeydown={onkeydownSearchInput}>
    <div class="listview-menu-container">
        <ul class="listview-list">
            <li class="listview-item {item.state}" data-id={i} each={ item, i in items }
                title={getTooltip(item)}>
                <i class={getIconClass(item)}></i>
                <div class="title-wraper center-v"
                    onclick={onclickItem.bind(this,item)} 
                    ondblclick={ondblclickItem.bind(this,item)}
                    onmouseup={onmouseUp.bind(this,item)}
                    onmousedown={onmouseDown.bind(this,item)}>
                    <div class="title">
                        {item.title}
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
        let item_duration = 300;
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
            this.items.map(item=>{
                delete item.state;
                return item;
            });
            obs.trigger("changed", {items:this.items});
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

        obs.on("deleteList", () => {
            const elms = this.root.querySelectorAll(".listview-item");

            elms.forEach(elm => {
                if(elm.classList.contains("selected")===true){
                    elm.classList.add("listview-item-hide"); 
                }
            });

            setTimeout(() => { 
                this.items = this.items.filter((item, index) => {
                    return elms[index].classList.contains("selected")===false;
                });
                this.update();
                triggerChange();
            }, item_duration);
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
            setSelected(e.target.parentElement, item);
            obs.trigger("item-clicked", item);
        };

        this.ondblclickItem = (item, e) => {
            obs.trigger("item-dlbclicked", item);
        };

        this.onmouseUp= (item, e) => {
            setSelected(e.target.parentElement, item);
            if(e.button===2){
                const items = getSelectedItems();
                obs.trigger("show-contextmenu", e, { items });
            }
        };

        this.onmouseDown= (item, e) => {
            setSelected(e.target.parentElement, item);
        };

        this.onclickDelete = (i, e) => {
            e.target.parentElement.classList.add("listview-item-hide"); 
 
            setTimeout(() => { 
                this.items.splice(i, 1);
                this.update();
                triggerChange();
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