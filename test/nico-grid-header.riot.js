
module.exports = {
    state:{
        table_heads:[]
    },
    header_height:30,
    /** @type {HTMLElement} */
    header_handle_elm:null,
    /** @type {HTMLElement} */
    target_header_elm:null,

    /** @type {MyObservable} */
    obs:null,

    sort: {
        key: "",
        asc: true
    },

    onBeforeMount(props) {        
        this.header_height = props.header_height;
        this.columns = props.columns;
        this.column_width = props.column_width;
        this.obs = props.obs;
    },
    onMounted() {
        this.state.table_heads = this.columns.map( item => ({...item}));
        this.getHeaderCellStyle = (heaer) => {
            let w = 150;
            if(heaer.id in this.column_width){
                w = this.column_width[heaer.id];
            }
            return `height:${this.header_height}px; width:${w}px;`;
        };
        this.getHeaderTitle = (heaer) => {
            let order = "";
            if(heaer.id == this.sort.key){
                order = this.sort.asc?"▲":"▼";
            }
            return `${order}${heaer.name}`;
        };

        document.addEventListener('mouseup', (e) => {
            this.mouseup(e);
        });

        document.addEventListener('mousemove', (e) => {
            this.mousemove(e);
        });

        this.obs.on("changed-sort", (args) => {
            const {sort} = args;
            Object.assign(this.sort, sort);
            this.update();
        });

        this.update();
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousemove(e) {
        if(e.buttons==0){
            return;
        }
        if(!this.header_handle_elm){
            return;
        }
        const move_right = e.pageX - this.px > 0;
        this.px = e.pageX;

        /** @type {HTMLElement[]} */
        const h_ces =this.$$(".header-cell");
        for(const h_cell of h_ces){
            let pos = 0;
            let ne_pos = 0;
            const ne = h_cell.nextElementSibling;
            if(!ne){
                break;
            }
            if(move_right){
                pos = ne.offsetLeft + ne.clientWidth / 2;
                ne_pos = ne.offsetLeft + ne.clientWidth;    
            }else{
                pos = h_cell.offsetLeft;
                ne_pos = h_cell.offsetLeft + h_cell.clientWidth / 2;
            }
            const cx = e.clientX - this.clientX_offset;
            if(pos < cx &&  cx < ne_pos){
                if(move_right){
                    /** @type {HTMLElement} */
                    if(ne.nextElementSibling){
                        const h_cont =this.$(".header-cell-container");
                        h_cont.insertBefore(this.target_header_elm, ne.nextElementSibling);
                    }
                }else{
                    const h_cont =this.$(".header-cell-container");
                    h_cont.insertBefore(this.target_header_elm, h_cell);
                }
                break;
            }
        }
        this.header_handle_elm.style.left = `${e.pageX - this.header_handle_offst_left}px`;
    },
    isResizeArea(elm, cx){
        const s_pos = elm.offsetLeft + 10;
        const e_pos = elm.offsetLeft + elm.clientWidth - 10; 
        if(s_pos < cx && cx < e_pos){
            return false;
        }
        return true;
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousedown(e) {
        /** @type {HTMLElement} */
        const hc = this.$(".header-cell-container");
        this.hc_width = hc.offsetWidth;

        const target_rect = hc.getBoundingClientRect();
        this.clientX_offset = target_rect.left;

        if(this.isResizeArea(e.target, e.clientX - this.clientX_offset)){
            return;
        }

        this.header_handle_offst_left = target_rect.left + e.offsetX;
        this.px = e.pageX;
        this.gutter = true;

        /** @type {HTMLElement} */
        const h_cell = e.target;
        const hh_elm = document.createElement('span');
        hh_elm.innerText = h_cell.textContent;
        hh_elm.style.background = "gray";
        hh_elm.style.width = h_cell.offsetWidth + "px";
        hh_elm.style.height = h_cell.offsetHeight + "px";
        hh_elm.style.position = "absolute";
        hh_elm.style.opacity = "50%";
        hh_elm.style.left = `${h_cell.offsetLeft}px`;
        /** @type {HTMLElement} */
        hc.appendChild(hh_elm);

        this.header_handle_elm = hh_elm;
        this.target_header_elm = e.target;
    },
    update_header_order(){
        /** @type {HTMLElement[]} */
        const h_ces = this.$$(".header-cell");

        let is_changed = false;
        h_ces.forEach((cell, i)=>{
            const col_id = cell.dataset.columnid;
            if(this.columns[i].id !=col_id){
                is_changed = true;
            }
        });
        if(!is_changed){
            return false;
        }

        const src_columns = this.columns.map( item => ({...item}));
        this.columns = [];
        h_ces.forEach(cell => {
            const col_id = cell.dataset.columnid;
            const target_cols = src_columns.filter(colum => colum.id == col_id);
            if(target_cols.length == 1){
                this.columns.push(target_cols[0]);
            }
        });

        this.update({
            table_heads:[]
        });
        this.state.table_heads = this.columns.map( item => ({...item}));
        this.update();
        return true;
    },
    update_header_width(){
        const hc = this.$(".header-cell-container");
        if(this.hc_width == hc.offsetWidth){
            return false;
        }

        /** @type {HTMLElement[]} */
        const h_ces = this.$$(".header-cell");
        h_ces.forEach(cell => {
            const col_w = cell.offsetWidth;
            const col_id = cell.dataset.columnid;
            if(col_id in this.column_width){
                this.column_width[col_id] = col_w;
            }
        });
        this.update();
        return true;
    },
    getHeaderCellByPoint(x, y){
        /** @type {HTMLElement} */
        const elm = document.elementFromPoint(x, y);
        if(!elm){
            return null;
        }
        if(!elm.classList.contains("header-cell")){
            return null;
        }
        if(!elm.dataset.columnid){
            return null;
        }
        return elm;
    },
    mouseup(e) {
        let is_order_updated = false;
        let is_width_updated = false;
        if(this.header_handle_elm){
            e.preventDefault();
            /** @type {HTMLElement} */
            const hc = this.$(".header-cell-container");
            hc.removeChild(this.header_handle_elm);
            this.header_handle_elm = null;

            is_order_updated = this.update_header_order();
        }
        is_width_updated = this.update_header_width();

        if(is_order_updated || is_width_updated){
            this.obs.trigger("header-changed", {
                columns:this.columns,
                column_width:this.column_width
            });
        }
        
        if(!is_order_updated && !is_width_updated){
            const hc_elm = this.getHeaderCellByPoint(e.clientX, e.clientY)
            if(hc_elm){
                this.obs.trigger("header-clicked", {
                    id: hc_elm.dataset.columnid
                });
            }
        }
    }
};