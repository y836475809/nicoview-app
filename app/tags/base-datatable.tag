


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
    </style>

<table ref="datatable" id={this.opts.my_datatable_id}
class="display stripe hover" style="width:100%"></table>

<script>
    console.log("m-datatable datatable_id = ", this.opts.my_datatable_id);
    let datatable_params = this.parent.datatable_params;
    let self = this;
    require('jquery-contextmenu');
    
    this.datatable_id = this.opts.my_datatable_id;
    const opts_columns = datatable_params.columns;

    let getDataTableElm = function(){
        return $(`#${self.datatable_id}`);
    };
    let getDataTable = function(){
        //let k = getDataTableElm().DataTable();
        return getDataTableElm().DataTable();
    };

    obs.on("receivedData", (datas) => {
        let table = getDataTable();
        table.clear().rows.add(datas).draw()

        window.resizeBy(1, 0);
        window.resizeBy(-1, 0); 
    });

    obs.on("setSize-p1", () => {
        let table = getDataTable(); 
        const id = $(table.table().container()).attr('id');
        //$('.dataTables_scrollBody').css('height', ($(window).height() - 200));
        const h = $(window).height() - 200;
        $(`#${id} div.dataTables_scrollBody`).css('height', h);
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
            columns: [
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
                handleWidth: 10,
                exclude: [0],
                //"resizeCallback": function(column) {
                //    console.log("Column Resized = ", column);
                //}
            },
            //scrollY:'50vh',
            scrollY: ($(window).height() - 200),
            scrollCollapse:false,
            autoWidth: true,
            paging: true,
            deferRender: true,
            stateSave: true,
            //pageLength: 2,
            lengthMenu: [ 2, 4, 10, 20, 30, 40, 50 ],
            displayLength: 4,  
        })

        table.on( 'page.dt',   function () {
            $("div.dataTables_scrollBody").scrollTop(0);
         } )

        $(`#${this.datatable_id} tbody`).on( 'mousedown', 'tr',  function() {
            selselect(this);
        } );
   
        $(`#${this.datatable_id} tbody`).on('dblclick', 'tr', function (){
            //let table = $('#table_id').DataTable()
            let table = getDataTable(); 
            var data = table.row(this).data();
            //console.log(data.name);
            self.parent.dblclick_f(data);
        } );
    })    
</script>  
</base-datatable>