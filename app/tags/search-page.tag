<search-page>
<style scoped>
    :scope .table-base{
        background-color: #cccc00;
        width: 100%;
        height: 100%;
    }
</style>

<div class="table-base">
    <input type="button" value="search" onclick={serach}>
    <base-datatable ref="dt" params={this.params}></base-datatable>
</div>
<context-menu ref="ctm" items={this.items}></context-menu>

<script>
    this.items = [
        { title: 'First item' , itemkey: "First"},
        { title: 'Second item', itemkey: "Second"}
    ];

    const remote = require('electron').remote;
    const shared_obj = remote.getGlobal('sharedObj');
    const base_dir = shared_obj.base_dir;

    require(`${base_dir}/app/tags/base-datatable.tag`);
    require(`${base_dir}/app/tags/context-menu.tag`);

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
        paging: false,
        dblclickRow: function(data){
            console.log("serach dblclickRow data:", data); 
        }          
    };

    this.on('mount', function () {
        let contextmenu = this.refs.ctm;

        this.refs.dt.showContextMenu=(e)=>{
            contextmenu.show(e);
        };

        contextmenu.callback = (e)=>{
            const key = e.key;
            const datas = this.refs.dt.getSelectedDatas();
            console.log("#conmenu key=", key);
            console.log("#conmenu data=", datas);
        };    
    });

    obs.on('pageResizedEvent', (size)=>{
        if(this.refs!==undefined){
            this.refs.dt.ress(size);
        }
    });
</script>
</search-page>