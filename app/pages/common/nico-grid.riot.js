const { MyObservable } = require("../app/js/my-observable");
const { ImgElementCache } = require("./nico-grid-img-cache");
const { getFormatter } = require("./nico-grid-formatter");

const debounce = (fn, interval) => {
    let timer;
    return (e) => {
        clearTimeout(timer);
        timer = setTimeout(function() {
            fn(e);
        }, interval);
    };
};

/**
 * 
 * @param {Object} column 
 * @returns 
 */
const getSortable = (column) => {
    const column_id = column.id;
    const sortable = column.sortable;
    const non_sortable_ids = ["thumb_img", "command"];
    if(non_sortable_ids.includes(column_id)){
        return false;
    }
    if(sortable == undefined){
        return true;
    }
    return sortable;
};

const row_cont_margin = 20;
const default_column_width = 150;
const scroll_event_interval = 100;

module.exports = {
    state:{
        /** @type {number[]} */
        data_indexes:[],
        /** @type {string[]} */
        column_ids:[]
    },
    /** @type {Object[]} */
    data_list: [],
    /** @type {Object[]} */
    view_data_list: [],
    key_id: "",
    key_id_data_map:new Map(),

    /** @type {Map<string, any>} */
    column_props_map:new Map(),

    /** @type {Map<string, any>} */
    cell_ft:new Map(),

    /** @type {MyObservable} */
    obs: null,
    top_offset:0,
    /** @type {string[]} */
    sel_data_key_ids:[],
    /** @type {ImgElementCache} */
    img_elm_cache: null,

    /** @type {NicoGridOptions} */
    options:null,

    initOptions(options){
        if(!options.header_height){
            options.header_height = 30;
        }
        if(!options.row_height){
            options.row_height = 135;
        }
        if(!options.sort_param){
            options.sort_param = {
                id: "",
                asc: true
            };
        }
        if(!options.filter_target_ids){
            options.filter_target_ids = Array.from(this.column_props_map.keys());
        }
        if(!options.img_cache_capacity){
            options.img_cache_capacity = 50;
        }
        if(!options.view_margin_num){
            options.view_margin_num = 5;
        }
    },
    onBeforeMount(props) {  
        this.state.column_ids = [];
        this.state.data_indexes = [];
        this.data_list = [];
        this.view_data_list = [];
        this.key_id = "";
        this.key_id_data_map = new Map();
        this.column_props_map = new Map();
        this.cell_ft = new Map();
        this.top_offset = 0;
        this.sel_data_key_ids = [];
        this.start_pos = null;

        props.columns.forEach(column => {
            this.column_props_map.set(column.id, {
                name:column.name,
                width:column.width?column.width:default_column_width,
                sortable: getSortable(column)
            });

            const ft = column.ft?column.ft:getFormatter(column.id);
            this.cell_ft.set(column.id, ft);
            this.state.column_ids.push(column.id);
        });

        this.obs = props.obs;
        this.options = props.options;
        this.initOptions(this.options);

        const img_cache_capacity = this.options.img_cache_capacity;
        this.img_elm_cache = 
            new ImgElementCache(img_cache_capacity, ["nico-grid-thumb"]);

        this.obs_header = new MyObservable();

        this.getColumnIds = () => {
            return [...this.state.column_ids];
        };
        this.getColumnPropsMap = () => {
            return new Map(JSON.parse(
                JSON.stringify(Array.from(this.column_props_map))
            ));
        };
    },
    onMounted() {
        /**
         * 
         * @param {number} data_index 
         * @returns {string}
         */
        this.getRowStyle = (data_index) => {
            const row_height = this.options.row_height;
            const top = data_index*row_height - this.top_offset;
            return `height:${row_height}px; top:${top}px;`;
        };
        /**
         * 
         * @param {number} data_index 
         * @returns {string}
         */
        this.getRowClass = (data_index) => {
            const classes = [];
            if(data_index % 2 == 1){
                classes.push("nico-grid-row-odd");
            }
            const id = this.view_data_list[data_index][this.key_id];
            if(this.sel_data_key_ids.includes(id)){
                classes.push("nico-grid-row-select");
            }
            return classes.join(" ");
        };
        /**
         * 
         * @param {string} column_id 
         * @returns {string}
         */
        this.getBodyCellStyle = (column_id) => {
            let w = default_column_width;
            if(this.column_props_map.has(column_id)){
                w = this.column_props_map.get(column_id).width;
            }
            const row_height = this.options.row_height;
            return `height:${row_height}px; width:${w}px;`;
        };

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        body_elm.style.height = `calc(100% - ${this.options.header_height}px)`;
        body_elm.addEventListener("scroll", debounce((e)=>{
            this.updateRows();
        }, scroll_event_interval));
        body_elm.addEventListener("scroll", (e) => {
            /** @type {HTMLElement} */
            const target_elm = e.target;
            const scrollLeft = target_elm.scrollLeft;
            /** @type {HTMLElement} */
            const header_cont_elm = this.$(".header-cell-container");
            header_cont_elm.style.left = (-scrollLeft * 1) + "px";
        });

        const el_width = this.getRowContainerWidth();
        const elm = this.$(".row-container");
        elm.style.width = (el_width + row_cont_margin) + "px"; 

        this.obs.onReturn("set-data", (args) => {
            /** @type {{key_id: string, items: Object[]}} */
            const { key_id, items } = args;
            this.key_id = key_id;
            this.data_list = items.map( item => ({...item}));
            this.view_data_list = this.data_list;
            
            const sort_param = this.options.sort_param;
            this.sort(sort_param);
            this.obs_header.trigger("changed-sort", {
                sort_param: sort_param
            });

            this.key_id_data_map.clear();
            this.data_list.forEach(item=>{
                const id = item[key_id];
                this.key_id_data_map.set(id, item);
            });
 
            this.sel_data_key_ids = [];

            this.updateAnchorPos();
            this.scrollTo(0);
            this.updateRows();
        });
        this.obs.onReturn("get-items", () => {
            return JSON.parse(JSON.stringify(this.data_list));
        });
        this.obs.on("update-item", (args) => {
            /** @type {{id: string, props: Object}} */
            const {id, props} = args;
            this.updateItem(id, props);
        });
        this.obs.on("sort-data", (args) => {
            /** @type {{sort_param: NicoGridSortParam}} */
            const {sort_param} = args;
            this.sort(sort_param);
        });
        this.obs.onReturn("delete-items", (args) => {
            /** @type {{ids: string[]}} */
            const {ids} = args;
            this.deleteItems(ids);
        });
        this.obs.onReturn("add-items", (args) => {
            /** @type {{items: Object[]}} */
            const {items} = args;
            this.addItems(items);
        });
        this.obs.onReturn("get-selected-data-list", () => {
            return this.getSelectedDataList();
        });
        this.obs.on("set-selected-by-index", (args) => {
            /** @type {{index: number}} */
            const {index} = args;

            const sel_data = this.view_data_list.slice(index, index + 1);
            if(!sel_data.length){
                return;
            }
            this.sel_data_key_ids = [];
            this.sel_data_key_ids.push(sel_data[0][this.key_id]);
            this.update();
        });
        this.obs.on("scroll-to", (args) => {
            /** @type {{id: string, value: any}} */
            const {id, value} = args;
            const index = this.view_data_list.findIndex(item=>{
                return item[id] == value;
            });
            if(index == -1){
                return;
            }
            this.scrollTo(index * this.options.row_height);
        });
        this.obs.onReturn("get-index-by-id", (args) => {
            /** @type {{id: string, value: any}} */
            const {id, value} = args;
            const index = this.view_data_list.findIndex(item=>{
                return item[id] == value;
            });
            return index;
        });
        this.obs.on("scroll-to-index", (args) => {
            /** @type {{index: number, position: string}} */
            const {index, position} = args;
            if(index == -1){
                return;
            }
            const row_height = this.options.row_height;
            if(position == "top"){
                this.scrollTo(index * row_height);
            }
            if(position == "bottom"){
                const body_elm = this.$(".body");
                const range = body_elm.clientHeight; 
                const num = Math.floor(range / row_height);
                const offset = range % row_height;
                const pos = (index - num + 1) * row_height - offset;
                this.scrollTo(pos);
            }
        });
        this.obs.on("filter", (args) => {
            /** @type {{ids:string[], text:string}} */
            const {ids, text} = args;
            const words = text.split(" ");
            this.view_data_list = this.filter(ids, words);

            this.sel_data_key_ids = [];

            this.updateAnchorPos();
            this.scrollTo(0);
            this.updateRows();
        });
        this.obs.onReturn("get-data-length", () => {
            return this.view_data_list.length;
        });

        this.obs_header.on("header-order-changed", (args) => {
            /** @type {{column_ids:string[]}} */
            const {column_ids} = args;
            
            this.state.column_ids = column_ids;
            this.updateRows();

            this.triggerStateChanged();
        });
        this.obs_header.on("header-width-changed", (args) => {
            /** @type {{column_props_map:Map}} */
            const {column_props_map} = args;
            
            this.column_props_map = column_props_map;
            const el_width = this.getRowContainerWidth();
            const elm = this.$(".row-container");
            elm.style.width = (el_width + row_cont_margin) + "px"; 

            this.updateRows();

            this.triggerStateChanged();
        });
        this.obs_header.on("header-clicked", (args) => {
            /** @type {{column_id: string}} */
            const {column_id} = args;
            const sort_param = this.options.sort_param;
            if(sort_param.id == column_id){
                sort_param.asc = !sort_param.asc;
            }else{
                sort_param.id = column_id;
                sort_param.asc = true;
            }
            this.sort(sort_param);
            this.obs_header.trigger("changed-sort", {
                sort_param: sort_param
            });

            this.triggerStateChanged();
        });

        let resize_timer = null;
        const resize_obs = new ResizeObserver(() => {
            if(resize_timer){
                clearTimeout(resize_timer);
            }
            resize_timer = setTimeout(() => {
                if(this.view_data_list.length > 0){
                    this.updateRows();
                }       
                resize_timer = null;
            }, 200);
        });
        const container_elm = this.$(".nico-grid-container");
        resize_obs.observe(container_elm);
    },
    // eslint-disable-next-line no-unused-vars
    onUpdated(props, state) {
        if(!state.data_indexes.length){
            return;
        }
        this.updateCells();
        this.appendThumbImg();
    },
    appendThumbImg() {
        if(this.view_data_list.length==0){
            return;
        }
        if(!this.view_data_list[0].thumb_img){
            return;
        }

        /** @type {string[]} */
        const urls = [];
        this.state.data_indexes.forEach(idx=>{
            urls.push(this.view_data_list[idx].thumb_img);
        });
        if(urls.length==0){
            return;
        }
        /** @type {HTMLImageElement[]} */
        const img_elms = this.$$(".nico-grid-img-holder");
        if(img_elms.length==0){
            return;
        }
        this.img_elm_cache.getImg(urls, (i, img_elm) => {
            if(img_elm){
                img_elms[i].appendChild(img_elm);
            }   
        });
    },
    updateCells(){
        /** @type {HTMLElement[]} */
        const cell_elms = this.$$(".body-cell");
        cell_elms.forEach(elm => {
            const data_index = Number(elm.dataset.dataindex);
            const column_id = elm.dataset.columnid;
            
            const data = this.view_data_list[data_index];
            const value = data[column_id];
            const ft = this.cell_ft.get(column_id);
            if(ft){
                elm.innerHTML = ft(column_id, value, data);
            }else{
                elm.innerHTML = value;
            }
        });
    },
    updateAnchorPos(){
        /** @type {HTMLElement} */
        const elm = this.$(".nico-grid-anchor");
        const row_height = this.options.row_height;
        elm.style.top = (this.view_data_list.length * row_height) + "px";
    },
    /**
     * 
     * @returns {number}
     */
    getRowContainerWidth(){
        return Array.from(this.column_props_map.values()).reduce((a, b) => {
            return a + b.width;
        }, 0);
    },
    /**
     * 
     * @param {string[]} target_ids 
     * @param {string[]} words 
     * @returns {Object[]}
     */
    filter(target_ids, words){
        if(this.data_list.length==0){
            return;
        }
        if(words.length==0){
            return this.data_list;
        }
        
        const keys = target_ids.length>0?target_ids:this.options.filter_target_ids;
        return this.data_list.filter(item=>{
            return words.every(word => {
                for(const k of keys){
                    if(item[k] == undefined){
                        continue;
                    }
                    const value = String(item[k]).toLowerCase();
                    if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                        return true;
                    }
                }
            });
        });
    },
    /**
     * 
     * @param {number} value 
     */
    scrollTo(value){
        const body_elm = this.$(".body");
        body_elm.scrollTop = value;
    },
    updateRows(){
        if(this.view_data_list.length == 0){
            this.update({
                data_indexes:[]
            });
            return;
        }

        const body_elm = this.$(".body");
        const scroll_top = body_elm.scrollTop;
        const range = body_elm.offsetHeight; 
        const row_height = this.options.row_height;
        const view_margin_num = this.options.view_margin_num;
        let start_index = Math.floor(scroll_top/row_height);
        let end_index = Math.floor(start_index + range/row_height + 0.5);

        const row_cont_elm = this.$(".row-container");
        this.top_offset = scroll_top % row_height;
        if(start_index>view_margin_num){
            this.top_offset += view_margin_num * row_height;
            start_index = start_index - view_margin_num;
        }else{    
            this.top_offset += start_index * row_height;
            start_index = 0;
        }
        row_cont_elm.style.top = (scroll_top - this.top_offset) + "px";

        end_index += view_margin_num;
        if(this.view_data_list.length <= end_index){
            end_index = this.view_data_list.length;
        }
        const data_indexes = this.cnvData(start_index, end_index);
        this.update({
            data_indexes:data_indexes
        });
    },
    /**
     * 
     * @param {string} id 
     * @param {Object} props 
     */
    updateItem(id, props){
        const item = this.key_id_data_map.get(id);
        if(item === undefined){
            return;
        }
        Object.keys(props).forEach(key=>{
            item[key] = props[key];
        });
        this.updateRows();
    },
    /**
     * 
     * @param {NicoGridSortParam} sort_param 
     */
    sort(sort_param){
        if(!this.data_list || !this.view_data_list){
            return;
        }

        let order = 1;
        if(!sort_param.asc){
            order = -1;
        }
        const id = sort_param.id;
        [this.data_list, this.view_data_list].forEach(data_list=>{
            data_list.sort((a, b)=>{
                if(a[id] < b[id]){
                    return -1*order;
                }
                if(a[id] > b[id]){
                    return 1*order;
                }
                return 0;
            }); 
        });

        this.updateRows();
    },
    /**
     * 
     * @returns {Object[]}
     */
    getSelectedDataList(){
        const sel_data_list = [];
        this.sel_data_key_ids.forEach(id => {
            const f_index = this.view_data_list.findIndex(d => {
                return id == d[this.key_id];
            });
            if(f_index >= 0){
                sel_data_list.push(this.view_data_list[f_index]);
            }
        });
        return sel_data_list.map( item => ({...item}));
    },
    /**
     * 
     * @param {string[]} key_ids 
     */
    deleteItems(key_ids){
        /** @type {string[]} */
        const has_keys = [];
        key_ids.forEach(key_id => {
            if(this.key_id_data_map.has(key_id)){
                has_keys.push(key_id);
            }
        });
        if(has_keys.length == 0){
            return;
        }

        this.data_list = this.data_list.filter(data => {
            return !key_ids.includes(data[this.key_id]);
        });
        this.view_data_list = this.view_data_list.filter(data => {
            return !key_ids.includes(data[this.key_id]);
        });
        key_ids.forEach(key_id => {
            this.key_id_data_map.delete(key_id);
        });

        this.sel_data_key_ids = [];
        key_ids.forEach(key_id => {
            if(this.sel_data_key_ids.includes(key_id)){
                const sel_i = this.sel_data_key_ids.indexOf(key_id);
                if(sel_i >= 0){
                    this.sel_data_key_ids.splice(sel_i, 1);
                }
            }
        });

        this.updateAnchorPos();

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        const org_sc_top = body_elm.scrollTop;
        const row_height = this.options.row_height;
        const sc_move = has_keys.length * row_height;
        if(sc_move < body_elm.scrollTop){
            body_elm.scrollTop -= sc_move;
        }else{
            this.scrollTo(0);
        }

        if(org_sc_top == body_elm.scrollTop){
            this.updateRows();
        } 
    },
    /**
     * 
     * @param {Object[]} items 
     */
    addItems(items){
        items.forEach(item=>{
            const id = item[this.key_id];
            this.key_id_data_map.set(id, item);
        });

        this.data_list = this.data_list.concat(items);
        this.view_data_list = this.view_data_list.concat(items);
        this.sort(this.options.sort_param);
        this.updateAnchorPos();
        this.updateRows();
    },
    /**
     * 
     * @param {number} start_index 
     * @param {number} end_index 
     * @returns {number[]}
     */
    cnvData(start_index, end_index){
        /** @type {number[]} */
        const index_list = [];
        for(let i=start_index; i<end_index; i++){
            index_list.push(i);
        }
        return index_list;
    },
    /**
     * 
     * @param {number} index 
     * @param {boolean} ctrlKey 
     * @param {boolean} shiftKey 
     */
    updateSelect(index, ctrlKey, shiftKey){
        const id = this.view_data_list[index][this.key_id];
        if(!ctrlKey && !shiftKey){
            /** @type {HTMLElement[]} */
            const row_elms = this.$$(".row");
            row_elms.forEach(elm=>{
                elm.classList.remove("nico-grid-row-select");
            });
            this.sel_data_key_ids = [];
            this.update();
            this.sel_data_key_ids.push(id);
        }
        if(ctrlKey && !shiftKey){
            if(this.sel_data_key_ids.includes(id)){
                const sel_i = this.sel_data_key_ids.indexOf(id);
                if(sel_i >= 0){
                    this.sel_data_key_ids.splice(sel_i, 1);
                }
            }else{
                this.sel_data_key_ids.push(id);
            }  
        }
        if(!ctrlKey && shiftKey){
            if(this.sel_data_key_ids.length>0){
                const indexs = [];
                this.sel_data_key_ids.forEach(id => {
                    const f_index = this.view_data_list.findIndex(data => {
                        return id == data[this.key_id];
                    });
                    if(f_index >= 0){
                        indexs.push(f_index);
                    }
                });
                indexs.sort((a, b) => {
                    return a - b;
                });

                const last_index = indexs.slice(-1)[0];
                const s = Math.min(index, last_index);
                const e = Math.max(index, last_index);
                const size = e - s;
                this.sel_data_key_ids = [];
                this.update();
                const new_indexs = [...Array(size + 1)].map((_, i) => i + s);
                new_indexs.forEach(idx => {
                    const sel_data = this.view_data_list[idx];
                    this.sel_data_key_ids.push(sel_data[this.key_id]);
                });
            }
        }
        this.update();
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    onMouseDown(e){
        if(e.buttons != 2){
            return;
        }
        this.start_pos = {
            x: e.pageX,
            y: e.pageY,
        };
    },
    /**
     * 
     * @param {number} data_index 
     * @param {MouseEvent} e 
     */
    onMouseUp(data_index, e){
        if(this.start_pos){
            const data = this.view_data_list[data_index];
            const key_id = data[this.key_id];
            if(!this.sel_data_key_ids.includes(key_id)){
                this.updateSelect(data_index, e.ctrlKey, e.shiftKey);
            }
            this.popupContextMenu(e);
            return;
        }

        this.updateSelect(data_index, e.ctrlKey, e.shiftKey);

        if (e.target.classList.contains("cmd-btn")) {
            const cmd_id = e.target.dataset.cmdid;
            const data = this.view_data_list[data_index];
            this.obs.trigger("cmd", {cmd_id, data});
            e.stopPropagation();
            return;
        }
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    popupContextMenu(e){
        if(!this.start_pos){
            return;
        }
        const distance = 20;
        const x = Math.abs(this.start_pos.x - e.pageX);
        const y = Math.abs(this.start_pos.y - e.pageY);
        this.start_pos = null;
        if(x > distance || y > distance){
            return;
        }
        if(this.sel_data_key_ids.length==0){
            return;
        }
        this.obs.trigger("show-contexmenu", {e});
    },
    /**
     * 
     * @param {number} data_index 
     * @param {Event} e 
     */
    onDbClick(data_index, e){
        const data = this.view_data_list[data_index];
        this.obs.trigger("db-cliecked", {data});
    },
    triggerStateChanged(){
        const columns = this.state.column_ids.map(column_id => {
            const props = this.column_props_map.get(column_id);
            return {
                id: column_id,
                width: props.width
            };
        });
        const sort_param = Object.assign({}, this.options.sort_param);
        
        this.obs.trigger("state-changed", {
            state: {
                columns,
                sort_param
            }
        });
    }
};