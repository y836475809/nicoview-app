
module.exports = {
    state:{
        table_heads:[]
    },
    header_height:30,
    /** @type {HTMLElement} */
    header_handle_elm:null,
    /** @type {HTMLElement} */
    target_header_elm:null,

    onBeforeMount(props) {        
        this.header_height = props.header_height;
        this.columns = props.columns;
        this.column_width = props.column_width;
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

        document.addEventListener('mouseup', (e) => {
            this.mouseup(e);
        });

        document.addEventListener('mousemove', (e) => {
            this.mousemove(e);
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
            const pos = h_cell.offsetLeft + h_cell.clientWidth -10;
            const ne = h_cell.nextElementSibling;
            if(!ne){
                break;
            }
            const ne_pos = ne.offsetLeft + 10;
            const cx = e.clientX;
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
     * @param {number} i 
     * @param {MouseEvent} e 
     */
    mousedown(i, e) {
        /** @type {HTMLElement} */
        const hc = this.$(".header-cell-container");
        this.hc_width = hc.offsetWidth;

        const target_rect = hc.getBoundingClientRect();
        this.header_handle_offst_left = target_rect.left + e.offsetX;
        this.px = e.pageX;

        console.log("mousedown i=", i);
        this.gutter = true;
        const hh_elm = document.createElement('span');
        hh_elm.innerText = "pppp";
        hh_elm.style.background = "red";
        hh_elm.style.width = "150px";
        hh_elm.style.position = "absolute";
        hh_elm.style.opacity = "50%";
        hh_elm.style.top = "10px";
        hh_elm.style.left = `${e.target.offsetLeft}px`;
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
            return;
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
    },
    update_header_width(){
        const hc = this.$(".header-cell-container");
        if(this.hc_width == hc.offsetWidth){
            return;
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
    },
    mouseup(e) {
        console.log("mousedown i=");
        if(this.header_handle_elm){
            e.preventDefault();
            /** @type {HTMLElement} */
            const hc = this.$(".header-cell-container");
            hc.removeChild(this.header_handle_elm);
            this.header_handle_elm = null;

            this.update_header_order();
        }
        this.update_header_width();
    }
};