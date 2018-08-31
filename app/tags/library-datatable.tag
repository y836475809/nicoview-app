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

        :scope #table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>
<div id="table-base" show={ is_display }>
<table ref="librarytable" id="table_id" 
class="display stripe hover" style="width:100%"></table>
</div>
<script>
this.is_display = true
    const remote = require('electron').remote
    const base_dir = remote.getGlobal('sharedObj').base_dir

    require('jquery-contextmenu');

    obs.on("receivedData", (datas) => {
        let table = $('#table_id').DataTable()
        table.clear().rows.add(datas).draw()

        window.resizeBy(1, 0);
        window.resizeBy(-1, 0); 
    })

    obs.on("setWidth", () => {
        //table.columns.adjust()
        //$("#table-base div.dataTables_scrollBody").scrollTop(0);
        this.is_display = !this.is_display
        this.update()
    })

    this.on('mount', function () {
        
        table = $('#table_id').DataTable({
        scrollY:'400px',
        scrollCollapse:false,
            dom: 'Zlfrtip',
            columns: [
                { title: 'image' },
                { title: 'name' },
                { title: 'salary' },
                { title: 'office' },
                { title: 'position' }
            ],
            columnDefs: [{
                "targets": 0,
                "orderable": false,
                "data": "image",
                // width: 100,
                //"width": "40%",
                "render": function (data, type, row, meta) {
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
                        var m = "clicked: " + key + ' ' + selected_id;
                        console.log(m); 
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

            autoWidth: true,
            paging: true,
            deferRender: true,
            stateSave: true,
            displayLength: 4
        })
        table.on( 'page.dt',   function () { 
            $("#table-base div.dataTables_scrollBody").scrollTop(0);
         } )

        let selected_id;
        $('#table_id tbody').on( 'mousedown', 'tr',  function() {
            let table = $('#table_id').DataTable()
            var data = table.row(this).data();
            if ( $(this).hasClass('selected') ) {
                if(selected_id!==data.name)
                {
                    $(this).removeClass('selected');
                }     
            }else {
                table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                selected_id = data.name;
            }
        } );

        $('#table_id tbody').on('dblclick', 'tr', function (){
            let table = $('#table_id').DataTable()
            var data = table.row(this).data();
            console.log(data.name);
        } );
    })
</script>


</library-datatable>