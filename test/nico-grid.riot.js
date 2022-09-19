
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
        table_heads:[],
        table_rows:[],
    },
    data_list: [],
    column_width:{},
    el_width: 0,
    /** @type {MyObservable} */
    obs: null,
    header_height:30,
    row_height:100,
    top_offset:0,
    selected_indexs:[],

    onBeforeMount(props) {        
        this.obs = props.obs;
    },
    onMounted() {
        this.getHeaderCellStyle = (item) => {
            let w = 150;
            if(item.id in this.column_width){
                w = this.column_width[item.id];
            }
            return `height:${this.header_height}px; width:${w}px;`;
        };
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
            const h = col_data.ft(item);
            return col_data.ft(item);
        };

        const hello = debounce((e)=>{
            const scroll_top = e.target.scrollTop;
            const te = this.$(".row-container");
            const range = te.clientHeight; 
            
            console.log(`scroll=${scroll}, range=${range}`);

            this.top_offset = scroll_top % this.row_height;
            console.log(`top_offset=${this.top_offset}`);

            const start_index = Math.floor(scroll_top/this.row_height);
            let end_index = Math.floor(start_index + range/this.row_height + 0.5);
            te.style.top = (scroll_top - this.top_offset) + "px";
            console.log(`start=${start_index}, end=${end_index}`);

            this.state.table_rows = [];
            this.update();

            if(this.data_list.length == 0){
                return;
            }
            if(this.data_list.length <= end_index){
                end_index = this.data_list.length;
            }
            this.state.table_rows = this.data_list.slice(start_index, end_index);
            this.update();
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

        this.obs.onReturn("set-option", (args) => {
            const { option } = args;
            this.el_width = 0;
            /** @type {[]} */
            this.column_width = option.column_width;
            Object.keys(this.column_width).forEach(key => {
                this.el_width += this.column_width[key];
            });

            this.row_height = option.row_height?option.row_height:60;
        });

        this.obs.onReturn("set-columns", (args) => {
            /** @type {{items: []}} */
            const { items } = args;
            this.col_map = new Map();
            const columns = items;
            columns.forEach(col => {
                this.col_map.set(col.id, col);
            });

            this.state.table_heads = columns;
            const el_width = this.el_width>0?this.el_width:items.length*150;
            const elm = this.$(".row-container");
            elm.style.width = (el_width + items.length*2) + "px"; 
            this.update();
        });
        this.obs.onReturn("set-data", (args) => {
            /** @type {{items: []}} */
            const { items } = args;
            this.data_list = [];
            items.forEach((item, i) => {
                this.data_list.push({
                    index:i,
                    data:items[i]
                });
            });
            this.state.table_rows = this.data_list.slice(0, 20);
            const anchor_elm = this.$(".nico-grid-anchor");
            anchor_elm.style.top = (this.data_list.length * this.row_height) + "px";

            this.update();
        });
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
        const data = item.data;
        const index = item.index;
        this._updateSelect(index, e.ctrlKey, e.shiftKey);

        console.log(data);
        if (e.target.classList.contains("cmd-btn")) {
            const cmd_id = e.target.dataset.cmdid;
            this.obs.trigger("cmd", {cmd_id, data});
            e.stopPropagation();
            return;
        }
    }
};