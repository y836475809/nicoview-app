<library-datatable id="library-datatable">
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

        :scope .table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>
<div class="table-base">
<table ref="datatable" id="{opts.id}"
class="display stripe hover" style="width:100%"></table>
</div>
<script>
    require('jquery-contextmenu');

    const datatable_id = `#${opts.id}`;
    const opts_columns = opts.columns;

    let getDataTableElm = function(){
        return $(`#${opts.id}`);
    };
    let getDataTable = function(){
        return getDataTableElm().DataTable();
    };

    obs.on("receivedData", (datas) => {
        let table = getDataTable();
        table.clear().rows.add(datas).draw()

        window.resizeBy(1, 0);
        window.resizeBy(-1, 0); 
    })

    obs.on("setSize", () => {
        //table.columns.adjust()
        //$("#table-base div.dataTables_scrollBody").scrollTop(0);
        //this.is_display = !this.is_display
        //this.update()

        //settings.scrollY= "600px";
        //table.destroy();
        //$('#table_id').DataTable(settings);
        //let table = $('#table_id').DataTable();
        let table = getDataTable();
        let settings = table.settings();
        //settings[0].oFeatures.bPaginate = true;
        //settings[0].oInit.sScrollY = "600px";
        table.DataTable({retrieve: true}).destroy();
        table.DataTable({
                scrollY: "600px",
                dom: 'Zlfrtip',
                scrollCollapse:false,
                autoWidth: true,
                paging: false,
                deferRender: true,
                stateSave: true,
            });
        //$("#table_id").DataTable(settings);
        //this.update();
        console.log("settings = ", settings[0]); 
    })

    var selselect = function(){
            let selindex=0;

            return function(elm){
                //let table = $('#table_id').DataTable()
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
            dom: 'Zlfrtip',
            columns: opts_columns,
            /*
            [
                { title: 'image' },
                { title: 'name' },
                { title: 'salary' },
                { title: 'office' },
                { title: 'position' }
            ],
            */
            columnDefs: [{
                targets: 0,
                orderable: false,
                data: "image",
                render: function (data, type, row, meta) {
                    return `<img src='${data}'>`
                },
            },
            { targets: 1, data: "name" },
            { targets: 2, data: "salary" },
            { targets: 3, data: "office" },
            { targets: 4, data: "position" }],

            drawCallback : function() 
            {
                $.contextMenu({
                    selector: 'tbody tr td', 
                    callback: function(key, options) {
                        var m = "clicked: " + key;
                        console.log(m); 
                    },
                    events: {
                    show : function(options){
                        const cellIndex = parseInt(options.$trigger[0].cellIndex);
                        const row = getDataTable().row(options.$trigger[0].parentNode);
                        const rowIndex = row.index();
                        console.log("rowIndex=", rowIndex, ", cellIndex=", cellIndex); 
                        selselect(options.$trigger[0].parentNode)

                        return true;
                    },
                    },
                    items: {
                        "edit": {name: "Edit", icon: "edit"},
                        "cut": {name: "Cut", icon: "cut"},
                        "copy": {name: "Copy", icon: "copy"},
                        "paste": {name: "Paste", icon: "paste"},
                        "delete": {name: "Delete", icon: "delete"}
                    }
                });
            },
            colResize: {
                "handleWidth": 10,
                "exclude": [0],
                "resizeCallback": function(column) {
                    console.log("Column Resized = ", column);
                }
            },
            scrollY:'400px',
            scrollCollapse:false,
            autoWidth: true,
            paging: false,
            deferRender: true,
            stateSave: true,
            //displayLength: 4
        })

        table.on( 'page.dt',   function () { 
            $("#table-base div.dataTables_scrollBody").scrollTop(0);
         } )

        $(`${datatable_id} tbody`).on( 'mousedown', 'tr',  function() {
            selselect(this);
        } );
   
        $(`${datatable_id} tbody`).on('dblclick', 'tr', function (){
            //let table = $('#table_id').DataTable()
            let table = getDataTable(); 
            var data = table.row(this).data();
            console.log(data.name);
        } );
    })
</script>


</library-datatable>