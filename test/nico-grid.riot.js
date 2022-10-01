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
        table_rows:[],
    },
    data_list: [],
    key_id: "",
    key_id_data_map:new Map(),
    col_map:new Map(),
    column_width:{},
    el_width: 0,
    /** @type {MyObservable} */
    obs: null,
    header_height:30,
    row_height:100,
    top_offset:0,
    selected_indexs:[],
    sort: {
        key: "",
        asc: true
    },

    onBeforeMount(props) {        
        this.obs = props.obs;
        this.header_height = props.header_height;
        this.row_height = props.row_height;
        this.sort = props.sort;

        this.columns = props.columns;
        this.el_width = 0;
        this.columns.forEach(column => {
            this.el_width += column.width;
            this.column_width[column.id] = column.width;
            this.col_map.set(column.id, column);
        });

        this.obs_header = new MyObservable();
    },
    onMounted() {
        this.getRowStyle = (item) => {
            const index = item.index;
            const top = index*this.row_height - this.top_offset;
            return `height:${this.row_height}px; top:${top}px;`;
        };
        this.getRowClass = (item) => {
            const classes = [];
            const index = item.index;
            if(index % 2 == 1){
                classes.push("nico-grid-row-odd");
            }
            if(this.selected_indexs.includes(index)){
                classes.push("nico-grid-row-select");
            }
            return classes.join(" ");
        };
        this.getBodyCellStyle = (item) => {
            let w = 150;
            if(item.id in this.column_width){
                w = this.column_width[item.id];
            }
            return `height:${this.row_height}px; width:${w}px;`;
        };
        this.getBodyCellHtml = (item) => {
            const col_data = this.col_map.get(item.id);
            return col_data.ft(item);
        };

        const hello = debounce((e)=>{
            this._update_rows();
        }, 100);

        /** @type {HTMLElement} */
        const body_elm = this.$(".body");
        body_elm.addEventListener("scroll",hello);
        body_elm.addEventListener("scroll", (e) => {
            /** @type {HTMLElement} */
            const target_elm = e.target;
            const scrollLeft = target_elm.scrollLeft;
            /** @type {HTMLElement} */
            const header_cont_elm = this.$(".header-cell-container");
            header_cont_elm.style.left = (-scrollLeft * 1) + "px";
        });

        const el_width = this.el_width>0?this.el_width:this.columns.length*150;
        const elm = this.$(".row-container");
        elm.style.width = (el_width + this.columns.length*2) + "px"; 

        this.obs.onReturn("set-data", (args) => {
            /** @type {{key_id: string, items: []}} */
            const { key_id, items } = args;
            this.key_id = key_id;
            this.data_list = items.map( item => ({...item}));

            this._sort(this.sort.key, this.sort.asc);

            this.key_id_data_map.clear();
            this.data_list.forEach(item=>{
                const id = item[key_id];
                this.key_id_data_map.set(id, item);
            });
 
            this.row_data_list = [];
            const f_size = 20;
            const min_size = Math.min(f_size, this.data_list.length);
            const row_items = this.data_list.slice(0, min_size);        
            this.state.table_rows = this.cnvData(row_items, 0); //this.data_list.slice(0, 20);
            const anchor_elm = this.$(".nico-grid-anchor");
            anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";

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
        this.obs.onReturn("get-selected-data-list", () => {
            return this.getSelectedDatas();
        });

        this.obs_header.on("header-changed", (args) => {
            const {columns, column_width} = args;
            this.el_width = 0;
            this.col_map.clear();
            this.columns = columns.map( item => ({...item}));
            this.columns.forEach(column => {
                const col_id = column.id;
                const col_w = column_width[col_id];
                this.el_width += col_w;
                this.column_width[column.id] = col_w;
                this.col_map.set(column.id, column);
            });
            const elm = this.$(".row-container");
            elm.style.width = (this.el_width + 20) + "px"; 
            this._update_rows();
        });
    },
    _update_rows(){
        const body_elm = this.$(".body");
        const scroll_top = body_elm.scrollTop;
        const te = this.$(".row-container");
        const range = te.clientHeight; 
        // console.log(`scroll=${scroll}, range=${range}`);
        this.top_offset = scroll_top % this.row_height;
        // console.log(`top_offset=${this.top_offset}`);
        const start_index = Math.floor(scroll_top/this.row_height);
        let end_index = Math.floor(start_index + range/this.row_height + 0.5);
        te.style.top = (scroll_top - this.top_offset) + "px";
        // console.log(`start=${start_index}, end=${end_index}`);

        this.update({table_rows:[]});

        if(this.data_list.length == 0){
            return;
        }
        if(this.data_list.length <= end_index){
            end_index = this.data_list.length;
        }
        this.state.table_rows = this.cnvData(
            this.data_list.slice(start_index, end_index), start_index);
        this.update();
    },

    _getRowIndex(id){
        const row_i = this.state.table_rows.findIndex((row)=>{
            const data = this.data_list[row.index];
            return id == data[this.key_id];
        });
        return row_i;
    },
    _updateStateRows(id, item){
        const row_i = this._getRowIndex(id);
        if(row_i == -1){
            return;
        }

        const data = [];
        this.col_map.forEach((value, key)=>{
            if(key in item){
                data.push({
                    id: key,
                    data: item[key]
                });
            }
        });
        const table_rows = this.state.table_rows;
        const index = table_rows[row_i].index;
        table_rows[row_i] = {
            index: index,
            data:data
        };
        this.update({
            table_rows:[]
        });
        this.update({
            table_rows:table_rows
        });
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
        this._updateStateRows(id, item);
    },
    _sort(key, asc){
        let order = 1;
        if(!asc){
            order = -1;
        }
        this.data_list.sort((a, b)=>{
            if(a[key] < b[key]){
                return -1*order;
            }
            if(a[key] > b[key]){
                return 1*order;
            }
            return 0;
        });
        
        const table_rows = this.state.table_rows;
        if(table_rows.length==0){
            return;
        }
        const s = table_rows[0].index;
        const e = table_rows.slice(-1)[0].index;
        if(s == e){
            return;
        }
        this.update({
            table_rows:[]
        });
        this.state.table_rows = this.cnvData(
            this.data_list.slice(s, e), s);
        this.update();
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
        
        this.update({table_rows:[]});
        this.state.table_rows = this.cnvData(
            this.data_list.slice(start_i, end_i), start_i);
        this.update();
    },
    getSelectedDatas(){
        const sel_data_list = [];
        this.selected_indexs.forEach(sel_index=>{
            sel_data_list.push(this.data_list[sel_index]);
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

        this.data_list = this.data_list.filter(data => {
            return !ids.includes(data[this.key_id]);
        });
        ids.forEach(id => {
            this.key_id_data_map.delete(id);
        });

        this.selected_indexs = [];

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
            body_elm.scrollTop = 0;
        }

        if(org_sc_top == body_elm.scrollTop){
            this._updateVisibleRows();
        } 
    },
    cnvData(data_list, start_index){
        const row_data_list = [];
        data_list.forEach((item, i) => {
            const data = [];
            this.col_map.forEach((value, key)=>{
                if(key in item){
                    data.push({
                        id: key,
                        data: item[key]
                    });
                }
            });
            row_data_list.push({
                index: start_index + i,
                data:data
            });
        });
        return row_data_list;
    },
    /**
     * 
     * @param {number} index 
     * @param {boolean} ctrlKey 
     * @param {boolean} shiftKey 
     */
    _updateSelect(index, ctrlKey, shiftKey){
        if(!ctrlKey && !shiftKey){
            /** @type {HTMLElement[]} */
            const row_elms = this.$$(".row");
            row_elms.forEach(elm=>{
                elm.classList.remove("nico-grid-row-select");
            });
            this.selected_indexs = [];
            this.update();
            this.selected_indexs.push(index);
        }
        if(ctrlKey && !shiftKey){
            if(this.selected_indexs.includes(index)){
                const sel_i = this.selected_indexs.indexOf(index);
                this.selected_indexs.splice(sel_i, 1);
            }else{
                this.selected_indexs.push(index);
            }  
        }
        if(!ctrlKey && shiftKey){
            if(this.selected_indexs.length>0){
                const last_index = this.selected_indexs.slice(-1)[0];
                const s = Math.min(index, last_index);
                const e = Math.max(index, last_index);
                const size = e -s;
                this.selected_indexs = [];
                this.update();
                this.selected_indexs = [...Array(size + 1)].map((_, i) => i + s);
            }
        }
        this.update();
    },
    /**
     * 
     * @param {*} item 
     * @param {PointerEvent} e 
     * @returns 
     */
    onclickItem(item, e) {
        const index = item.index;
        this._updateSelect(index, e.ctrlKey, e.shiftKey);

        console.log(this.data_list[index]);
        if (e.target.classList.contains("cmd-btn")) {
            const cmd_id = e.target.dataset.cmdid;
            const data = this.data_list[index];
            this.obs.trigger("cmd", {cmd_id, data});
            e.stopPropagation();
            return;
        }
    }
};