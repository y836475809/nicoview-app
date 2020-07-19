<play-history-page>
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
        const { GridTable, wrapFormatter, buttonFormatter } = window.GridTable;
        const { ButtonCommand } = window.ButtonCommand;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs; 

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await IPCClient.request("downloaditem", "getIncompleteIDs");
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await IPCClient.request("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        ipcRenderer.on("libraryItemAdded", async (event, args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        ipcRenderer.on("libraryItemDeleted", async (event, args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });

        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.id;
            let result = `<div>ID: ${video_id}</div>`;
            if(dataContext.saved){
                result += "<div class='state-content state-saved'>ローカル</div>";
            }
            if(dataContext.reg_download){
                result += "<div class='state-content state-reg-download'>ダウンロード追加</div>";
            }
            return result;
        };

        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130},
            {id: "title", name: "名前", sortable: true, formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報",sortable: false, formatter:infoFormatter},
            {id: "play_date", name: "再生日", sortable: true},
            {id: "url", name: "url", sortable: true}
        ];
        const options = {
            rowHeight: 100,
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const setData = async (items) => {
            const video_ids = await IPCClient.request("downloaditem", "getIncompleteIDs");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await IPCClient.request("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);  
            }
            grid_table.clearSelected();
            grid_table.setData(items);
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    ButtonCommand.play(items[0], false);
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    ButtonCommand.play(items[0], true);
                }},
                { label: "後で見る", click() {
                    const items = grid_table.getSelectedDatas();
                    ButtonCommand.addStackItems(obs, items);
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    ButtonCommand.addBookmarkItems(obs, items);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        this.on("mount", async () => {
            grid_table.init(".history-grid");
            grid_table.setupResizer(".history-grid-container");
            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                    video_id : video_id,
                    time : 0,
                    online: false
                });
            });
            grid_table.onButtonClick(async (e, cmd_id, data)=>{
                if(cmd_id == "play"){
                    ButtonCommand.play(data, false);
                }
                if(cmd_id == "stack"){
                    ButtonCommand.addStackItems(obs, [data]);
                }
                if(cmd_id == "bookmark"){
                    ButtonCommand.addBookmarkItems(obs, [data]);
                }
                if(cmd_id == "download"){
                    ButtonCommand.addDownloadItems(obs, [data]);
                }
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });           

            try {
                const items = await IPCClient.request("history", "getData");
                setData(items);
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
            await IPCClient.request("history", "add", { history_item });
            const items = await IPCClient.request("history", "getData");
            setData(items);
        });
    </script>
</play-history-page>
