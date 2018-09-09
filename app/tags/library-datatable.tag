<library-datatable id="library-datatable">
    <style scoped>
        :scope .table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>

<div class="table-base">
    <base-datatable my_datatable_id="lib-table-id"></base-datatable>
</div>

<script>
    this.datatable_params = {
        columns : [
            { title: 'image' },
            { title: 'name' },
            { title: 'salary' },
            { title: 'office' },
            { title: 'position' }
        ],
        columnDefs: [
            {
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
            { targets: 4, data: "position" }
        ], 
        colResize : {
            handleWidth: 10,
            exclude: [0],
        },
        dom: 'Zlfrtip',  
        scrollY:'400px',
        scrollCollapse:false,
        autoWidth: true,
        paging: true,
        deferRender: true,
        stateSave: true,
        displayLength: 2,
        lengthMenu: [ 2, 4, 10, 20, 30, 40, 50 ],
        displayLength: 4,      
    };

    obs.on("dblclick-row", (e) => {
        console.log("dblclick-row id=", e.id);
        console.log("dblclick-row data=", e.data);
    });

</script>
</library-datatable>