require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/slick.core");
require("slickgrid/slick.grid");
require("slickgrid/slick.dataview");
require("slickgrid/plugins/slick.rowselectionmodel");
require("slickgrid/plugins/slick.autotooltips");
require("slickgrid/plugins/slick.resizer");

const time_format = require("./time-format");
const { IPCClient } = require("./ipc-client-server");

/* globals $ Slick */

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
    return time_format.toDateString(value);
};

const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
    if(Number.isFinite(value) && value < 0){
        return "";
    }
    return time_format.toTimeString(value);
};

const numberFormatter = (row, cell, value, columnDef, dataContext)=> {
    return value.toLocaleString();
};

const wrapFormatter = (row, cell, value, columnDef, dataContext) => {
    return `<div class="wrap-gridtable-cell">${value}</div>`;
};

const buttonFormatter = (opts, row, cell, value, columnDef, dataContext)=> {
    if(!dataContext.id){
        return "";
    }
    
    const map = new Map();
    map.set("play", {title:"再生", icon:"fas fa-play"});
    map.set("stack", {title:"後で見る", icon:"fas fa-stream"});
    map.set("bookmark", {title:"ブックマーク", icon:"fas fa-bookmark"});
    map.set("download", {title:"ダウンロードに追加", icon:"fas fa-download"});
    
    let buttons = "";
    opts.forEach(opt => {
        if(map.has(opt)){
            const item = map.get(opt);
            buttons +=         
            `<button title=${item.title} data-cmdid=${opt} class="center-hv gridtable-button cmd-btn">
                <i data-cmdid=${opt} class="${item.icon} cmd-btn"></i>
            </button>`;
        }
    });
    return `<div style="display:flex; flex-wrap: wrap;">${buttons}</div>`;
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
            id_click_as_dbclick:""
        };
        if(options===undefined){
            options = {};
            this.options = Object.assign(options, default_options);
        }else{
            this.options = Object.assign(default_options, options);
        }
        
        this.on_dblclick = (e, data)=>{};
        this.on_button_click = (e, data)=>{};
        this.on_context_menu = (e)=>{};
        this.filter = (column_id, value, word) => { return true; };
        this.target_column_ids = [];
    }

    init(container){
        // this.container = $(container);
        this.dataView = new Slick.Data.DataView();
        this.grid = new Slick.Grid(container, this.dataView, this.columns, this.options);
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
        });
    
        this.dataView.onRowsChanged.subscribe((e, args) => {
            this.grid.invalidateRows(args.rows);
            this.grid.render();
        });
        this.grid.setSelectionModel(new Slick.RowSelectionModel());
        this.grid.onClick.subscribe((e) => {
            const cell = this.grid.getCellFromEvent(e);

            if ($(e.target).hasClass("cmd-btn")) {
                const data = this.dataView.getItem(cell.row);
                this.on_button_click(e, e.target.dataset.cmdid, data);
                e.stopImmediatePropagation();
                e.stopPropagation();
                return;
            }
            
            this.grid.setSelectedRows([cell.row]);
            
            if(cell.cell == this.grid.getColumnIndex(this.options.id_click_as_dbclick)){
                const data = this.dataView.getItem(cell.row);
                this.on_dblclick(e, data);   
            }
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

        this.grid.registerPlugin(new Slick.AutoTooltips());
    }

    setupResizer(container){
        this.resizer = new Slick.Plugins.Resizer({
            container: container,
            rightPadding: 0,
            bottomPadding: 5,
            minHeight: 100,
            minWidth: 100,
        });
        this.grid.registerPlugin(this.resizer);
    }

    resizeGrid(width, height){
        if(width && height){
            const  container = $(this.grid.getContainerNode());
            container.width(width);
            container.height(height);      
            this.grid.resizeCanvas();
            return; 
        }

        this.resizer.resizeGrid();
    }

    onDblClick(on_dblclick){
        this.on_dblclick = on_dblclick;
    }

    onButtonClick(on_click){
        this.on_button_click = on_click;
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

    //TODO gridtable-downloaditem.js
    setSelectedRows(rows){
        this.grid.setSelectedRows(rows);
    }

    clearSelected(){
        this.grid.setSelectedRows([]);
    }

    getRowsByIds(ids){   
        return this.dataView.mapIdsToRows(ids);
    }

    scrollRow(row, dopaging=false){
        this.grid.scrollRowIntoView(row, dopaging);
    }

    setData(data){
        this.dataView.beginUpdate();
        this.dataView.setItems(data);
        this.dataView.setFilter(this._filter, this.target_column_ids);
        this.dataView.endUpdate();
        this.grid.invalidate();

        this._loadState();
    }

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
    }

    deleteItemById(id){
        this.dataView.deleteItem(id);
        this.clearSelected();
        this.grid.invalidate();
    }

    // TODO id, itemの並びに修正する
    updateItem(item, id){
        if(this.dataView.getItemById(id) === undefined){
            this.dataView.addItem(item);     
        }else{
            this.dataView.updateItem(id, item);
        }

        // TODO いきなりスクロールしたりしないか？
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
    
    updateCells(id, props){
        const item = this.dataView.getItemById(id);
        if(item === undefined){
            return;
        }
        Object.keys(props).forEach(key=>{
            if(item[key]!==undefined){
                item[key] = props[key];
            }
        });
        this.dataView.updateItem(id, item);
    }

    setFilter(filter, target_column_ids, toStringFunc=(item, column_id)=>{return String(item[column_id]);}){
        this.filter = filter;
        this.target_column_ids = target_column_ids;
        this.toStringFunc = toStringFunc;
    }

    filterData(word){
        this.dataView.setFilterArgs({
            filter: this.filter,
            target_column_ids: this.target_column_ids,
            searchString: word, 
            toStringFunc: this.toStringFunc,
        });
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
        const column_ids = 
            args.target_column_ids.length==0?Object.keys(item):args.target_column_ids;
        const toStringFunc = args.toStringFunc;
        return words.every(word=>{
            for (let index = 0; index < column_ids.length; index++) {
                const column_id = column_ids[index];
                const value = toStringFunc(item, column_id);
                if(args.filter(column_id, value, word)){
                    return true;
                }   
            }
            return false;
        });
    }

    _saveState(){
        const width_state = {};
        const columns = this.grid.getColumns();
        columns.forEach(val=>{
            width_state[val.id] = val.width;
        });

        const sort_state = {};
        const sort = this.grid.getSortColumns();
        if(sort.length>0){
            sort_state["id"] = sort[0].columnId;
            sort_state["sort_asc"] = sort[0].sortAsc;
        }

        IPCClient.request("config", "set", { 
            key:`gridtable.${this.name}.columns`, 
            value:{
                width: width_state,
                sort: sort_state
            } 
        }).then();
    }

    _loadState(){
        IPCClient.request("config", "get", { 
            key:`gridtable.${this.name}.columns`, 
            value:{
                width: null,
                sort: null
            } 
        }).then((value)=>{
            if(value.width){
                const columns = this.grid.getColumns();
                columns.forEach(val=>{
                    const column_id = val.id;
                    const width = value.width[column_id];
                    val.width = width ? width : 80;
                });
                this.grid.setColumns(columns);
            } 
            if(value.sort){
                const { id, sort_asc } = value.sort;
                if(id){
                    this.grid.setSortColumn(id, sort_asc); 
                    this.dataView.fastSort(id, sort_asc); 
                }
            }
        });
    }
}

module.exports = {
    GridTable,
    wrapFormatter,
    buttonFormatter,
};