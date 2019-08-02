<play-history>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        .history-grid-container {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
    </style>
    
    <div class="history-grid-container">
        <div class="history-grid"></div>
    </div>    

    <script>
        /* globals app_base_dir */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const HistoryStore = require(`${app_base_dir}/js/history-store`);
        const { BookMark } = require(`${app_base_dir}/js/bookmark`);

        const obs = this.opts.obs; 

        const history_file_path = SettingStore.getSettingFilePath("history.json");
        const history_store = new HistoryStore(history_file_path, 50);

        const row_img_width = 130/2;
        const row_hight = 100/2;

        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130},
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

        const createMenu = () => {
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs.trigger("main-page:play-by-videoid", video_id);
                }},
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.name, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        obs.on("window-resized", ()=> {
            resizeGridTable();
        });

        this.on("mount", () => {
            grid_table.init(this.root.querySelector(".history-grid"));

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                obs.trigger("main-page:play-by-videoid", video_id);
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
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

        obs.on("history-page:add-item", (item)=> {
            history_store.add(item);
            grid_table.setData(history_store.getItems());
        });
    </script>
</play-history>
