<search-page>
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
        background-color: #cccc00;
        width: 100%;
        height: 100%;
    } 
</style>
<div id="table-base">
<table ref="searchtable" id="search-table" class="display stripe hover" style="width:100%">
</table>
</div>
<script>
    // require('jquery-contextmenu');

    obs.on("receivedData", (datas) => {
        let table = $('#search-table').DataTable()
        table.clear().rows.add(datas).draw()

        //window.resizeBy(1, 0);
        //window.resizeBy(-1, 0); 
    })

    var selselect = function(){
            let selindex=0;

            return function(elm){
                let table = $('#search-table').DataTable()
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
        table = $('#search-table').DataTable({
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
                "render": function (data, type, row, meta) {
                    return `<img src='${data}'>`
                },
            },
            { targets: 1, data: "name" },
            { targets: 2, data: "salary" },
            { targets: 3, data: "office" },
            { targets: 4, data: "position" }],

            // drawCallback : function() 
            // {
            //     $.contextMenu({
            //         selector: 'tbody tr td', 
            //         callback: function(key, options) {
            //             var m = "clicked: " + key + ' ' + selected_id;
            //             console.log(m); 
            //         },
            //         events: {
            //         show : function(options){
            //             const cellIndex = parseInt(options.$trigger[0].cellIndex);
            //             const row = table.row(options.$trigger[0].parentNode);
            //             const rowIndex = row.index();
            //             console.log("rowIndex=", rowIndex, ", cellIndex=", cellIndex); 
            //             selselect(options.$trigger[0].parentNode)

            //             return true;
            //         },
            //         },
            //         items: {
            //             "edit": {name: "Edit", icon: "edit"},
            //             "cut": {name: "Cut", icon: "cut"},
            //             "copy": {name: "Copy", icon: "copy"},
            //             "paste": {name: "Paste", icon: "paste"},
            //             "delete": {name: "Delete", icon: "delete"}
            //         }
            //     });
            // },
            colResize: {
                "handleWidth": 10,
                "exclude": [0]
            },

            autoWidth: true,
            paging: true,
            deferRender: true,
            stateSave: true,
            displayLength: 4
        })
        table.on( 'page.dt',   function () { 
            //$("#table-base div.dataTables_scrollBody").scrollTop(0);
         } )

        $('#search-table tbody').on( 'mousedown', 'tr',  function() {
            selselect(this);
        } );
        
        $('#search-table tbody').on('dblclick', 'tr', function (){
            let table = $('#search-table').DataTable()
            var data = table.row(this).data();
            console.log(data.name);
        } );
    })
</script>
</search-page>