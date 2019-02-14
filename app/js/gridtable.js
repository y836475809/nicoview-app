require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");
const time_format = require("./time_format");

/* globals $ */

const imageFormatter = (row, cell, value, columnDef, dataContext)=> {
    return `<img src='${value}' width="130" height="100"/>`;
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
            _saveColumnWidth: false,
            _saveSort: false,
        };
        if(options===undefined){
            options = {};
            this.options = Object.assign(options, default_options);
        }else{
            this.options = Object.assign(default_options, options);
        }
        
        this.on_dblclick = (e, data)=>{};
        this.on_context_menu = (e)=>{};
        this.filter = (column_id, value, word) => { return true; };
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
            this.grid.setSelectedRows([cell.row]);
            e.stopPropagation();
        });
        this.grid.onDblClick.subscribe((e) => {
            const cell = this.grid.getCellFromEvent(e);
            this.grid.setSelectedRows([cell.row]);
            e.stopPropagation();

            const data = this.dataView.getItem(cell.row);
            this.on_dblclick(e, data);
        });
        this.grid.onContextMenu.subscribe((e) => {
            e.preventDefault();
            const selected_rows = this.grid.getSelectedRows();
            const cell = this.grid.getCellFromEvent(e);
            if(selected_rows.indexOf(cell.row)===-1){
                this.grid.setSelectedRows([cell.row]);
            }
            this.on_context_menu(e);
        });  
        this.grid.onSort.subscribe((e, args) => {
            this._saveState();
        }); 
        this.grid.onColumnsResized.subscribe(() => {
            this._saveState();
        }); 
    }

    onDblClick(on_dblclick){
        this.on_dblclick = on_dblclick;
    }

    onContextMenu(on_context_menu){
        this.on_context_menu = on_context_menu;
    }

    getSelectedDatas(){
        const selected_rows = this.grid.getSelectedRows();
        const datas = selected_rows.map(row=>{
            return this.dataView.getItem(row);
        });
        return datas;
    }

    resize(new_size){
        $(this.id).height(new_size.height);
        $(this.id).width(new_size.width);
        this.grid.resizeCanvas();
    }

    resizeFitContainer(container){
        const new_height = $(window).height() - container.offsetTop - 5;
        const new_width = container.clientWidth - 5;
        const new_szie = {
            height: new_height,
            width: new_width
        };
        this.resize(new_szie);
    }

    get scrollTop(){
        return this.grid.getCanvasNode().offsetParent.scrollTop;
    }

    set scrollTop(value){
        this.grid.getCanvasNode().offsetParent.scrollTop = value;
    }

    scrollRow(row){
        this.grid.scrollRowIntoView(row, false);
    }

    setData(data){
        this.dataView.beginUpdate();
        this.dataView.setItems(data);
        this.dataView.setFilter(this._filter);
        this.dataView.endUpdate();

        this._loadState();
    }

    setFilter(filter){
        this.filter = filter;
    }

    filterData(word){
        this.dataView.setFilterArgs({searchString: word, filter: this.filter});
        this.dataView.refresh();
    }

    _filter(item, args) {
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
        }
        return false;
    }

    _saveState(){
        if(this.options._saveColumnWidth){
            const width_state = {};
            const columns = this.grid.getColumns();
            columns.forEach(val=>{
                width_state[val.id] = val.width;
            });
            localStorage.setItem(`${this.id}/columns/width`, JSON.stringify(width_state));
        }

        if(this.options._saveSort){
            const sort = this.grid.getSortColumns();
            if(sort.length>0){
                const sort_state = { 
                    id: sort[0].columnId, 
                    sort_asc: sort[0].sortAsc 
                };
                localStorage.setItem(`${this.id}/columns/sort`, JSON.stringify(sort_state));
            }
        }
    }

    _loadState(){
        if(this.options._saveColumnWidth){
            const width_value = localStorage.getItem(`${this.id}/columns/width`);
            if(width_value){
                const width_state = JSON.parse(width_value);
                const columns = this.grid.getColumns();
                columns.forEach(val=>{
                    const column_id = val.id;
                    const width = width_state[column_id];
                    val.width = width ? width : 80;
                });
                this.grid.setColumns(columns);
            }
        }

        if(this.options._saveSort){
            const sort_value = localStorage.getItem(`${this.id}/columns/sort`);
            if(sort_value){
                const sort_state = JSON.parse(sort_value);
                this.grid.setSortColumn(sort_state.id, sort_state.sort_asc); 
                this.dataView.fastSort(sort_state.id, sort_state.sort_asc); 
            }
        }
    }
}

module.exports = {
    GridTable: GridTable,
};