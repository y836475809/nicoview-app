require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");
// const $ = require("jquery");
const time_format = require("./time_format");

/* globals $ */

const imageFormatter = (row, cell, value, columnDef, dataContext)=> {
    return `<img src='${value}' />`;
};

const dateFormatter = (row, cell, value, columnDef, dataContext)=> {
    return time_format.toDate(value);
};

const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
    return time_format.toPlayTime(value);
};


const formatterMap = new Map([
    ["_img", imageFormatter],
    ["_date", dateFormatter],
    ["_time", timeFormatter],
]);

class GridTable {
    constructor(id, columns, options){
        this.id = `#${id}`;

        this.columns = columns.map(val => {
            const id = val.id;
            const key = id.match(/(_.*)$/gi);
            if(val.formatter === undefined 
                && key != null
                && formatterMap.has(key[0])){
                return Object.assign(val, 
                    {
                        field: val.id,
                        formatter: formatterMap.get(key[0])
                    });
            }

            return Object.assign(val, {field: val.id});
        });

        const default_options =  {
            enableCellNavigation: true,
            enableColumnReorder: false,
            fullWidthRows: true,
        };
        if(options===undefined){
            options = {};
        }
        this.options = Object.assign(options, default_options);

        this.onContextMenu = (e, data)=>{};
        this.filter = (column_id, value, word) => { return true; };

        this.on_sort_changed = (e)=>{};
        this.on_column_width_changed = (e)=>{};
    }

    init(){
        this.dataView = new Slick.Data.DataView();
        this.grid = new Slick.Grid(this.id, this.dataView, this.columns, this.options);
        this.grid.onSort.subscribe((e, args) => {
            const comparer = (a, b) => {
                return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1;
            };
            this.dataView.sort(comparer, args.sortAsc);
            this.grid.invalidate();
            this.grid.render();
        });
        this.dataView.onRowCountChanged.subscribe((e, args) => {
            this.grid.updateRowCount();
            this.grid.render();
        });
    
        this.dataView.onRowsChanged.subscribe((e, args) => {
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

            const data = this.dataView.getItem(cell.row);
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
        this.grid.onSort.subscribe((e, args) => {
            // console.log("onSort sortCol=", args.sortCol);
            // console.log("onSort sortAsc=", args.sortAsc);
            const column_id = args.sortCol.id;
            const column_sort_asc = args.sortAsc;
            this.on_sort_changed({ 
                id: this.id, 
                column_id: column_id, 
                column_sort_asc: column_sort_asc 
            });
        }); 
        this.grid.onColumnsResized.subscribe(() => {
            // console.log("onColumnsResized columns=", this.grid.getColumns());
            const columns = this.grid.getColumns();
            const column_width = columns.map(value=>{
                return {
                    column_id: value.id,
                    column_width: value.width
                };
            });
            this.on_column_width_changed({ 
                id: this.id, 
                column_width: column_width
            });
        }); 
    }

    resize(new_size){
        $(this.id).height(new_size.height);
        $(this.id).width(new_size.width);
        this.grid.resizeCanvas();
    }

    get scrollTop(){
        return this.grid.getCanvasNode().offsetParent.scrollTop;
    }

    set scrollTop(value){
        this.grid.getCanvasNode().offsetParent.scrollTop = value;
    }

    setData(data){
        this.dataView.beginUpdate();
        this.dataView.setItems(data);
        this.dataView.setFilter(this._filter);
        this.dataView.endUpdate();
        // this.grid.render();
    }

    setFilter(filter){
        this.filter = filter;
        // this.dataView.setFilter(this._filter);
    }

    filterData(word){
        this.dataView.setFilterArgs({searchString: word, filter: this.filter});
        this.dataView.refresh();
    }

    _filter(item, args) {
        // console.log("myFilter item=", item);
        if(args===undefined){
            return true;
        }
        if(args.searchString == ""){
            return true;
        }
        for(let column_id in item){
            const value = String(item[column_id]);
            if(args.filter(column_id, value, args.searchString)){
                return true;
            }           
            // if(this.filter(column_id, value, args.searchString)){
            //     return true;
            // }
        }
        return false;
    }
}

module.exports = {
    GridTable: GridTable,
};