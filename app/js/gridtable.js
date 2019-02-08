require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");

class GridTable{
    constructor(columns){

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130,  formatter: imageFormatter},
            {id: "id", name: "id",sortable: true},
            {id: "title", name: "Title", sortable: true},
            {id: "percentComplete", name: "% Complete", sortable: true},
            {id: "creation_date", name: "Creation date", sortable: true},
            {id: "pub_date", name: "Pub date", sortable: true},
            {id: "effortDriven", name: "Effort Driven", sortable: true}
        ];

        this.nn = columns.map(val=>{
            const id = val.id;
            "thn_img".match(/(_.*)$/gi)
            /(_img)$/i
            return Object.assign(val, {field: val.id});
        });

        this.onContextMenu = (e, data)=>{};

    }

    init(id, columns, options){
        let default_options =  {
            enableCellNavigation: true,
            enableColumnReorder: false,
            fullWidthRows: true,
        };
        if(options===undefined){
            options = {};
        }
        const grid_options = Object.assign(options, default_options);

        this.dataView = new Slick.Data.DataView();
        this.grid = new Slick.Grid(id, this.dataView, columns, grid_options);
        this.grid.onSort.subscribe((e, args) => {
            const comparer = (a, b) => {
                return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1;
            };
            this.dataView.sort(comparer, args.sortAsc);
            this.grid.invalidate();
            this.grid.render();
        });
        this.dataView.onRowCountChanged.subscribe(function (e, args) {
            this.grid.updateRowCount();
            this.grid.render();
        });
    
        this.dataView.onRowsChanged.subscribe(function (e, args) {
            this.grid.invalidateRows(args.rows);
            this.grid.render();
        });
        this.grid.setSelectionModel(new Slick.RowSelectionModel());
        this.grid.onClick.subscribe((e) => {
            const cell = this.grid.getCellFromEvent(e);
            console.log(cell.row);
            this.grid.setSelectedRows([cell.row]);
            e.stopPropagation();
        });
        this.grid.onDblClick.subscribe((e) => {
            const cell = this.grid.getCellFromEvent(e);
            console.log("onDblClick cell.row=", cell.row);
            this.grid.setSelectedRows([cell.row]);
            e.stopPropagation();
        });
        this.grid.onContextMenu.subscribe((e) => {
            e.preventDefault();
            const cell = this.grid.getCellFromEvent(e);
            this.grid.setSelectedRows([cell.row]);

            const data = dataView.getItem(cell.row);
            this.onContextMenu(e, data);
            // $("#contextMenu")
            //     .data("row", cell.row)
            //     .css("top", e.pageY)
            //     .css("left", e.pageX)
            //     .show();
            // $("body").one("click", function () {
            //     $("#contextMenu").hide();
            // });
        });       
    }

    setData(){

    }
}