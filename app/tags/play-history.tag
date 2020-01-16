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
        /* globals rootRequire */
        const path = require("path");
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = rootRequire("app/js/gridtable");
        const HistoryStore = rootRequire("app/js/history-store");
        const { BookMark } = rootRequire("app/js/bookmark");
        const { obsTrigger } = rootRequire("app/js/riot-obs");
        const { ConfigRenderer } = rootRequire("app/js/config");
        const { ipcRenderer } = require("electron");
        const { IPC_CHANNEL } = rootRequire("app/js/ipc-channel");

        const obs = this.opts.obs; 
        
        const obs_trigger = new obsTrigger(obs);
        const config_renderer = new ConfigRenderer();

        let history_store = null;
        const row_img_width = 130/2;
        const row_hight = 100/2;

        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.id;
            return `ID: ${video_id}`;
        };

        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130},
            {id: "name", name: "名前", sortable: true},
            {id: "info", name: "情報",sortable: false, formatter:infoFormatter},
            {id: "play_date", name: "再生日", sortable: true},
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
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.playOnline(obs_trigger.Msg.MAIN_PLAY, video_id); 
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

        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".history-grid"));

            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });           

            resizeGridTable();

            try {
                const history_file_path = path.join(await config_renderer.get("data_dir"), "history.json");
                history_store = new HistoryStore(history_file_path, 50);
                history_store.load(); 
                grid_table.setData(history_store.getItems());
            } catch (error) {
                console.log("player history load error=", error);
                grid_table.setData([]); 
            }
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_PLAY_HISTORY, (event, args)=>{
            const { history_item } = args;
            history_store.add(history_item);
            grid_table.setData(history_store.getItems());
        });
    </script>
</play-history>
