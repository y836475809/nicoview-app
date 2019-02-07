require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");

class GridTable{
    constructor(){

        const columns = [
            {id: "image", name: "image", field: "image", height:100, width: 130,  formatter: imageFormatter},
            {id: "id", name: "id", field: "id", sortable: true},
            {id: "title", name: "Title", field: "title", sortable: true},
            {id: "%", name: "% Complete", field: "percentComplete", sortable: true},
            {id: "start", name: "Start", field: "start", sortable: true},
            {id: "finish", name: "Finish", field: "finish", sortable: true},
            {id: "effort-driven", name: "Effort Driven", field: "effortDriven", sortable: true}
        ];

    }

    init(id, columns, options){
        let default_options =  {
            enableCellNavigation: true,
            enableColumnReorder: false,
            fullWidthRows: true,
        };

        this.dataView = new Slick.Data.DataView();
        this.grid = new Slick.Grid(id, dataView, columns, options);
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
}