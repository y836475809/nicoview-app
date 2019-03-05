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
    
    <div class="history-grid-container">
        <div class="history-grid"></div>
    </div>    

    <script>
        /* globals app_base_dir obs */
        const ipc = require("electron").ipcRenderer;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const HistoryStore = require(`${app_base_dir}/js/history_store`);

        const history_file_path = SettingStore.getSystemFile("history.json");
        const history_store = new HistoryStore(history_file_path, 50);

        const row_img_width = 130/2;
        const row_hight = 100/2;

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130},
            {id: "id", name: "id",sortable: true},
            {id: "name", name: "名前", sortable: true},
            {id: "play_date", name: "再生日", sortable: true},
            {id: "play_time", name: "時間", sortable: true},
            {id: "url", name: "url", sortable: true}
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const loadHistoryItems = () => {
            grid_table.setData(history_store.getItems());
        };

        const resizeGridTable = () => {
            const container = this.root.querySelector(".history-grid-container");
            grid_table.resizeFitContainer(container);
        };

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });

        this.on("mount", () => {
            grid_table.init(this.root.querySelector(".history-grid"));

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                const url = data.url;    
                const new_item = {
                    image: data.thumb_img, 
                    id: video_id, 
                    name: data.name, 
                    url: url
                };
                history_store.add(new_item);
                grid_table.setData(history_store.getItems());

                if(!/^(http)/.test(url)){
                    obs.trigger("get-library-data", data.id);  
                }
            });

            resizeGridTable();

            try {
                history_store.load(); 
                grid_table.setData(history_store.getItems());
            } catch (error) {
                console.log("player history load error=", error);
                grid_table.setData([]); 
            }
        });

        obs.on("get-library-data-rep", (library_data) => { 
            ipc.send("request-show-player", library_data);
        });

        obs.on("add-history-items", (item)=> {
            history_store.add(item);
            grid_table.setData(history_store.getItems());
        });
    </script>
</play-history>
