<download-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        .download-grid-container {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
        }
    </style>

    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>

    <script>
        /* globals app_base_dir obs */
        require("slickgrid/lib/jquery.event.drag-2.3.0");
        require("slickgrid/lib/jquery.event.drop-2.3.0");
        require("slickgrid/plugins/slick.rowmovemanager");
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);

        const wait_time = 5;

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130, behavior: "selectAndMove"},
            {id: "id", name: "id", behavior: "selectAndMove"},
            {id: "name", name: "名前", behavior: "selectAndMove"},
            {id: "progress", name: "進歩", behavior: "selectAndMove"}
        ];
        const options = {
            rowHeight: 100,
            enableCellNavigation: true,
            enableColumnReorder: false,
        };
        const grid_table = new GridTable("download-grid", columns, options);

        const resizeGridTable = () => {
            const container = this.root.querySelector(".download-grid-container");
            grid_table.resizeFitContainer(container);
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
            });

            grid_table.grid.registerPlugin(moveRowsPlugin); 

            resizeGridTable();
        });
        
        obs.on("set-download-items", (items) => {
            grid_table.setData(items);
        });

        obs.on("add-download-item", (item) => {
            grid_table.dataView.addItem(item);
        });
        obs.on("delete-download-item", (video_id) => {
            grid_table.dataView.deleteItem(video_id);
        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });

        let d_cancel = false;

        const ff = async (count, do_cancel, on_progress) => {
            for (let index = 0; index < count; index++) {
                if(do_cancel()){
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                on_progress(`${index}/${count}`);
            }   
        };
        const wait = async (do_cancel, on_progress) => {
            for (let index = wait_time; index >= 0; index--) {
                if(do_cancel()){
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                on_progress(`wait ${index}`);
            }   
        };
        obs.on("cancel-download", async() => {
            d_cancel = true;
        });
        obs.on("start-download", async() => {
            d_cancel = false;
            const column_index = grid_table.grid.getColumnIndex("progress");

            const done_video_ids = [];
            let downloading_index = 0;
            let downloading_item = grid_table.dataView.getItemByIdx(downloading_index);
            let video_id = downloading_item.id;
            // const ll = grid_table.dataView.getLength();
            while(!d_cancel){
            // for (let index = 0; index < ll; index++) {
                if(!done_video_ids.includes(video_id)){ 
                    await wait(()=>{return d_cancel;}, (state)=>{ 
                        downloading_index = grid_table.dataView.getRowById(video_id);
                        downloading_item.progress = state;
                        grid_table.grid.updateCell(downloading_index, column_index);
                    });
                    await ff(5, ()=>{return d_cancel;}, (state)=>{ 
                        downloading_index = grid_table.dataView.getRowById(video_id);
                        downloading_item.progress = `${video_id}: ${state}`; 
                        grid_table.grid.updateCell(downloading_index, column_index);
                    });
                    if(d_cancel){
                        downloading_index = grid_table.dataView.getRowById(video_id);
                        downloading_item.progress = "cancel";
                        grid_table.grid.updateCell(downloading_index, column_index);                   
                        break;
                    }  
                    done_video_ids.push(video_id);
                }
                downloading_index++;
                if(downloading_index>=grid_table.dataView.getLength()){
                    break;
                }
                downloading_item = grid_table.dataView.getItemByIdx(downloading_index);
                video_id = downloading_item.id;
            }
        });
    </script>
</download-page>