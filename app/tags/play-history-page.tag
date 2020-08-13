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
        const ipc = window.electron.ipcRenderer;
        const { Menu } = remote;
        const { GridTable, wrapFormatter, buttonFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await ipc.invoke("download:getIncompleteIDs");
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await ipc.invoke("library:has", {video_id});
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
            {id: "play_date", name: "再生日", sortable: true}
        ];
        const options = {
            rowHeight: 100,
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const setData = async (items) => {
            const video_ids = await ipc.invoke("download:getIncompleteIDs");
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await ipc.invoke("library:has", {video_id});
                item.reg_download = video_ids.includes(video_id);  
            }
            grid_table.clearSelected();
            grid_table.setData(items);
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.play(items[0], false);
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.play(items[0], true);
                }},
                { label: "後で見る", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.addStackItems(obs, items);
                }},
                { type: "separator" },
                { label: "ダウンロードに追加", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.addDownloadItems(obs, items);
                }},
                { label: "ダウンロードから削除", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.deleteDownloadItems(obs, items);
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    Command.addBookmarkItems(obs, items);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const loadItems = async () => {
            try {
                const items = await ipc.invoke("history:getItems");
                setData(items);
            } catch (error) {
                logger.error(error);
                ipcRenderer.send(IPC_CHANNEL.SHOW_MESSAGE, {
                    type: "error",
                    title: "再生履歴の読み込み失敗",
                    message: error.message,
                });
            }
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
                    Command.play(data, false);
                }
                if(cmd_id == "stack"){
                    Command.addStackItems(obs, [data]);
                }
                if(cmd_id == "bookmark"){
                    Command.addBookmarkItems(obs, [data]);
                }
                if(cmd_id == "download"){
                    Command.addDownloadItems(obs, [data]);
                }
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });           
            
            await loadItems();
        });
        
        obs.on("play-history-page:reload-items", async ()=>{
            await loadItems();
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_PLAY_HISTORY, async (event, args)=>{
            const { history_item } = args;
            await ipc.invoke("history:addItem", { item:history_item });
            const items = await ipc.invoke("history:getItems");
            setData(items);
        });
    </script>
</play-history-page>
