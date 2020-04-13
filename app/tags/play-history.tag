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
        /* globals logger */
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const { BookMark } = window.BookMark;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { DataIpcRenderer } = window.DataIpc;

        const obs = this.opts.obs; 
        
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

        const resizeGridTable = () => {
            const container = this.root.querySelector(".history-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id : video_id,
                        time : 0
                    });
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
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
                ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                    video_id : video_id,
                    time : 0
                });
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });           

            resizeGridTable();

            try {
                const items = await DataIpcRenderer.action("history", "getData");
                grid_table.setData(items);
            } catch (error) {
                logger.error(error);
                obs.trigger("main-page:toastr", {
                    type: "error",
                    title: "再生履歴の読み込み失敗",
                    message: error.message,
                });
                // grid_table.setData([]); 
            }
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_PLAY_HISTORY, async (event, args)=>{
            const { history_item } = args;
            await DataIpcRenderer.action("history", "add", { history_item });
            const items = await DataIpcRenderer.action("history", "getData");
            grid_table.setData(items);
        });
    </script>
</play-history>
