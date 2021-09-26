<play-history-page>
    <style>
        :host {
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
        export default {
            onBeforeMount(props) {
                this.myapi = window.myapi;
                const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
                this.Command = window.Command.Command;

                this.obs = props.obs; 

                this.myapi.ipc.Download.onUpdateItem(async ()=>{
                    const video_ids = await this.myapi.ipc.Download.getIncompleteIDs();
                    const items = this.grid_table.dataView.getItems();

                    for (let i=0; i<items.length; i++) {
                        const item = items[i];
                        const video_id = item.id;
                        item.saved = await this.myapi.ipc.Library.hasItem(video_id);
                        item.reg_download = video_ids.includes(video_id);
                        this.grid_table.dataView.updateItem(video_id, item);    
                    }
                });

                this.myapi.ipc.Library.onAddItem((args) => {
                    const {video_item} = args;
                    const video_id = video_item.id;
                    this.grid_table.updateCells(video_id, { saved:true });
                });

                this.myapi.ipc.Library.onDeleteItem((args) => {
                    const { video_id } = args;
                    this.grid_table.updateCells(video_id, { saved:false });
                });

                this.myapi.ipc.PlayHistory.onUpdateItem(async ()=>{
                    const items = await this.myapi.ipc.PlayHistory.getItems();
                    this.setData(items);
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
                this.grid_table = new GridTable("history-grid", columns, options);

                this.obs.on("play-history-page:reload-items", async ()=>{
                    await this.loadItems();
                });
            },
            async onMounted() {
                const grid_container = this.root.querySelector(".history-grid");
                this.grid_table.init(grid_container);
                this.grid_table.setupResizer(".history-grid-container");
                this.grid_table.onDblClick((e, data)=>{
                    this.Command.play(data, false);
                });
                this.grid_table.onButtonClick(async (e, cmd_id, data)=>{
                    if(cmd_id == "play"){
                        this.Command.play(data, false);
                    }
                    if(cmd_id == "stack"){
                        this.Command.addStackItems(this.obs, [data]);
                    }
                    if(cmd_id == "bookmark"){
                        this.Command.addBookmarkItems(this.obs, [data]);
                    }
                    if(cmd_id == "download"){
                        this.Command.addDownloadItems(this.obs, [data]);
                    }
                });

                this.grid_table.onContextMenu(async (e)=>{
                    const items = this.grid_table.getSelectedDatas();
                    if(items.length==0){
                        return;
                    }
                    await this.myapi.ipc.popupContextMenu("play-history", {items});           
                });           
                
                await this.loadItems();
            },
            async setData(items) {
                const video_ids = await this.myapi.ipc.Download.getIncompleteIDs();
                for (let i=0; i<items.length; i++) {
                    const item = items[i];
                    const video_id = item.id;
                    item.saved = await this.myapi.ipc.Library.hasItem(video_id);
                    item.reg_download = video_ids.includes(video_id);  
                }
                this.grid_table.clearSelected();
                this.grid_table.setData(items);
            },
            async loadItems() {
                try {
                    const items = await this.myapi.ipc.PlayHistory.getItems();
                    this.setData(items);
                } catch (error) {
                    logger.error(error);
                    await this.myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: `再生履歴の読み込み失敗\n${error.message}`
                    });
                }
            }
        };
    </script>
</play-history-page>
