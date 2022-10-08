const { MyObservable } = require("../app/js/my-observable");

const debounce = (fn, interval) => {
    let timer;
    return (e) => {
        clearTimeout(timer);
        timer = setTimeout(function() {
            fn(e);
        }, interval);
    };
};

const row_cont_margin = 20;

module.exports = {
    state:{
        /** @type {number[]} */
        data_indexes:[],
        /** @type {string[]} */
        column_ids:[]
    },
    src_data_list: [],
    data_list: [],
    key_id: "",
    key_id_data_map:new Map(),

    /** @type {Map<string, any>} */
    column_props_map:new Map(),

    /** @type {MyObservable} */
    obs: null,
    header_height:30,
    row_height:100,
    top_offset:0,
    /** @type {string[]} */
    sel_data_key_ids:[],
    sort: {
        key: "",
        asc: true
    },

    onBeforeMount(props) {        
        this.obs = props.obs;
        this.header_height = props.header_height;
        this.row_height = props.row_height;
        this.sort = props.sort;

        this.cell_ft = new Map();

        props.columns.forEach(column => {
            this.column_props_map.set(column.id, {
                name:column.name,
                width:column.width,
            });
            this.cell_ft.set(column.id, column.ft);
            this.state.column_ids.push(column.id);
        });
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
        this.getRowStyle = (data_index) => {
            const top = data_index*this.row_height - this.top_offset;
            return `height:${this.row_height}px; top:${top}px;`;
        };
        this.getRowClass = (data_index) => {
            const classes = [];
            if(data_index % 2 == 1){
                classes.push("nico-grid-row-odd");
            }
            const id = this.data_list[data_index][this.key_id];
            if(this.sel_data_key_ids.includes(id)){
                classes.push("nico-grid-row-select");
            }
            return classes.join(" ");
        };
        this.getBodyCellStyle = (column_id) => {
            let w = 150;
            if(this.column_props_map.has(column_id)){
                w = this.column_props_map.get(column_id).width;
            }
            return `height:${this.row_height}px; width:${w}px;`;
        };
        this.getBodyCellHtml = (data_index, column_id) => {
            const data = this.data_list[data_index];
            const value = data[column_id];
            const ft = this.cell_ft.get(column_id);
            if(!ft){
                return value;
            }
            return ft(column_id, value, data);
        };

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        body_elm.style.height = `calc(100% - ${this.header_height}px)`;
        body_elm.addEventListener("scroll", debounce((e)=>{
            this._update_rows();
        }, 100));
        body_elm.addEventListener("scroll", (e) => {
            /** @type {HTMLElement} */
            const target_elm = e.target;
            const scrollLeft = target_elm.scrollLeft;
            /** @type {HTMLElement} */
            const header_cont_elm = this.$(".header-cell-container");
            header_cont_elm.style.left = (-scrollLeft * 1) + "px";
        });

        const el_width = this._getRowContainerWidth();
        const elm = this.$(".row-container");
        elm.style.width = (el_width + row_cont_margin) + "px"; 

        this.obs.onReturn("set-data", (args) => {
            /** @type {{key_id: string, items: []}} */
            const { key_id, items } = args;
            this.key_id = key_id;
            this.src_data_list = items.map( item => ({...item}));
            this.data_list = this.src_data_list;

            this._sort(this.sort.key, this.sort.asc);
            this.obs_header.trigger("changed-sort", {
                sort: this.sort
            });

            this.key_id_data_map.clear();
            this.data_list.forEach(item=>{
                const id = item[key_id];
                this.key_id_data_map.set(id, item);
            });
 
            this.row_data_list = [];
            const f_size = 20;
            const min_size = Math.min(f_size, this.data_list.length);
            this.state.data_indexes = this.cnvData(0, min_size);
            this.sel_data_key_ids = [];

            this._updateAnchorPos();
            this._scrollTo(0);
            this.update();
        });
        this.obs.on("update-item", (args) => {
            const {id, props} = args;
            this.updateItem(id, props);
        });
        this.obs.on("sort-data", (args) => {
            const {key, asc} = args;
            this._sort(key, asc);
        });
        this.obs.on("delete-items", (args) => {
            const {ids} = args;
            this.deleteItems(ids);
        });
        this.obs.on("add-items", (args) => {
            const {items} = args;
            this.addItems(items);
        });
        this.obs.onReturn("get-selected-data-list", () => {
            return this.getSelectedDataList();
        });
        this.obs.on("scroll-to", (args) => {
            const {id, value} = args;
            const index = this.data_list.findIndex(item=>{
                return item[id] == value;
            });
            if(index == -1){
                return;
            }
            this._scrollTo(index * this.row_height);
        });
        this.obs.on("filter", (args) => {
            /** @type {{ids:string[], text:string}} */
            const {ids, text} = args;
            const words = text.split(" ");
            this.data_list = this._filter(ids, words);

            this.sel_data_key_ids = [];

            this._updateAnchorPos();
            this._scrollTo(0);
            this._update_rows();
        });

        this.obs_header.on("header-order-changed", (args) => {
            const {column_ids} = args;
            
            this.state.column_ids = column_ids;
            this._update_rows();
        });
        this.obs_header.on("header-width-changed", (args) => {
            const {column_props_map} = args;
            
            this.column_props_map = column_props_map;
            const el_width = this._getRowContainerWidth();
            const elm = this.$(".row-container");
            elm.style.width = (el_width + row_cont_margin) + "px"; 

            this._update_rows();
        });
        this.obs_header.on("header-clicked", (args) => {
            /** @type {{column_id: string}} */
            const {column_id} = args;
            if(this.sort.key == column_id){
                this.sort.asc = !this.sort.asc;
            }else{
                this.sort.key = column_id;
                this.sort.asc = true;
            }
            this._sort(this.sort.key, this.sort.asc);
            this.obs_header.trigger("changed-sort", {
                sort: this.sort
            });
        });

        let resize_timer = null;
        const resize_obs = new ResizeObserver(() => {
            if(resize_timer){
                clearTimeout(resize_timer);
            }
            resize_timer = setTimeout(() => {
                if(this.data_list.length > 0){
                    this._update_rows();
                }       
                resize_timer = null;
            }, 200);
        });
        const container_elm = this.$(".nico-grid-container");
        resize_obs.observe(container_elm);
    },
    _updateAnchorPos(){
        /** @type {HTMLElement} */
        const elm = this.$(".nico-grid-anchor");
        elm.style.top = (this.data_list.length * this.row_height) + "px";
    },
    _getRowContainerWidth(){
        return Array.from(this.column_props_map.values()).reduce((a, b) => {
            return a + b.width;
        }, 0);
    },
    /**
     * 
     * @param {string[]} target_ids 
     * @param {string[]} words 
     * @returns {any[]}
     */
    _filter(target_ids, words){
        if(this.src_data_list.length==0){
            return;
        }
        if(words.length==0){
            return this.src_data_list;
        }
        return this.src_data_list.filter(item=>{
            const keys = target_ids.length==0?Object.keys(item):target_ids;
            return words.every(word => {
                for(const k of keys){
                    const value = String(item[k]).toLowerCase();
                    if (value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                        return true;
                    }
                }
            });
        });
    },
    _scrollTo(value){
        const body_elm = this.$(".body");
        body_elm.scrollTop = value;
    },
    _update_rows(){
        const body_elm = this.$(".body");
        const scroll_top = body_elm.scrollTop;
        const range = body_elm.offsetHeight; 
        const start_index = Math.floor(scroll_top/this.row_height);
        let end_index = Math.floor(start_index + range/this.row_height + 0.5);

        const row_cont_elm = this.$(".row-container");
        this.top_offset = scroll_top % this.row_height;
        row_cont_elm.style.top = (scroll_top - this.top_offset) + "px";

        this.update({data_indexes:[]});

        if(this.data_list.length == 0){
            return;
        }

        end_index += 1;
        if(this.data_list.length <= end_index){
            end_index = this.data_list.length;
        }
        this.state.data_indexes = this.cnvData(start_index, end_index);
        this.update();
    },

    _getRowIndex(id){
        const row_i = this.state.rows.findIndex((row)=>{
            const data = this.data_list[row.index];
            return id == data[this.key_id];
        });
        return row_i;
    },
    updateItem(id, props){
        const item = this.key_id_data_map.get(id);
        if(item === undefined){
            return;
        }
        Object.keys(props).forEach(key=>{
            if(item[key]!==undefined){
                item[key] = props[key];
            }
        });
        this._update_rows();
    },
    _sort(key, asc){
        if(!this.src_data_list || !this.data_list){
            return;
        }

        let order = 1;
        if(!asc){
            order = -1;
        }
        [this.src_data_list, this.data_list].forEach(data_list=>{
            data_list.sort((a, b)=>{
                if(a[key] < b[key]){
                    return -1*order;
                }
                if(a[key] > b[key]){
                    return 1*order;
                }
                return 0;
            }); 
        });

        this._update_rows();
    },
    _updateVisibleRows(){
        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        const scroll_top = body_elm.scrollTop;
        const row_cont_elm = this.$(".row-container");
        const range = row_cont_elm.clientHeight; 

        const start_i = Math.floor(scroll_top/this.row_height);
        let end_i = Math.floor(start_i + range/this.row_height + 0.5);
        if(this.data_list.length <= end_i){
            end_i = this.data_list.length;
        }
        
        this.update({data_indexes:[]});
        this.state.data_indexes = this.cnvData(start_i, end_i);
        this.update();
    },
    getSelectedDataList(){
        const sel_data_list = [];
        this.sel_data_key_ids.forEach(id => {
            const f_index = this.data_list.findIndex(d => {
                return id == d[this.key_id];
            });
            if(f_index >= 0){
                sel_data_list.push(this.data_list[f_index]);
            }
        });
        return sel_data_list.map( item => ({...item}));
    },
    /**
     * 
     * @param {string[]} key_ids 
     */
    deleteItems(key_ids){
        const has_keys = [];
        key_ids.forEach(key_id => {
            if(this.key_id_data_map.has(key_id)){
                has_keys.push(key_id);
            }
        });
        if(has_keys.length == 0){
            return;
        }

        this.src_data_list = this.src_data_list.filter(data => {
            return !key_ids.includes(data[this.key_id]);
        });
        this.data_list = this.data_list.filter(data => {
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

        this._updateAnchorPos();

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        const org_sc_top = body_elm.scrollTop;
        const sc_move = has_keys.length * this.row_height;
        if(sc_move < body_elm.scrollTop){
            body_elm.scrollTop -= sc_move;
        }else{
            this._scrollTo(0);
        }

        if(org_sc_top == body_elm.scrollTop){
            this._updateVisibleRows();
        } 
    },
    /**
     * 
     * @param {any[]} items 
     */
    addItems(items){
        items.forEach(item=>{
            const id = item[this.key_id];
            this.key_id_data_map.set(id, item);
        });

        this.src_data_list = this.src_data_list.concat(items);
        this.data_list = this.data_list.concat(items);
        this._sort(this.sort.key, this.sort.asc);
        this._updateAnchorPos();
        this._update_rows();
    },
    /**
     * 
     * @param {number} start_index 
     * @param {number} end_index 
     * @returns {number[]}
     */
    cnvData(start_index, end_index){
        const row_data_list = [];
        for(let i=start_index; i<end_index; i++){
            row_data_list.push(i);
        }
        return row_data_list;
    },
    /**
     * 
     * @param {number} index 
     * @param {boolean} ctrlKey 
     * @param {boolean} shiftKey 
     */
    _updateSelect(index, ctrlKey, shiftKey){
        const id = this.data_list[index][this.key_id];
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
                    const f_index = this.data_list.findIndex(data => {
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
                    const sel_data = this.data_list[idx];
                    this.sel_data_key_ids.push(sel_data[this.key_id]);
                });
            }
        }
        this.update();
    },
    onMouseDown(e){
        if(e.buttons != 2){
            return;
        }
        this.start_pos = {
            x: e.pageX,
            y: e.pageY,
        };
    },
    onMouseUp(data_index, e){
        if(this.start_pos){
            const data = this.data_list[data_index];
            const key_id = data[this.key_id];
            if(!this.sel_data_key_ids.includes(key_id)){
                this._updateSelect(data_index, e.ctrlKey, e.shiftKey);
            }
            this.popupContextMenu(e);
            return;
        }

        this._updateSelect(data_index, e.ctrlKey, e.shiftKey);

        if (e.target.classList.contains("cmd-btn")) {
            const cmd_id = e.target.dataset.cmdid;
            const data = this.data_list[data_index];
            this.obs.trigger("cmd", {cmd_id, data});
            e.stopPropagation();
            return;
        }
    },
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
    }
};