
<base-datatable>
    <style scoped>
        :scope table.dataTable thead tr th:first-child, 
               table.dataTable tbody tr td:first-child {  
            border-left: 1px solid #e3e7e8;
        }

        :scope table.dataTable thead tr th {  
            border-top: 1px solid #e3e7e8;
            border-right: 1px solid #e3e7e8;
            border-bottom: 1px solid #e3e7e8;
        }
        :scope table.dataTable tbody td {
            border-right: 1px solid #e3e7e8;
        }
        .dataTables_scrollBody{
            overflow-y: scroll !important;
        }
        table.dataTable thead th, table.dataTable thead td {
            padding: 4px 4px;
            border-bottom: 1px solid #111;
        }
    </style>

<table ref="datatable" id={this.opts.my_datatable_id}
class="display stripe hover" style="width:100%"></table>

<script>
    require('jquery-contextmenu');

    const datatable_id = this.opts.my_datatable_id;
    const params = this.parent.datatable_params[datatable_id];

    let getDataTableElm = function(){
        return $(`#${datatable_id}`);
    };
    let getDataTable = function(){
        return getDataTableElm().DataTable();
    };

    obs.on("receivedData", (datas) => {
        let table = getDataTable();
        table.clear().rows.add(datas).draw();
    });

    obs.on("setSize-p1", () => {
        let table = getDataTable(); 
        const id = $(table.table().container()).attr('id');
        //$('.dataTables_scrollBody').css('height', ($(window).height() - 200));
        const h = $(window).height() - 200;
        $(`#${id} div.dataTables_scrollBody`).css('height', h);
        table.columns.adjust();
    });

    resize(size){
        let table = getDataTable(); 
        const id = $(table.table().container()).attr('id');
        //$('.dataTables_scrollBody').css('height', ($(window).height() - 200));
        const h = size.h;
        $(`#${id} div.dataTables_scrollBody`).css('height', h);
        table.columns.adjust();
    };

    var selselect = function(){
            let selindex=0;

            return function(elm){
                let table = getDataTable(); 
                var data = table.row(elm).data();
                let new_index = table.row(elm).index();
                console.log("mousedown ", table.row(elm).index()); 
                if ( $(elm).hasClass('selected') ) {
                    if(selindex!==new_index)
                    {
                        $(elm).removeClass('selected');
                    }     
                }else {
                    table.$('tr.selected').removeClass('selected');
                    $(elm).addClass('selected');
                } 
                selindex=new_index;        
            };
        }();

    this.on('mount', function () {  
        let table = getDataTableElm();
        table.DataTable({
            dom: params.dom,
            columns: params.columns,
            columnDefs: params.columnDefs,
            drawCallback : function() 
            {
                $.contextMenu({
                    selector: 'tbody tr td', 
                    callback: function(key, options) {
                        const target_elm = options.$trigger[0].parentNode
                        const data = getDataTable().row(target_elm).data();
                        params.contextMenu.callback(key, data);
                    },
                    events: {
                    show : function(options){
                        const cellIndex = parseInt(options.$trigger[0].cellIndex);
                        const row = getDataTable().row(options.$trigger[0].parentNode);
                        const rowIndex = row.index();
                        selselect(options.$trigger[0].parentNode);

                        return true;
                    },
                    },
                    items: params.contextMenu.items
                });
            },
            colResize: params.colResize,
            //scrollY:'50vh',
            scrollY: ($(window).height() - 200),
            scrollCollapse: params.scrollCollapse,
            autoWidth: params.autoWidth,
            paging: params.paging,
            deferRender: params.deferRender,
            stateSave: params.stateSave,
            lengthMenu: params.lengthMenu,
            displayLength: params.displayLength,
        })

        table.on('page.dt', function(){
            $("div.dataTables_scrollBody").scrollTop(0);
         });

        $(`#${datatable_id} tbody`).on('mousedown', 'tr', function(){
            selselect(this);
        });

        $(`#${datatable_id} tbody`).on('dblclick', 'tr', function (){
            let table = getDataTable(); 
            const data = table.row(this).data();
            params.dblclickRow(data);
        });
    });    
</script>  
</base-datatable>