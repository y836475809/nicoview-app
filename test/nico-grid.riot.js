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
        this.getBodyCellStyle = (id) => {
            let w = 150;
            if(this.column_props_map.has(id)){
                w = this.column_props_map.get(id).width;
            }
            return `height:${this.row_height}px; width:${w}px;`;
        };
        this.getBodyCellHtml = (data_index, id) => {
            const data = this.data_list[data_index];
            const value = data[id];
            const ft = this.cell_ft.get(id);
            if(!ft){
                return value;
            }
            return ft(id, value, data);
        };

        const hello = debounce((e)=>{
            this._update_rows();
        }, 100);

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        body_elm.style.height = `calc(100% - ${this.header_height}px)`;
        body_elm.addEventListener("scroll",hello);
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
        elm.style.width = (el_width + this.column_props_map.size*2) + "px"; 

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
            const anchor_elm = this.$(".nico-grid-anchor");
            anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";

            this.sel_data_key_ids = [];
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
            const anchor_elm = this.$(".nico-grid-anchor");
            anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";
            
            this._scrollTo(0);
            this._update_rows();
        });

        this.obs_header.on("header-changed", (args) => {
            const {column_ids, column_props_map} = args;
            
            this.state.column_ids = column_ids;
            this.column_props_map = column_props_map;
            
            const el_width = this._getRowContainerWidth();
            const elm = this.$(".row-container");
            elm.style.width = (el_width + 20) + "px"; 
            
            this._update_rows();
        });
        this.obs_header.on("header-clicked", (args) => {
            const {id} = args;
            if(this.sort.key == id){
                this.sort.asc = !this.sort.asc;
            }else{
                this.sort.key = id;
                this.sort.asc = true;
            }
            this._sort(this.sort.key, this.sort.asc);
            this.obs_header.trigger("changed-sort", {
                sort: this.sort
            });
        });
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
        const te = this.$(".row-container");
        const range = body_elm.offsetHeight; 
        // console.log(`scroll=${scroll}, range=${range}`);
        this.top_offset = scroll_top % this.row_height;
        // console.log(`top_offset=${this.top_offset}`);
        const start_index = Math.floor(scroll_top/this.row_height);
        let end_index = Math.floor(start_index + range/this.row_height + 0.5);
        te.style.top = (scroll_top - this.top_offset) + "px";
        // console.log(`start=${start_index}, end=${end_index}`);

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
     * @param {string[]} ids 
     */
    deleteItems(ids){
        const has_keys = [];
        ids.forEach(id => {
            if(this.key_id_data_map.has(id)){
                has_keys.push(id);
            }
        });
        if(has_keys.length == 0){
            return;
        }

        this.src_data_list = this.src_data_list.filter(data => {
            return !ids.includes(data[this.key_id]);
        });
        this.data_list = this.data_list.filter(data => {
            return !ids.includes(data[this.key_id]);
        });
        ids.forEach(id => {
            this.key_id_data_map.delete(id);
        });

        this.sel_data_key_ids = [];
        ids.forEach(id => {
            if(this.sel_data_key_ids.includes(id)){
                const sel_i = this.sel_data_key_ids.indexOf(id);
                if(sel_i >= 0){
                    this.sel_data_key_ids.splice(sel_i, 1);
                }
            }
        });

        /** @type {HTMLElement} */
        const anchor_elm = this.$(".nico-grid-anchor");
        anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";

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

        const anchor_elm = this.$(".nico-grid-anchor");
        anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";
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
    /**
     * 
     * @param {number} data_index 
     * @param {PointerEvent} e 
     * @returns 
     */
    onclickItem(data_index, e) {
        this._updateSelect(data_index, e.ctrlKey, e.shiftKey);

        console.log(this.data_list[data_index]);
        if (e.target.classList.contains("cmd-btn")) {
            const cmd_id = e.target.dataset.cmdid;
            const data = this.data_list[data_index];
            this.obs.trigger("cmd", {cmd_id, data});
            e.stopPropagation();
            return;
        }
    }
};