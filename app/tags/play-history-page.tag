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
        const myapi = window.myapi;
        const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
        const { Command } = window.Command;

        const obs = this.opts.obs; 

        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });

        myapi.ipc.PlayHistory.onUpdateItem(async ()=>{
            const items = await myapi.ipc.PlayHistory.getItems();
            setData(items);
        });

        const history_infoFormatter = infoFormatter.bind(this, 
            (value, dataContext)=>{ 
                return `<div>ID: ${dataContext.id}</div>`;
            });

        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130},
            {id: "title", name: "名前", sortable: true, formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報",sortable: false, formatter:history_infoFormatter},
            {id: "play_date", name: "再生日", sortable: true}
        ];
        const options = {
            rowHeight: 100,
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const setData = async (items) => {
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);  
            }
            grid_table.clearSelected();
            grid_table.setData(items);
        };

        const loadItems = async () => {
            try {
                const items = await myapi.ipc.PlayHistory.getItems();
                setData(items);
            } catch (error) {
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `再生履歴の読み込み失敗\n${error.message}`
                });
            }
        };

        this.on("mount", async () => {
            const grid_container = this.root.querySelector(".history-grid");
            grid_table.init(grid_container);
            grid_table.setupResizer(".history-grid-container");
            grid_table.onDblClick((e, data)=>{
                Command.play(data, false);
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

            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas();
                if(items.length==0){
                    return;
                }
                await myapi.ipc.popupContextMenu("play-history", {items});           
            });           
            
            await loadItems();
        });
        
        obs.on("play-history-page:reload-items", async ()=>{
            await loadItems();
        });
    </script>
</play-history-page>
