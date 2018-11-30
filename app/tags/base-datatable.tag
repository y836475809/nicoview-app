
<base-datatable>
    <style scoped>

</style>

<table ref="dt" class="stripe" style="width:100%"></table>

<script>
    /* globals opts obs $ */
    const params = opts.params.dt;

    let getDataTableElm = ()=>{
        return $(this.refs.dt);
    };
    let getDataTable = function(){
        return getDataTableElm().DataTable();
    };

    this.setData = (datas)=> {
        let table = getDataTable();
        table.clear().rows.add(datas).draw();      
    };

    this.setScrollSize = (size)=> {
        const h = size.h;
        let scroll_body = this.root.querySelector("div.dataTables_scrollBody");
        $(scroll_body).css("height", h);

        let table = getDataTable();
        table.columns.adjust();
    };

    this.setScrollToIndex = (index) => {
        let table = getDataTable();
        if(!table.data().count()){
            return;
        }

        table.row(index).scrollTo(false);
    };

    this.setScrollTop = (pos) => {
        let table = getDataTable();
        if(!table.data().count()){
            return;
        }
        $("div.dataTables_scrollBody").scrollTop(pos);
    };

    this.getScrollTop = () => {
        return this.root.querySelector("div.dataTables_scrollBody").scrollTop;
    };

    this.getScrollHeight = () => {
        return this.root.querySelector("div.dataTables_scrollBody").offsetHeight;
    };

    this.search = (param) => {
        let table = getDataTable();
        table.search( param ).draw();
    };

    this.showContextMenu = (e)=>{};

    let selselect = function(){
        let selindex=0;

        return function(elm){
            let table = getDataTable(); 
            const new_index = table.row(elm).index();
            if ( $(elm).hasClass("selected") ) {
                if(selindex!==new_index)
                {
                    $(elm).removeClass("selected");
                }     
            }else {
                table.$("tr.selected").removeClass("selected");
                $(elm).addClass("selected");
            } 
            selindex=new_index;        
        };
    }();

    this.getSelectedDatas = ()=>{
        const table = getDataTable(); 
        const elms = table.$("tr.selected").toArray();
        let datas = elms.map((elm)=>{
            return table.row(elm).data();
        });
        return datas;
    };

    this.on("mount", function () {  
        let table = getDataTableElm();
        $.extend($.fn.dataTable.defaults, params);
        table.DataTable({
            scroller: params.scroller == undefined ? false : params.scroller
        });

        table.on("page.dt", function(){
            $("div.dataTables_scrollBody").scrollTop(0);
        });

        let table_body = this.root.querySelector("table tbody");
        $(table_body).on("mousedown", "tr", function(e){
            selselect(this);
        });

        $(table_body).contextmenu((e)=>{
            this.showContextMenu(e);
            return false;
        });

        $(table_body).on("dblclick", "tr", function (){
            let table = getDataTable(); 
            const data = table.row(this).data();
            params.dblclickRow(data);
            return false;
        });
    });    
</script>  
</base-datatable>