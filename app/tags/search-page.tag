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

<script>
    /* globals base_dir obs */
    const {remote} = require("electron");
    const {Menu, MenuItem} = remote;
    
    require(`${base_dir}/app/tags/base-datatable.tag`);

    this.serach = () => {
        console.log("serach");
    };


    this.params = {};
    this.params.dt = {
        columns: [
            { title: "image" },
            { title: "id" },
            { title: "name" },
            { title: "office" },
            { title: "position" }
        ],
        columnDefs: [{
            targets: 0,
            orderable: false,
            data: "image",
            render: function (data, type, row, meta) {
                return `<img src="${data}">`;
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
        dom: "Zfrtip",
        scrollY:"100px",
        scrollCollapse:false,
        autoWidth: true,
        deferRender: true,
        stateSave: true,
        paging: false,
        dblclickRow: function(data){
            console.log("serach dblclickRow data:", data); 
        }          
    };

    let self = this;
    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            const datas = self.refs.dt.getSelectedDatas();
            console.log("search context menu data=", datas);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));
    
    this.kk = () => {console.log("ch=");};
    this.on("mount", () => {
        this.refs.dt.showContextMenu=(e)=>{
            e.preventDefault();
            menu.popup({window: remote.getCurrentWindow()});
        };
    });

    obs.on("pageResizedEvent", (size)=>{
        if(this.refs!==undefined){
            this.refs.dt.ress(size);
        }
    });
</script>
</search-page>