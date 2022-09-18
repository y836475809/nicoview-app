
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
    mmm: [],
    cell_widths:{},
    el_width: 0,
    /** @type {MyObservable} */
    obs: null,
    header_height:30,
    row_height:100,
    top_offset:0,

    onBeforeMount(props) {        
        this.obs = props.obs;
        this.row_height = props.row_height;
    },
    onMounted() {
        this.getHeaderStyle = (item) => {
            let w = 150;
            if(item.id in this.cell_widths){
                w = this.cell_widths[item.id];
            }
            return `height:${this.header_height}px; width:${w}px;`;
        };
        this.getStyle = (item) => {
            const index = item.index;
            const top = index*this.row_height - this.top_offset;
            return `height:${this.row_height}px; top:${top}px;`;
        };
        this.getRowClass = (item) => {
            const index = item.index;
            if(index % 2 == 1){
                return "row-odd";
            }
            return "";
        };
        this.getCellStyle = (item) => {
            let w = 150;
            if(item.id in this.cell_widths){
                w = this.cell_widths[item.id];
            }
            return `height:${this.row_height}px; width:${w}px;`;
        };

        const hello = debounce((e)=>{
            const scroll = e.target.scrollTop;
            const te = this.$(".data-table");
            const range = te.clientHeight; 
            
            console.log(`scroll=${scroll}, range=${range}`);

            this.top_offset = scroll % this.row_height;
            console.log(`top_offset=${this.top_offset}`);

            const s = Math.floor(scroll/this.row_height);
            let end = Math.floor(s + range/this.row_height + 0.5);
            te.style.top = (scroll - this.top_offset) + "px";
            console.log(`start=${s}, end=${end}`);

            this.state.table_rows = [];
            this.update();
            if(this.mmm.length == 0){
                return;
            }
            if(this.mmm.length <= end){
                end = this.mmm.length;
            }
            this.state.table_rows = this.mmm.slice(s, end);
            this.update();
        }, 100);
        const tt = this.$(".table-target");
        tt.addEventListener('scroll',hello);
        tt.addEventListener('scroll', (e) => {
            const scrollLeft = e.target.scrollLeft;
            /** @type {HTMLElement} */
            const h = this.$("#table-cont .test-header-cont2");
            h.style.left = (-scrollLeft * 1) + "px";
        });

        this.obs.onReturn("set-option", (args) => {
            const { option } = args;
            this.el_width = 0;
            /** @type {[]} */
            this.cell_widths = option.cell_widths;
            Object.keys(this.cell_widths).forEach(key => {
                this.el_width += this.cell_widths[key];
            });
        });

        this.obs.onReturn("set-header", (args) => {
            /** @type {{items: []}} */
            const { items } = args;
            this.state.table_heads = items;

            const el_width = this.el_width>0?this.el_width:items.length*150;
            const elm = this.$(".data-table");
            elm.style.width = (el_width + items.length*2) + "px"; 
            this.update();
        });
        this.obs.onReturn("set-data", (args) => {
            /** @type {{items: []}} */
            const { items } = args;
            this.mmm = [];
            items.forEach((item, i) => {
                this.mmm.push({
                    index:i,
                    data:items[i]
                });
            });
            this.state.table_rows = this.mmm.slice(0, 20);
            const ppp_e = this.$(".ppp");
            ppp_e.style.top = (this.mmm.length * this.row_height) + "px";

            this.update();
        });
    },
    onclickItem(item, e) {
        console.log(item);
    }
};