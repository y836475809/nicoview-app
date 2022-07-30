const myapi = require("../../js/my-api");
const { MouseGesture } = require("../../js/mouse-gesture");
const { window_obs } = require("../../js/my-observable");
const { logger } = require("../../js/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    state:{
        donwnload_item_num:0
    },
    /** @type {MouseGesture} */
    mouse_gesture:null,
    onBeforeMount() {
        this.mouse_gesture = new MouseGesture();
        main_obs.on("main-page:update-mousegesture-config", (args)=>{
            const { config } = args;
            this.mouse_gesture.config = config;
        });

        (async()=>{
            const config = await  myapi.ipc.Config.get(
                this.mouse_gesture.name,  this.mouse_gesture.defaultConfig);
            this.mouse_gesture.config = config;
        })(); 
        
        this.mouse_gesture.setActionSearchBackPage(()=>{main_obs.trigger("search-page:back-page");});
        this.mouse_gesture.setActionSearchFowardPage(()=>{main_obs.trigger("search-page:forward-page");});
        this.mouse_gesture.setActionShowPalyer(()=>{
            myapi.ipc.showyPlayer();
        });

        this.mouse_gesture.onGesture((gesture)=>{
            if( this.mouse_gesture.action("all-page", gesture)){
                return;
            }
            
            const items = [...this.$$(".page-container.left > *")];
            const cu_index = items.findIndex(item=>{
                return item.style.zIndex > 0;
            });
            if(cu_index<0){
                return;
            }
            const page_name = items[cu_index].tagName.toLowerCase();
            if( this.mouse_gesture.action(page_name, gesture)){
                return;
            }
        });

        myapi.ipc.Download.onUpdateItem(async ()=>{
            await this.updateDownloadBadge();
        });

        myapi.ipc.Setting.onChangeLogLevel((args) => {
            const { level } = args;
            logger.setLevel(level);
        });

        main_obs.on("main-page:select-page", (
            /** @type {string} */ page_name)=>{
            this.select_page(page_name);
        });  

        myapi.ipc.Search.onSearchTag((args)=>{
            main_obs.trigger("main-page:select-page", "search");
            main_obs.trigger("search-page:search-tag", args);
        });

        myapi.ipc.MyList.onLoad((args)=>{
            main_obs.trigger("main-page:select-page", "mylist");
            main_obs.trigger("mylist-page:load-mylist", args);
        });

        myapi.ipc.Download.onAddItems((args)=>{
            const items = args;
            main_obs.trigger("download-page:add-download-items", items);
        });
        myapi.ipc.Download.onDeleteItems((args)=>{
            const items = args;
            main_obs.trigger("download-page:delete-download-items", items);
        });

        myapi.ipc.Stack.onAddItems((args)=>{
            main_obs.trigger("play-stack-page:add-items", args);
        });

        myapi.ipc.Bookmark.onAddItems((args)=>{
            const bk_items = args;
            main_obs.trigger("bookmark-page:add-items", bk_items);
        });
    },
    async onMounted() {
        this.select_page("library");
        this.hideRightPage();

        await this.updateDownloadBadge();
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousedown(e) {
        this.mouse_gesture.mouseDown(e);
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mouseup(e) {
        this.mouse_gesture.mouseUp(e);
    },
    async updateDownloadBadge() {
        const video_ids = await  myapi.ipc.Download.getIncompleteIDs();
        const elm = this.$(".download-badge > .item-num");
        if(video_ids.length === 0){
            elm.style.display = "none";
        }else{
            elm.style.display = "";
        }
        this.state.donwnload_item_num = video_ids.length;
        this.update();
    },
    changeClass(remove_query, add_query, class_name) {
        const elms = this.$$(remove_query);
        elms.forEach(elm => {
            elm.classList.remove(class_name);
        });
        const elm = this.$(add_query);
        elm.classList.add(class_name);
    },
    /**
     * 
     * @param {string} page_name 
     */
    select_page(page_name){
        Array.from(this.$$(".page-container.left > *"), 
            (elm) => {
                elm.style.zIndex = 0;
            });
        const page = this.$(`#${page_name}-page`);
        page.style.zIndex = 1;

        this.changeClass(
            ".main-sidebar.left > .button", 
            `.${page_name}-button`, 
            "select-button");

        this.changeClass(
            ".main-sidebar.left i.fas", 
            `.${page_name}-button i.fas`, 
            "select-icon");

        this.changeClass(
            ".main-sidebar.left .button-border", 
            `.${page_name}-button > .button-border`, 
            "select-button-border");
    },
    /**
     * 
     * @param {string} page_name 
     * @param {Event} e 
     */
    onclickPageSelect(page_name, e) { // eslint-disable-line no-unused-vars
        this.select_page(page_name);
    },
    hideRightPage() { 
        Array.from(this.$$(".page-container.right > *"), 
            (elm) => {
                elm.style.zIndex = -1;
            });
    },
    /**
     * 
     * @param {HTMLElement} elm 
     * @param {string} toggle_class 
     * @param {string} select_class 
     */
    toggleRightSidebarClass(elm, toggle_class, select_class) {
        if(elm.classList.contains(toggle_class)===true){
            elm.classList.remove(toggle_class); 
        }else{
            const buttons = this.$$(`.main-sidebar.right ${select_class}`);
            buttons.forEach(btn => {
                btn.classList.remove(toggle_class); 
            });
            elm.classList.add(toggle_class); 
        } 
    },
    /**
     * 
     * @param {string} page_name 
     * @param {Event} e 
     */
    onclickTogglePage(page_name, e) {
        /** @type {HTMLElement} */
        const page = this.$(`.${page_name}-page`);
        const page_zIndex = page.style.zIndex;

        this.hideRightPage();

        if(page_zIndex > 0){
            page.style.zIndex = -1;
        }else{
            page.style.zIndex = 2;
        }

        this.toggleRightSidebarClass(e.target, "select-button", ".button");

        const icon_elm = this.$(`.${page_name}-button i.fas`);
        this.toggleRightSidebarClass(icon_elm, "select-icon", "i.fas");

        const border_elm = this.$(`.${page_name}-button > .button-border`);
        this.toggleRightSidebarClass(border_elm, "select-button-border", ".button-border");
    }
};