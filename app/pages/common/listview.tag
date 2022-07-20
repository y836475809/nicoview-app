<listview>
    <style>
        :host {
            --input-height: 30px;
            --search-button-width: 30px;
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
        .listview-item-hide-anime { 
            height: 0;
            transition: all var(--item-duration);
        } 
        .listview-item-show-anime {
            height: var(--item-height);
            transition: all var(--item-duration);
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
            width: calc(100% - var(--search-button-width));
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
            width: calc(var(--search-button-width) - 5px);
        }
        .clear-button {            
            border-left-width: 0px !important;
            width: var(--search-button-width);
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
            <li class="listview-item {item.state}" data-id={i} each={ (item, i) in state.items }
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

        const default_icon = "fas fa-square listview-item-default-icon";

        const getInputValue = (tag) => {
            const elm = tag.$(".listview-input");
            return elm.value.toLowerCase();
        };
        const setInputValue = (tag, value) => {
            const elm = tag.$(".listview-input");
            elm.value = value;
        };

        export default {
            state: {
                items:[]
            },
            item_duration: 300,
            sortable:null,
            obs:null,
            confirm:null,
            contextmenu_show:false,
            onBeforeMount(props) {
                this.obs = props.obs;
                
                this.getTooltip = props.gettooltip;
                if(!this.getTooltip){
                    this.getTooltip = (item) => {
                        return item.title;
                    };
                }
                this.getTitle = props.gettitle;
                if(!this.getTitle){
                    this.getTitle = (item) => {
                        return item.title;
                    };
                }
                this.getIcon = props.geticon;
                if(!this.getIcon){
                    this.getIcon = (item) => { // eslint-disable-line no-unused-vars
                        return default_icon;
                    };
                }  

                this.confirm = !props.confirm?[]:props.confirm;

                this.obs.on("loadData", async (args) => {
                    const { items } = args;
                    this.state.items = items;
                    this.update();
                });

                this.obs.on("addList", async (args) => {
                    const { items } = args;

                    items.forEach(item => {
                        item.state = "listview-item-hide";
                    });
                    this.state.items = this.state.items.concat(items);
                    this.update();

                    setTimeout(() => { 
                        this.state.items.forEach(item => {
                            item.state = "listview-item-show-anime";
                        });

                        const query = getInputValue(this);
                        this.filter(query);
                        this.triggerChange();
                    }, 50);
                });

                this.obs.on("deleteList", async () => {
                    if(await this.deleteConfirm() === false){
                        return;
                    }
                    const elms = this.$$(".listview-item");

                    elms.forEach(elm => {
                        if(elm.classList.contains("selected")===true){
                            elm.classList.add("listview-item-hide"); 
                        }
                    });

                    setTimeout(() => { 
                        const deleted_items = this.state.items.filter((item, index) => {
                            return elms[index].classList.contains("selected")===true;
                        });

                        this.state.items = this.state.items.filter((item, index) => {
                            return elms[index].classList.contains("selected")===false;
                        });
                        this.update();
                        this.triggerChange();
                        this.triggerDelete(deleted_items);
                    }, this.item_duration);
                });

                this.obs.on("select-item-by-index", (args) => {
                    const { index } = args;
                    if(index < 0){
                        return;
                    }
                    const elms = this.$$(".listview-item");
                    if(index >= elms.length){
                        return;
                    }
                    elms.forEach((elm) => {
                        elm.classList.remove("selected");
                    });
                    elms[index].classList.add("selected");  
                });

                this.obs.on("clear-select", () => {
                    const elms = this.$$(".listview-item");
                    elms.forEach((elm) => {
                        elm.classList.remove("selected");
                    });
                });

                this.obs.on("toggle-mark", (args) => {
                    const { items } = args;
                    items.forEach(item => {
                        item.marked = !item.marked;
                    });
                    this.updateItemIcon();
                });
            },
            onMounted() {
                const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
                this.item_duration = parseInt(prop);

                const elm = this.$(".listview-list");
                this.sortable = Sortable.create(elm, {
                    ghostClass: "listview-item-ghost-class",
                    draggable: ".listview-item",
                    onSort: (evt) => {  // eslint-disable-line no-unused-vars
                        this.sortItems();
                    }
                });
            },
            triggerChange() {
                const items = JSON.parse(JSON.stringify(this.state.items)).map(item=>{
                    delete item.state;
                    return item;
                });
                this.obs.trigger("changed", {items});
            },
            triggerDelete(items) {
                const deleted_items = JSON.parse(JSON.stringify(items)).map(item=>{
                    delete item.state;
                    return item;
                });
                this.obs.trigger("items-deleted", {items:deleted_items});
            },
            async deleteConfirm() {
                if(this.confirm.includes("delete") === false){
                    return true;
                }
                const ret = await myapi.ipc.Dialog.showMessageBox({
                    message: "削除しますか?", 
                    okcancel: true
                });
                return ret;
            },
            sortItems() {
                const order = this.sortable.toArray().map(value=>Number(value));
                const sorted_items = [];
                order.forEach(value => {
                    sorted_items.push(this.state.items[value]);
                });
                this.state.items = sorted_items;

                this.update();

                this.triggerChange();
            },
            filter(query) {
                const elms = this.$$(".listview-item");
                elms.forEach((elm, index) => {
                    if (query == "") {
                        elm.style.display ="";
                    }else{
                        if(this.state.items[index].title.toLowerCase().includes(query)){
                            elm.style.display ="";
                        }else{
                            elm.style.display ="none";
                        }
                    }
                });

                this.update();

                const dofilter = query!="";
                this.sortable.option("disabled", dofilter);
            },
            onkeydownSearchInput(e) {
                if(e.code == "Enter"){
                    const query = getInputValue(this);
                    this.filter(query);
                }
            },
            onclickSearch(e) { // eslint-disable-line no-unused-vars
                const query = getInputValue(this);
                this.filter(query);
            },
            onclickShowAll(e) { // eslint-disable-line no-unused-vars
                setInputValue(this, "");
                this.filter("");
            },
            getIconClass(item) {
                let icon = this.getIcon(item);
                if(!icon){
                    icon = default_icon;
                }
                const color = item.marked?"marked":"default";
                return `center-hv ${icon} listview-item-${color}-icon-color`;
            },
            setSelected(target_elm, item) { // eslint-disable-line no-unused-vars
                const elms = this.$$(".listview-item");
                elms.forEach((elm) => {
                    elm.classList.remove("selected");
                });
                const target = target_elm.closest(".listview-item");
                if(target){
                    target.classList.add("selected"); 
                }
            },
            getSelectedItems() {
                const elms = this.$$(".listview-item");
                return this.state.items.filter((item, index) => {
                    return elms[index].classList.contains("selected")===true;
                });
            },
            onclickItem(item, e) {
                this.setSelected(e.target, item);
                this.obs.trigger("item-clicked", item);
            },
            ondblclickItem(item, e) { // eslint-disable-line no-unused-vars
                this.obs.trigger("item-dlbclicked", item);
            },
            onclickItemAsdblclick(item, e) {
                if(this.contextmenu_show){
                    return;
                }
                this.setSelected(e.target, item);
                this.obs.trigger("item-dlbclicked", item);
            },
            updateItemIcon() {
                this.update();
                this.triggerChange();
            },
            async onmouseUp(item, e) {
                this.setSelected(e.target, item);
                if(e.button===2){
                    const items = this.getSelectedItems();
                    this.contextmenu_show = true;
                    if(this.obs.hasReturnEvent("show-contextmenu")){
                        await this.obs.triggerReturn("show-contextmenu", e, { items });
                    }else{
                        const menu_id = await myapi.ipc.popupContextMenu("listview-toggle-mark");
                        if(menu_id=="toggle-mark"){
                            items.forEach(item => {
                                item.marked = !item.marked;
                            });
                            this.updateItemIcon();
                        }
                    }
                    this.contextmenu_show = false;
                }
            },
            onmouseDown(item, e) {
                this.setSelected(e.target, item);
            },
            async onclickDelete(i, e) { // eslint-disable-line no-unused-vars
                if(await this.deleteConfirm() === false){
                    return;
                }
                this.state.items[i].state = "listview-item-hide-anime";
                this.update(); 
    
                setTimeout(() => { 
                    const deleted_items = this.state.items.splice(i, 1);
                    this.state.items.forEach(item=>{
                        item.state = "";
                    });
                    this.update();
                    this.triggerChange();
                    this.triggerDelete(deleted_items);
                }, this.item_duration);
            }
        };
    </script>
</listview>