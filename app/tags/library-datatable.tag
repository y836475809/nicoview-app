<library-datatable id="library-datatable">

<table ref="librarytable" id="table_id" 
class="cell-border stripe hover" style="width:100%"></table>

<script>
    const remote = require('electron').remote
    const base_dir = remote.getGlobal('sharedObj').base_dir

    require('jquery-contextmenu');

    function Employee(image, name, position, salary, office) {
         this.image = image;
         this.name = name;
         this.position = position;
         this.salary = salary;
         this._office = office;

         this.office = function () {
             return this._office;
         }
    };

    obs.on("showPlayer", () => {
        let table = $('#table_id').DataTable()
        const data_dir = `${base_dir}/test/datatables/data`
        table.clear().rows.add([
            new Employee(`${data_dir}/brie.jpg`, "Tiger Nixon", "System Architect", "$3,120", "Edinburgh"),
            new Employee(`${data_dir}/cheddar.jpg`, "Garrett Winters", "Director", "$5,300", "Edinburgh"),
            new Employee(`${data_dir}/brie.jpg`, "Garrett", "Director", "$5,300", "Edinburgh"),
            new Employee(`${data_dir}/brie.jpg`, "Winters", "Director", "$5,300", "Edinburgh"),
            new Employee(`${data_dir}/cheddar.jpg`, "t Winters", "Director", "$5,300", "Edinburgh"),
        ])
        .draw()
    })

    obs.on("setWidth", () => {
        $('#table_id thead th:eq(1)').width('50');
    })
  
    this.on('mount', function () {
        
        $('#table_id').DataTable({
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