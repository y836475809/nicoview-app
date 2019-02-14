<play-history>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        #history-grid-container {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
        }
    </style>
    
    <div id="history-grid-container">
        <div id="history-grid"></div>
    </div>    

    <script>
        /* globals obs $ */
        const ipc = require("electron").ipcRenderer;
        const { GridTable } = require("../js/gridtable");

        const row_img_width = 130/2;
        const row_hight = 100/2;

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130},
            {id: "id", name: "id",sortable: true},
            {id: "name", name: "name", sortable: true},
            {id: "play_date", name: "play date", sortable: true},
            {id: "play_time", name: "time", sortable: true},
            {id: "url", name: "url", sortable: true}
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const loadHistoryItems = (history_items) => {
            grid_table.setData(history_items);
        };

        const resizeDataTable = (size) => {
            const container = this.root.querySelector("#history-grid-container");
            const new_height = $(window).height() - container.offsetTop - 5;
            const new_width = container.clientWidth - 5;
            const new_szie = {
                height: new_height,
                width: new_width
            };
            grid_table.resize(new_szie);
        };

        obs.on("resizeEndEvent", (size)=> {
            resizeDataTable(size);
        });

        this.on("mount", () => {
            grid_table.init();

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                const url = data.url;    
                ipc.send("add-history-items", {
                    image: data.thumb_img, 
                    id: video_id, 
                    name: data.name, 
                    url: url
                });
                if(!/^(http)/.test(url)){
                    const library_data = ipc.sendSync("get-library-data", data.id);
                    ipc.send("request-show-player", library_data);
                }
            });

            resizeDataTable();

            ipc.send("get-history-items");
        });

        ipc.on("get-history-items-reply", (event, history_items) => {     
            loadHistoryItems(history_items);
        });
    </script>
</play-history>
