const Sortable = require("sortablejs");
const myapi = require("../../js/my-api");

const default_icon = "fas fa-square listview-item-default-icon";

module.exports = {
    state: {
        /** @type {ListItem[]} */
        items:[]
    },
    item_duration: 300,

    /** @type {Sortable} */
    sortable:null,

    /** @type {MyObservable} */
    obs:null,

    /** @type {string[]} */
    confirm:null,

    contextmenu_show:false,

    /** @type {(selector:string)=>HTMLElement} */
    _$:null, // eslint-disable-line no-unused-vars
    
    /** @type {(selector:string)=>HTMLElement[]} */
    _$$:null,// eslint-disable-line no-unused-vars

    /**
     * 
     * @returns {string}
     */
    getInputValue(){
        /** @type {HTMLInputElement} */
        const elm = this.$(".listview-input");
        return elm.value.toLowerCase();
    },
    /**
     * 
     * @param {string} value 
     */
    setInputValue(value){
        /** @type {HTMLInputElement} */
        const elm = this.$(".listview-input");
        elm.value = value;
    },
    onBeforeMount(props) {
        this.obs = props.obs;
        
        /** @type {(item:ListItem)=>string} */
        this.getTooltip = props.gettooltip;
        if(!this.getTooltip){
            this.getTooltip = (item) => {
                return item.title;
            };
        }

        /** @type {(item:ListItem)=>string} */
        this.getTitle = props.gettitle;
        if(!this.getTitle){
            this.getTitle = (item) => {
                return item.title;
            };
        }

        /** @type {(item:ListItem)=>string} */
        this.getIcon = props.geticon;
        if(!this.getIcon){
            this.getIcon = (item) => { // eslint-disable-line no-unused-vars
                return default_icon;
            };
        }  

        this._$ = (selector) => {
            return this.$(selector);
        };

        this._$$ = (selector) => {
            return this.$$(selector);
        };

        this.confirm = !props.confirm?[]:props.confirm;

        this.obs.on("loadData", async (args) => {
            /** @type {{items: ListItem[]}} */
            const { items } = args;
            this.state.items = items;
            this.update();
        });

        this.obs.on("addList", async (args) => {
            /** @type {{items: ListItem[]}} */
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

                const query = this.getInputValue();
                this.filter(query);
                this.triggerChange();
            }, 50);
        });

        this.obs.on("deleteList", async () => {
            if(await this.deleteConfirm() === false){
                return;
            }

            const elms = this._$$(".listview-item");
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
            /** @type {{index: number}} */
            const { index } = args;
            if(index < 0){
                return;
            }

            const elms = this._$$(".listview-item");
            if(index >= elms.length){
                return;
            }
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            elms[index].classList.add("selected");  
        });

        this.obs.on("clear-select", () => {
            const elms = this._$$(".listview-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
        });

        this.obs.on("toggle-mark", (args) => {
            /** @type {{items: ListItem[]}} */
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

        const elm = this._$(".listview-list");
        this.sortable = Sortable.create(elm, {
            ghostClass: "listview-item-ghost-class",
            draggable: ".listview-item",
            onSort: (evt) => {  // eslint-disable-line no-unused-vars
                const src_index  = evt.oldDraggableIndex;
                const target_index  = evt.newDraggableIndex;
                this.moveItem(src_index, target_index);
            }
        });
    },
    triggerChange() {
        /** @type {ListItem[]} */
        const items = JSON.parse(JSON.stringify(this.state.items)).map(item=>{
            delete item.state;
            return item;
        });
        this.obs.trigger("changed", {items});
    },
    /**
     * 
     * @param {ListItem[]} items 
     */
    triggerDelete(items) {
        /** @type {ListItem[]} */
        const deleted_items = JSON.parse(JSON.stringify(items)).map(item=>{
            delete item.state;
            return item;
        });
        this.obs.trigger("items-deleted", {items:deleted_items});
    },
    /**
     * 
     * @returns {Promise.<boolean>}
     */
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
    /**
     * リストのsrc_index位置のアイテムをtarget_index位置に移動させる
     * (アイテムのドラッグドロップでの移動)
     * @param {number} src_index 移動元index
     * @param {number} target_index 移動先index
     */
    moveItem(src_index, target_index) {
        const items = JSON.parse(JSON.stringify(this.state.items));
        const src_item = items[src_index];
        items.splice(src_index, 1);
        items.splice(target_index, 0, src_item);

        // 一旦クリア状態で更新させないと正常な並びにならない
        this.state.items.splice(0);
        this.update();

        // 移動させた状態で更新
        this.state.items = items;
        this.update();

        this.triggerChange();
    },
    /**
     * 
     * @param {string} query 
     */
    filter(query) {
        const elms = this._$$(".listview-item");
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
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    onkeydownSearchInput(e) {
        if(e.code == "Enter"){
            const query = this.getInputValue();
            this.filter(query);
        }
    },
    onclickSearch(e) { // eslint-disable-line no-unused-vars
        const query = this.getInputValue();
        this.filter(query);
    },
    onclickShowAll(e) { // eslint-disable-line no-unused-vars
        this.setInputValue("");
        this.filter("");
    },
    /**
     * 
     * @param {ListItem} item 
     * @returns {string}
     */
    getIconClass(item) {
        let icon = this.getIcon(item);
        if(!icon){
            icon = default_icon;
        }
        const color = item.marked?"marked":"default";
        return `center-hv ${icon} listview-item-${color}-icon-color`;
    },
    /**
     * 
     * @param {HTMLElement} target_elm 
     * @param {ListItem} item 
     */
    setSelected(target_elm, item) { // eslint-disable-line no-unused-vars
        const elms = this._$$(".listview-item");
        elms.forEach((elm) => {
            elm.classList.remove("selected");
        });
        const target = target_elm.closest(".listview-item");
        if(target){
            target.classList.add("selected"); 
        }
    },
    getSelectedItems() {
        const elms = this._$$(".listview-item");
        return this.state.items.filter((item, index) => {
            return elms[index].classList.contains("selected")===true;
        });
    },
    /**
     * 
     * @param {ListItem} item 
     * @param {Event} e 
     */
    onclickItem(item, e) {
        this.setSelected(e.target, item);
        this.obs.trigger("item-clicked", item);
    },
    /**
     * 
     * @param {ListItem} item 
     * @param {Event} e 
     */
    ondblclickItem(item, e) { // eslint-disable-line no-unused-vars
        this.obs.trigger("item-dlbclicked", item);
    },
    /**
     * 
     * @param {ListItem} item 
     * @param {Event} e 
     */
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
    /**
     * 
     * @param {ListItem} item 
     * @param {MouseEvent} e 
     */
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
    /**
     * 
     * @param {ListItem} item 
     * @param {MouseEvent} e 
     */
    onmouseDown(item, e) {
        this.setSelected(e.target, item);
    },
    /**
     * 
     * @param {number} i 
     * @param {Event} e 
     * @returns 
     */
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