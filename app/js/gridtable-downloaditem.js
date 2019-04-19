require("slickgrid/lib/jquery.event.drag-2.3.0");
require("slickgrid/lib/jquery.event.drop-2.3.0");
require("slickgrid/plugins/slick.rowmovemanager");
const { GridTable } = require("./gridtable");
const { SettingStore } = require("./setting-store");
const { DownloadItemStore } = require("./download-item-store");

class GridTableDownloadItem {
    constructor(parent_elm, state_formatter){
        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130, behavior: "selectAndMove"},
            {id: "id", name: "id", behavior: "selectAndMove"},
            {id: "name", name: "名前", behavior: "selectAndMove"},
            {id: "state", name: "状態", behavior: "selectAndMove", formatter:state_formatter}
        ];
        const options = {
            rowHeight: 100,
            enableCellNavigation: true,
            enableColumnReorder: false,
            _saveColumnWidth: true
        };
        this.grid_table = new GridTable("download-item-grid", columns, options);
        this.grid_table.init(parent_elm);
            
        this.grid_table.dataView.onRowCountChanged.subscribe((e, args) => {
            this.grid_table.grid.updateRowCount();
            this.grid_table.grid.render();
        });

        this.grid_table.dataView.onRowsChanged.subscribe((e, args) => {
            this.grid_table.grid.invalidateRows(args.rows);
            this.grid_table.grid.render();
        });

        const moveRowsPlugin = new Slick.RowMoveManager({
            cancelEditOnDrag: true
        });

        moveRowsPlugin.onBeforeMoveRows.subscribe((e, data) => {
            for (let i = 0; i < data.rows.length; i++) {
                if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
                    e.stopPropagation();
                    return false;
                }
            }
            return true;
        });

        moveRowsPlugin.onMoveRows.subscribe((e, args) => {
            let data = this.grid_table.dataView.getItems();
            let extractedRows = [], left, right;
            const rows = args.rows;
            const insertBefore = args.insertBefore;
            left = data.slice(0, insertBefore);
            right = data.slice(insertBefore, data.length);

            rows.sort(function(a,b) { return a-b; });

            for (let i = 0; i < rows.length; i++) {
                extractedRows.push(data[rows[i]]);
            }

            rows.reverse();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row < insertBefore) {
                    left.splice(row, 1);
                } else {
                    right.splice(row - insertBefore, 1);
                }
            }

            data = left.concat(extractedRows.concat(right));

            const selectedRows = [];
            for (let i = 0; i < rows.length; i++){
                selectedRows.push(left.length + i);
            }

            this.grid_table.grid.resetActiveCell();
            this.grid_table.dataView.beginUpdate();
            this.grid_table.dataView.setItems(data);
            this.grid_table.dataView.endUpdate();

            this.grid_table.grid.setSelectedRows(selectedRows);

            this.save();
        });

        this.grid_table.grid.registerPlugin(moveRowsPlugin); 
    }

    init(on_context_menu, on_dbl_click){
        this.store = new DownloadItemStore(SettingStore.getSystemFile("download.json"));

        this.grid_table.onContextMenu((e)=>{
            on_context_menu(e);
        });

        this.grid_table.onDblClick((e, data)=>{
            on_dbl_click(e, data);
        });

        this.store.load(); 
        this.grid_table.setData(this.store.getItems());
        this.grid_table.dataView.setFilter((item)=>{
            return item.visible===true;
        });
    }

    resizeFitContainer(container){
        this.grid_table.resizeFitContainer(container);
    }

    save(){
        this.store.setItems(this.grid_table.dataView.getItems()); 
        this.store.save(); 
    }

    hasItem(id){
        return this.grid_table.dataView.getRowById(id) !== undefined;
    }

    getItemByIdx(index){
        return this.grid_table.dataView.getItemByIdx(index);
    }

    getItemIDSet(){
        const items = this.grid_table.dataView.getItems();
        const id_set = new Set();
        items.forEach(value => {
            if(value.visible){
                id_set.add(value.id);
            }
        });
        return id_set;
    }

    addItems(items, state){
        items.forEach(item => {
            const dv_items = this.grid_table.dataView.getItems();
            const fd_item = dv_items.find(value=>{
                return value.id == item.id;
            });
            if(fd_item===undefined){
                item["visible"] = true;
                item["state"] = state;
                item["progress"] = "";
                this.grid_table.dataView.addItem(item);
            }else{
                this.grid_table.dataView.deleteItem(fd_item.id);
                fd_item["visible"] = true;
                fd_item["state"] = state;
                fd_item["progress"] = "";
                this.grid_table.dataView.addItem(fd_item);
            }
        });

        this.grid_table.dataView.refresh();
        this.save();
    }

    deleteItems(video_ids){
        video_ids.forEach(video_id => {
            if(this.hasItem(video_id)){
                const item = this.grid_table.dataView.getItemById(video_id);
                item.visible = false;
            }
        });
        this.grid_table.dataView.refresh();
        this.save();
    }

    deleteSelectedItems(){
        const items = this.grid_table.getSelectedDatas();
        items.forEach(value => {
            const item = this.grid_table.dataView.getItemById(value.id);
            item.visible = false;
        });
        this.grid_table.dataView.refresh();
        this.grid_table.grid.setSelectedRows([]);
        this.grid_table.grid.resetActiveCell();
        this.save();

        const deleted_ids = items.map(value => {
            return value.id;
        });
        return deleted_ids;
    }

    clearItems(target_state){
        const items = this.grid_table.dataView.getItems();
        items.forEach(item => {
            if(item.state === target_state){
                this.grid_table.dataView.deleteItem(item.id);
            }
        });
        this.save();
    }

    updateItem(video_id, progress, state){
        const row_index = this.grid_table.dataView.getRowById(video_id);
        if(row_index===undefined){
            return;
        }
        const column_index = this.grid_table.grid.getColumnIndex("state");
        const item = this.grid_table.dataView.getItemById(video_id);
        if(item.visible===false){
            return;
        }
        item.progress = progress;
        item.state = state;
        this.grid_table.grid.updateCell(row_index, column_index);
    }

    canDownload(video_id, target_states){
        const items = this.grid_table.dataView.getItems();
        const f = items.find(value=>{
            return value.id == video_id;
        });
        if(f===undefined){
            return false;
        }
        if(f.visible===false){
            return false;
        }
        return target_states.includes(f.state);
    }

    getNextVideoID(video_id){
        const items = this.grid_table.dataView.getItems();
        let index = items.findIndex(value=>{
            return value.id == video_id;
        });
        if(index===-1){
            throw new Error(`not find ${video_id}`);
        }
        index++;
        if(index >= items.length){
            return undefined;
        }

        let next_item = items[index];
        if(next_item.visible===false){
            while(index < items.length){  
                next_item = items[index];
                if(next_item.visible===true){
                    return next_item.id;
                }
                index++;
            }
            return undefined;
        }
        return next_item.id;
    }
}

module.exports = {
    GridTableDownloadItem: GridTableDownloadItem
};