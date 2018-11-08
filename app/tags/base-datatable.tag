
<base-datatable>
    <style scoped>

</style>

<table ref="dt" class="stripe hover" style="width:100%"></table>

<script>
    /* globals opts obs $ */
    const params = opts.params.dt;

    let getDataTableElm = ()=>{
        return $(this.refs.dt);
    };
    let getDataTable = function(){
        return getDataTableElm().DataTable();
    };

    obs.on("receivedData", (datas) => {
        let table = getDataTable();
        table.clear().rows.add(datas).draw();
    });

    this.setData = (datas)=> {
        let table = getDataTable();
        table.clear().rows.add(datas).draw();      
    };

    this.ress = (size)=> {
        const h = size.h;
        let scroll_body = this.root.querySelector("div.dataTables_scrollBody");
        $(scroll_body).css("height", h);

        let table = getDataTable();
        table.columns.adjust();
    };

    // this.row_h = null;
    const row_h = params.row_height;
    this.scrollto = (index) => {
        if(!row_h){
            return;
        }
        let table = getDataTable();
        if(!table.data().count()){
            return;
        }
        const scroll_body = this.root.querySelector("div.dataTables_scrollBody");
        const sc_h = scroll_body.offsetHeight;
        table.row( index -sc_h/row_h + 1).scrollTo(false);
    };
    // this.adjust_columns = ()=>{
    //     let table = getDataTable();
    //     table.columns.adjust(); 
    // };

    this.showContextMenu = (e)=>{};

    let selselect = function(){
        let selindex=0;

        return function(elm){
            let table = getDataTable(); 
            // const data = table.row(elm).data();
            let new_index = table.row(elm).index();
            console.log("mousedown ", table.row(elm).index()); 
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
        table.DataTable({
            dom: params.dom,
            columns: params.columns,
            columnDefs: params.columnDefs,
            colResize: params.colResize,
            //scrollY:'50vh',
            scrollX: params.scrollX == undefined ? false : params.scrollX,
            scrollY: params.scrollY,
            scrollCollapse: params.scrollCollapse,
            scroller: params.scroller == undefined ? false : params.scroller,
            autoWidth: params.autoWidth,
            paging: params.paging,
            deferRender: params.deferRender,
            stateSave: params.stateSave,
            lengthMenu: params.lengthMenu,
            displayLength: params.displayLength,
        });

        table.on("page.dt", function(){
            $("div.dataTables_scrollBody").scrollTop(0);
        });

        let table_body = this.root.querySelector("table tbody");
        $(table_body).on("mousedown", "tr", function(e){
            selselect(this);
            //return false;
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