
module.exports = {
    state:{
        /** @type {string[]} */
        column_ids:[]
    },
    header_height:30,
    /** @type {HTMLElement} */
    header_handle_elm:null,
    /** @type {HTMLElement} */
    target_header_elm:null,

    /** @type {MyObservable} */
    obs:null,

    /** @type {string[]} */
    column_ids:[],

    sort: {
        key: "",
        asc: true
    },

    onBeforeMount(props) {        
        this.header_height = props.header_height;
        this.column_ids = props.column_ids;
        this.column_props_map = props.column_props_map;
        this.obs = props.obs;
    },
    onMounted() {
        this.state.column_ids = [...this.column_ids];

        this.getHeaderCellStyle = (column_id) => {
            let w = 150;
            if(this.column_props_map.has(column_id)){
                w = this.column_props_map.get(column_id).width;
            }
            return `height:${this.header_height}px; width:${w}px;`;
        };
        this.getHeaderTitle = (column_id) => {
            let order = "";
            if(column_id == this.sort.key){
                order = this.sort.asc?"▲":"▼";
            }
            const name = this.column_props_map.get(column_id).name;
            return `${order}${name}`;
        };

        this.obs.on("changed-sort", (args) => {
            const {sort} = args;
            Object.assign(this.sort, sort);
            this.update();
        });

        this.update();
    },
    isResizeArea(elm, cx){
        const s_pos = elm.offsetLeft + 10;
        const e_pos = elm.offsetLeft + elm.clientWidth - 10; 
        if(s_pos < cx && cx < e_pos){
            return false;
        }
        return true;
    }, 
    update_header_order(){
        /** @type {HTMLElement[]} */
        const h_ces = this.$$(".header-cell");

        let is_changed = false;
        h_ces.forEach((cell, i)=>{
            const col_id = cell.dataset.columnid;
            if(this.column_ids[i] != col_id){
                is_changed = true;
            }
        });
        if(!is_changed){
            return false;
        }

        this.column_ids = [];
        h_ces.forEach(cell => {
            const col_id = cell.dataset.columnid;
            this.column_ids.push(col_id);
        });

        this.update({
            column_ids:[]
        });
        this.state.column_ids = [...this.column_ids];
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
            if(this.column_props_map.has(col_id)){
                this.column_props_map.get(col_id).width = col_w;
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
    getColumnPropsMap(){
        return new Map(JSON.parse(
            JSON.stringify(Array.from(this.column_props_map))
        ));
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousemove(e) {
        if(e.buttons == 0){
            return;
        }
        if(this.do_resize){
            return;
        }
        if(e.buttons == 1 && !this.header_handle_elm){
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
            const hc = this.$(".header-cell-container");
            hc.appendChild(hh_elm);

            this.header_handle_elm = hh_elm;
        }

        const move_right = e.pageX - this.px > 0;
        this.px = e.pageX;

        /** @type {HTMLElement[]} */
        const h_ces =this.$$(".header-cell");
        for(const h_cell of h_ces){
            let pos = 0;
            let ne_pos = 0;
            /** @type {HTMLElement} */
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
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousedown(e) {
        if(e.buttons != 1){
            return;
        }

        /** @type {HTMLElement} */
        const hc = this.$(".header-cell-container");
        this.hc_width = hc.offsetWidth;

        const target_rect = hc.getBoundingClientRect();
        this.clientX_offset = target_rect.left;

        const listener = (e) => {
            this.mouseup(e);
            document.removeEventListener("mouseup", listener);
            document.removeEventListener("mousemove", this.mousemove);
        };
        document.addEventListener("mouseup", listener);
        document.addEventListener("mousemove", this.mousemove);

        this.header_handle_offst_left = target_rect.left + e.offsetX;
        this.px = e.pageX;
        this.target_header_elm = e.target;

        this.do_resize = false;
        if(this.isResizeArea(e.target, e.clientX - this.clientX_offset)){
            this.do_resize = true;
            return;
        }
    },
    mouseup(e) {
        e.preventDefault();

        if(this.header_handle_elm){      
            /** @type {HTMLElement} */
            const hc = this.$(".header-cell-container");
            hc.removeChild(this.header_handle_elm);
            this.header_handle_elm = null;

            this.update_header_order();
            this.obs.trigger("header-order-changed", {
                column_ids: [...this.column_ids]
            });
            return;
        }

        if(this.do_resize){
            this.update_header_width();
            this.obs.trigger("header-width-changed", {
                column_props_map: this.getColumnPropsMap()
            });
            return;
        }

        const hc_elm = this.getHeaderCellByPoint(e.clientX, e.clientY);
        if(hc_elm){
            const column_id = hc_elm.dataset.columnid;
            const column_props = this.column_props_map.get(column_id);
            if(!column_props.sortable){
                return;
            }
            this.obs.trigger("header-clicked", {
                column_id: hc_elm.dataset.columnid
            });
        }
    }
};