<download-page>
    <style scoped>
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

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130, behavior: "selectAndMove"},
            {id: "id", name: "id", behavior: "selectAndMove"},
            {id: "name", name: "名前", behavior: "selectAndMove"},
            {id: "progress", name: "進歩", behavior: "selectAndMove"}
        ];
        const options = {
            enableCellNavigation: true,
            enableColumnReorder: false,
        };
        const grid_table = new GridTable("download-grid", columns, options);
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
        moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, data) {
            for (let i = 0; i < data.rows.length; i++) {
                if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
                    e.stopPropagation();
                    return false;
                }
            }
            return true;
        });

        moveRowsPlugin.onMoveRows.subscribe(function (e, args) {
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
            // grid.setData(data);
            // grid.setSelectedRows(selectedRows);
            // grid.render();
            grid_table.dataView.beginUpdate();
            grid_table.dataView.setItems(data);
            grid_table.dataView.endUpdate();

            grid_table.grid.setSelectedRows(selectedRows);
        });

        grid_table.grid.registerPlugin(moveRowsPlugin);        
    </script>
</download-page>