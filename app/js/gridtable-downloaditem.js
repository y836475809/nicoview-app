const { GridTable, wrapFormatter, buttonFormatter } = require("./gridtable");


const DownloadState = Object.freeze({
    wait: 0,
    downloading: 1,
    complete: 2,
    error: 3
});

const message_map = new Map([
    [DownloadState.wait, "待機"],
    [DownloadState.downloading, "ダウンロード中"],
    [DownloadState.complete, "ダウンロード完了"],
    [DownloadState.error, "ダウンロード失敗"],
]);

const getDlStateClass = (state) => {
    if(state==DownloadState.complete){
        return 'class="download-state-complete"'; // eslint-disable-line
    }

    return "";
};

const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
    const video_id = dataContext.video_id;
    return `ID: ${video_id}`;
}; 

const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
    const msg = message_map.get(value);
    const class_value = getDlStateClass(value);
    const content = `<div ${class_value}>${msg}</div><div>${dataContext.progress}</div>`;
    return content;
};

class GridTableDownloadItem {
    constructor(container){
        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130, behavior: "selectAndMove"},
            {id: "title", name: "名前", behavior: "selectAndMove", formatter:wrapFormatter},
            {id: "command", name: "操作", behavior: "selectAndMove", 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark"])},
            {id: "info", name: "情報", behavior: "selectAndMove", formatter:infoFormatter},
            {id: "state", name: "状態", behavior: "selectAndMove", formatter:htmlFormatter}
        ];
        const options = {
            rowHeight: 100,
            enableCellNavigation: true,
            enableColumnReorder: false,
        };
        this.grid_table = new GridTable("download-item-grid", columns, options, "video_id");
        this.grid_table.init(container);
            
        this.grid_table.dataView.onRowCountChanged.subscribe((e, args) => { // eslint-disable-line no-unused-vars
            this.grid_table.grid.updateRowCount();
            this.grid_table.grid.render();
        });

        this.grid_table.dataView.onRowsChanged.subscribe((e, args) => {
            this.grid_table.grid.invalidateRows(args.rows);
            this.grid_table.grid.render();
        });
    }

    onContextMenu(on_context_menu){
        this.grid_table.onContextMenu((e)=>{
            on_context_menu(e);
        });
    }

    onDblClick(on_dbl_click){
        this.grid_table.onDblClick((e, data)=>{
            on_dbl_click(e, data);
        });
    }

    onButtonClick(on_click){
        this.grid_table.onButtonClick((e, cmd_id, data)=>{
            on_click(e, cmd_id, data);
        });
    }

    setData(items){
        const dl_items = items.map(value=>{
            const dl_item = Object.assign({...value});
            Object.assign(dl_item, {
                progress: ""
            });
            return dl_item;
        });
        this.grid_table.setData(dl_items);
    }

    getData(){
        return this.grid_table.dataView.getItems();
    }

    hasItem(id){
        const item = this.grid_table.dataView.getItemById(id);
        if(!item){
            return false;
        }
        return true;
    }

    addItems(items, state){
        items.forEach(item => {
            /** @type {RegDownloadItem[]} */
            const dv_items = this.grid_table.dataView.getItems();
            const fd_item = dv_items.find(value=>{
                return value.video_id == item.video_id;
            });
            if(fd_item===undefined){
                item["state"] = state;
                item["progress"] = "";
                this.grid_table.dataView.addItem(item);
            }else{
                this.grid_table.dataView.deleteItem(fd_item.video_id);
                fd_item["state"] = state;
                fd_item["progress"] = "";
                this.grid_table.dataView.addItem(fd_item);
            }
        });

        this.grid_table.dataView.refresh();
    }

    deleteItems(video_ids){
        video_ids.forEach(video_id => {
            const row_index = this.grid_table.dataView.getRowById(video_id);
            if(row_index!==undefined){
                this.grid_table.dataView.deleteItem(video_id);
            }
        });
    }

    clearItems(target_state){
        /** @type {RegDownloadItem[]} */
        const items = this.grid_table.dataView.getItems();
        items.forEach(item => {
            if(item.state === target_state){
                this.grid_table.dataView.deleteItem(item.video_id);
            }
        });
    }

    updateItem(video_id, prop){
        const row_index = this.grid_table.dataView.getRowById(video_id);
        if(row_index===undefined){
            return;
        }
        
        const item = this.grid_table.dataView.getItemById(video_id);

        Object.assign(item, prop);
        
        if(Object.prototype.hasOwnProperty.call(prop, "state")){
            const column_index = this.grid_table.grid.getColumnIndex("state");
            this.grid_table.grid.updateCell(row_index, column_index);
        }
        if(Object.prototype.hasOwnProperty.call(prop, "thumb_img")){
            const column_index = this.grid_table.grid.getColumnIndex("thumb_img");
            this.grid_table.grid.updateCell(row_index, column_index);
        }
    }
}

module.exports = {
    GridTableDownloadItem,
    DownloadState
};