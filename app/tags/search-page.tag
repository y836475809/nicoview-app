<search-page>
<style scoped>
    :scope .table-base{
        background-color: #cccc00;
        width: 100%;
        height: 100%;
    } 
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

<div class="table-base">
    <input type="button" value="search" onclick={serach}>
    <base-datatable ref="search_dt" my_datatable_id="search-dt"></base-datatable>
</div>
<context-menu ref="ctm" items={this.items}></context-menu>

<script>
    this.items = [
        { title: 'First item' , itemkey: "First"},
        { title: 'Second item', itemkey: "Second"}
    ];
    // require('jquery-contextmenu');
    const remote = require('electron').remote;
    const shared_obj = remote.getGlobal('sharedObj');
    const base_dir = shared_obj.base_dir;

    require(`${base_dir}/app/tags/base-datatable.tag`);
    require(`${base_dir}/app/tags/context-menu.tag`);

    let self = this;
    let contextmenu;

    serach(){
        console.log("serach");

    };

    this.params = {};
    this.params.dt = {
        columns: [
            { title: 'image' },
            { title: 'id' },
            { title: 'name' },
            { title: 'office' },
            { title: 'position' }
        ],
        columnDefs: [{
            targets: 0,
            orderable: false,
            data: "image",
            render: function (data, type, row, meta) {
                return `<img src='${data}'>`
            },
        },
        { targets: 1, data: "id" },
        { targets: 2, data: "name" },
        { targets: 3, data: "office" },
        { targets: 4, data: "position" }],
        colResize: {
            handleWidth: 10,
            exclude: [0]
        },
        dom: 'Zfrtip',
        scrollY:'400px',
        scrollCollapse:false,
        autoWidth: true,
        deferRender: true,
        stateSave: true,
        // paging: true,
        paging: false,
        // displayLength: 4,
        // lengthMenu: [ 4, 10, 20, 30, 40, 50 ],
        // lengthChange: false,

        dblclickRow: function(data){
        }          
    };

    this.on('mount', function () {
        contextmenu = this.refs.ctm;

        self.refs.search_dt.showContextMenu=(e)=>{
            contextmenu.show(e);
        };

        contextmenu.callback = (e)=>{
            const key = e.key;
            const datas = self.refs.search_dt.getSelectedDatas();
            console.log("#conmenu key=", key);
            console.log("#conmenu data=", datas);
        }; 

        //self.refs.search_dt.adjust_columns();       
    });

    obs.on('pageResizedEvent', function (size) {
        if(self.refs!==undefined){
            self.refs.search_dt.ress(size);
        }
    });

    // this.on('mount', function () {   
    //     table = $('#search-table').DataTable({
    //     scrollY:'400px',
    //     scrollCollapse:false,
    //         dom: 'Zlfrtip',
    //         columns: [
    //             { title: 'image' },
    //             { title: 'name' },
    //             { title: 'salary' },
    //             { title: 'office' },
    //             { title: 'position' }
    //         ],
    //         columnDefs: [{
    //             "targets": 0,
    //             "orderable": false,
    //             "data": "image",
    //             "render": function (data, type, row, meta) {
    //                 return `<img src='${data}'>`
    //             },
    //         },
    //         { targets: 1, data: "name" },
    //         { targets: 2, data: "salary" },
    //         { targets: 3, data: "office" },
    //         { targets: 4, data: "position" }],

    //         // drawCallback : function() 
    //         // {
    //         //     $.contextMenu({
    //         //         selector: 'tbody tr td', 
    //         //         callback: function(key, options) {
    //         //             var m = "clicked: " + key + ' ' + selected_id;
    //         //             console.log(m); 
    //         //         },
    //         //         events: {
    //         //         show : function(options){
    //         //             const cellIndex = parseInt(options.$trigger[0].cellIndex);
    //         //             const row = table.row(options.$trigger[0].parentNode);
    //         //             const rowIndex = row.index();
    //         //             console.log("rowIndex=", rowIndex, ", cellIndex=", cellIndex); 
    //         //             selselect(options.$trigger[0].parentNode)

    //         //             return true;
    //         //         },
    //         //         },
    //         //         items: {
    //         //             "edit": {name: "Edit", icon: "edit"},
    //         //             "cut": {name: "Cut", icon: "cut"},
    //         //             "copy": {name: "Copy", icon: "copy"},
    //         //             "paste": {name: "Paste", icon: "paste"},
    //         //             "delete": {name: "Delete", icon: "delete"}
    //         //         }
    //         //     });
    //         // },
    //         colResize: {
    //             "handleWidth": 10,
    //             "exclude": [0]
    //         },

    //         autoWidth: true,
    //         paging: true,
    //         deferRender: true,
    //         stateSave: true,
    //         displayLength: 4
    //     })
    //     table.on( 'page.dt',   function () { 
    //         //$("#table-base div.dataTables_scrollBody").scrollTop(0);
    //      } )

    //     $('#search-table tbody').on( 'mousedown', 'tr',  function() {
    //         selselect(this);
    //     } );
        
    //     $('#search-table tbody').on('dblclick', 'tr', function (){
    //         let table = $('#search-table').DataTable()
    //         var data = table.row(this).data();
    //         console.log(data.name);
    //     } );
    //})
</script>
</search-page>