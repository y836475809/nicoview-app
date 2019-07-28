require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");
const time_format = require("./time-format");

/* globals $ */

const imageFormatter = (row, cell, value, columnDef, dataContext)=> {
    if(!value){
        return "";
    }
    return `<img class="gridtable-thumbnail" src="${value}"/>`;
};

const dateFormatter = (row, cell, value, columnDef, dataContext)=> {
    if(Number.isFinite(value) && value < 0){
        return "";
    }
    return time_format.toDate(value);
};

const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
    if(Number.isFinite(value) && value < 0){
        return "";
    }
    return time_format.toPlayTime(value);
};

const numberFormatter = (row, cell, value, columnDef, dataContext)=> {
    return value.toLocaleString();
};


const formatterMap = new Map([
    ["_img", imageFormatter],
    ["_date", dateFormatter],
    ["_time", timeFormatter],
    ["_count", numberFormatter],
]);

const splitBySpace = (search_string) => {
    return search_string.split(/[\u{20}\u{3000}]/u).filter(value=>{
        return value != "";
    });
};

class GridTable {
    constructor(name, columns, options){
        this.name = name;
        // this.id = `#${id}`;

        this.columns = columns.map(val => {
            const id = val.id;
            const key = id.match(/(_[^_]+)$/gi);
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

    init(container){
        this.container = $(container);
        this.dataView = new Slick.Data.DataView();
        this.grid = new Slick.Grid(this.container, this.dataView, this.columns, this.options);
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
            //todo
            // this.grid.render();
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
        selected_rows.sort();
        const datas = selected_rows.map(row=>{
            return this.dataView.getItem(row);
        });
        return datas;
    }

    clearSelected(){
        this.grid.setSelectedRows([]);
    }

    resize(new_size){
        this.container.height(new_size.height);
        this.container.width(new_size.width);
        this.grid.resizeCanvas();
    }

    resizeFitContainer(container){
        const new_height = container.clientHeight;
        const new_width = container.clientWidth;
        const new_szie = {
            height: new_height,
            width: new_width
        };
        this.resize(new_szie);
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

    //TODO
    addItem(item){
        this.dataView.addItem(item);
        this.dataView.reSort();
    }

    deleteItems(items){
        items.forEach(item => {
            this.dataView.deleteItem(item.id);
        });
        this.clearSelected();
        this.grid.invalidate();
        this.grid.render();
    }

    updateItem(item, id){
        if(this.dataView.getItemById(id) === undefined){
            this.dataView.addItem(item);     
        }else{
            this.dataView.updateItem(id, item);
        }
        this.dataView.reSort();
    }

    updateCell(id, column_id, value){
        const item = this.dataView.getItemById(id);
        if(item === undefined){
            return;
        }
        item[column_id] = value;
        this.dataView.updateItem(id, item);
    }

    setFilter(filter){
        this.filter = filter;
    }

    filterData(word){
        this.dataView.setFilterArgs({searchString: word, filter: this.filter});
        this.dataView.refresh();
    }

    scrollToTop(){
        this.grid.scrollRowToTop(0);
    }

    _filter(item, args) {
        if(args===undefined){
            return true;
        }
        if(args.searchString == ""){
            return true;
        }
        //空白区切りのand検索
        const words = splitBySpace(args.searchString);
        return words.every(word=>{        
            for(let column_id in item){
                const value = String(item[column_id]);
                if(args.filter(column_id, value, word)){
                    return true;
                }
            }
            return false;
        });
    }

    _saveState(){
        if(this.options._saveColumnWidth){
            const width_state = {};
            const columns = this.grid.getColumns();
            columns.forEach(val=>{
                width_state[val.id] = val.width;
            });
            localStorage.setItem(`${this.name}/columns/width`, JSON.stringify(width_state));
        }

        if(this.options._saveSort){
            const sort = this.grid.getSortColumns();
            if(sort.length>0){
                const sort_state = { 
                    id: sort[0].columnId, 
                    sort_asc: sort[0].sortAsc 
                };
                localStorage.setItem(`${this.name}/columns/sort`, JSON.stringify(sort_state));
            }
        }
    }

    _loadState(){
        if(this.options._saveColumnWidth){
            const width_value = localStorage.getItem(`${this.name}/columns/width`);
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
            const sort_value = localStorage.getItem(`${this.name}/columns/sort`);
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