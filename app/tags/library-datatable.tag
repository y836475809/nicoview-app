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
    </style>

<table ref="librarytable" id="table_id" 
class="display stripe hover" style="width:100%"></table>

<script>
    const remote = require('electron').remote
    const base_dir = remote.getGlobal('sharedObj').base_dir

    require('jquery-contextmenu');

    obs.on("receivedData", (datas) => {
        let table = $('#table_id').DataTable()
        table.clear().rows.add(datas).draw()
    })

    obs.on("setWidth", () => {
        //$('#table_id thead th:eq(1)').width('50');
        //   $("#table_id").DataTable({scrollY: 100}); 
        // ...
        $("#table_id").DataTable({retrieve: true}).destroy();
        // ...
        $("#table_id").DataTable({scrollY: 300});
    })
  
    this.on('mount', function () {
        
        $('#table_id').DataTable({
        scrollY:'100px',
        scrollCollapse:true,
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
            autoWidth: true,
            paging: false
        })

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