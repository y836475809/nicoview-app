<download-list>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }

        .control-container,
        .download-grid-container {
            background-color: var(--control-color);
        }
    </style>

    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>

    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        require("slickgrid/lib/jquery.event.drag-2.3.0");
        require("slickgrid/lib/jquery.event.drop-2.3.0");
        require("slickgrid/plugins/slick.rowmovemanager");
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { DownloadItemStore } = require(`${app_base_dir}/js/download-item-store`);

        const donwload_item_store = new DownloadItemStore(SettingStore.getSystemFile("download.json"));

        const wait_time = 5;

        const donwload_state = Object.freeze({
            wait: 0,
            downloading: 1,
            complete: 2,
            error: 3
        });

        const message_map = new Map([
            [donwload_state.wait, "待機"],
            [donwload_state.downloading, "ダウンロード中"],
            [donwload_state.complete, "ダウンロード完了"],
            [donwload_state.error, "ダウンロード失敗"],
        ]);

        //TODO
        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
            const msg = message_map.get(value);
            const content = `<div>${msg}</div><div>${dataContext.progress}</div>`;
            return content;
        };

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130, behavior: "selectAndMove"},
            {id: "id", name: "id", behavior: "selectAndMove"},
            {id: "name", name: "名前", behavior: "selectAndMove"},
            {id: "state", name: "状態", behavior: "selectAndMove", formatter:htmlFormatter}
        ];
        const options = {
            rowHeight: 100,
            enableCellNavigation: true,
            enableColumnReorder: false,
            _saveColumnWidth: true
        };
        const grid_table = new GridTable("download-item-grid", columns, options);

        const resizeGridTable = () => {
            const container = this.root.querySelector(".download-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const hasItem = (id) => {
            return grid_table.dataView.getRowById(id) !== undefined;
        };

        const save = () => {
            donwload_item_store.setItems(grid_table.dataView.getItems()); 
            donwload_item_store.save(); 
        };

        const filter = (item) => {
            return item["visible"]===true;
        };

        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".download-grid"));
            
            grid_table.dataView.onRowCountChanged.subscribe((e, args) => {
                grid_table.grid.updateRowCount();
                grid_table.grid.render();
            });

            grid_table.dataView.onRowsChanged.subscribe((e, args) => {
                grid_table.grid.invalidateRows(args.rows);
                grid_table.grid.render();
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
                let data = grid_table.dataView.getItems();
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

                grid_table.grid.resetActiveCell();
                grid_table.dataView.beginUpdate();
                grid_table.dataView.setItems(data);
                grid_table.dataView.endUpdate();

                grid_table.grid.setSelectedRows(selectedRows);

                save();
            });

            grid_table.grid.registerPlugin(moveRowsPlugin); 

            grid_table.onContextMenu((e)=>{
                this.opts.contextmenu.popup({window: remote.getCurrentWindow()});
            });

            grid_table.onDblClick((e, data)=>{
                obs.trigger("main-page:play-by-videoid", data.id);
            });

            try {
                donwload_item_store.load(); 
                grid_table.setData(donwload_item_store.getItems());
            } catch (error) {
                console.log("donwload item load error=", error);
                grid_table.setData([]); 
            }
            grid_table.dataView.setFilter(filter);

            resizeGridTable();
        });
        
        obs.on("set-download-items", (items) => {
            grid_table.setData(items);

            save();
        });

        obs.on("download-list:add-download-items", (items) => {
            items.forEach(item => {
                const dv_items = grid_table.dataView.getItems();
                const fd_item = dv_items.find(value=>{
                    return value.id == item.id;
                });
                if(fd_item===undefined){
                    item["visible"] = true;
                    item["state"] = donwload_state.wait;
                    item["progress"] = "";
                    grid_table.dataView.addItem(item);
                }else{
                    grid_table.dataView.deleteItem(fd_item.id);
                    fd_item["visible"] = true;
                    fd_item["state"] = donwload_state.wait;
                    fd_item["progress"] = "";
                    grid_table.dataView.addItem(fd_item);
                }
            });

            grid_table.dataView.refresh();
            save();
        });

        obs.on("download-list:delete-download-items", (video_ids) => {
            video_ids.forEach(video_id => {
                if(hasItem(video_id)){
                    const item = grid_table.dataView.getItemById(video_id);
                    item.visible = false;
                }
            });
            grid_table.dataView.refresh();
            save();
        });

        obs.on("download-list:delete-selected-items", (cb) => {
            const items = grid_table.getSelectedDatas();
            items.forEach(value => {
                const item = grid_table.dataView.getItemById(value.id);
                item.visible = false;
            });
            grid_table.dataView.refresh();
            grid_table.grid.setSelectedRows([]);
            grid_table.grid.resetActiveCell();
            save();

            const ids = items.map(value => {
                return value.id;
            });
            cb(ids);
        });

        obs.on("download-list:clear-downloaded-items", () => {
            const items = grid_table.dataView.getItems();
            items.forEach(item => {
                if(item.state === donwload_state.complete){
                    grid_table.dataView.deleteItem(item.id);
                }
            });
            save();
        });

        obs.on("get-download-item-callback", (cb) => {
            const items = grid_table.dataView.getItems();
            const id_set = new Set();
            items.forEach(value => {
                if(value.visible){
                    id_set.add(value.id);
                }
            });   
            cb(id_set);
        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });

        const wait = async (do_cancel, on_progress) => {
            for (let index = wait_time; index >= 0; index--) {
                if(do_cancel()){
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                on_progress(`wait ${index}`);
            }   
        };

        const updateGridItem = (video_id, progress, state) =>{
            const row_index = grid_table.dataView.getRowById(video_id);
            if(row_index===undefined){
                return;
            }
            const column_index = grid_table.grid.getColumnIndex("state");     
            const item = grid_table.dataView.getItemById(video_id);
            if(item.visible===false){
                return;
            }
            item.progress = progress;
            item.state = state;
            grid_table.grid.updateCell(row_index, column_index);
        };

        const canDownload = (video_id) =>{
            const items = grid_table.dataView.getItems();
            const f = items.find(value=>{
                return value.id == video_id;
            });
            if(f===undefined){
                return false;
            }
            if(f.visible===false){
                return false;
            }
            return f.state === donwload_state.wait;
        };

        const getNextVideoID = (video_id) => {
            const items = grid_table.dataView.getItems();
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
        };

        let d_cancel = false;

        obs.on("cancel-download", async() => {
            d_cancel = true;
        });
        obs.on("start-download", async(download) => {
            d_cancel = false;
            const first_item = grid_table.dataView.getItemByIdx(0);
            let video_id = first_item.id;
            while(!d_cancel){
                if(!canDownload(video_id)){
                    video_id = getNextVideoID(video_id);
                    if(video_id===undefined){
                        break;
                    }
                    if(video_id===false){
                        continue;
                    }   
                }
                await wait(()=>{ return d_cancel || !hasItem(video_id);}, 
                    (progress)=>{ 
                        updateGridItem(video_id, progress, donwload_state.wait);
                    });
                if(!hasItem(video_id)){
                    video_id = getNextVideoID(video_id);
                    if(video_id===undefined){
                        break;
                    }
                    continue;
                }
                if(d_cancel){
                    updateGridItem(video_id, "cancel", donwload_state.wait);
                    break;
                }

                const result = await download(video_id, (progress)=>{ 
                    updateGridItem(video_id, `${video_id}: ${progress}`, donwload_state.downloading);
                });
                if(result=="ok"){
                    updateGridItem(video_id, "finish", donwload_state.complete);
                }else if(result=="cancel"){
                    updateGridItem(video_id, "cancel", donwload_state.wait);
                }else if(result=="skip"){
                    updateGridItem(video_id, "skip", donwload_state.wait);
                }else if(result=="error"){
                    updateGridItem(video_id, "error", donwload_state.error);
                }

                save();

                if(d_cancel){               
                    break;
                }

                video_id = getNextVideoID(video_id);
                if(video_id===undefined){
                    break;
                }
            }
        });
    </script>
</download-list>