<setting-ng-comment>
    <style>
        :host {
            --control-height: 25px;
            --margin: 5px
        }

        .setting-params {
            width: 100%;
            height: 300px;
        }

        .comment-ng-grid-container {
            width: 100%;
            height: calc(100% - var(--control-height) - var(--margin));
            background-color: white;
        }

        .delete-button {
            float: right;
            width: 60px;
            height: var(--control-height);
            border-radius: 2px;
            text-align: center;
            color: black;
            user-select: none;
            border-style: none;
            border: 1px solid var(--control-border-color);
            margin-top: 5px;
        }

        .delete-button:active {
            background-color: var(--control-color);
        }

        .delete-button:hover {
            cursor: pointer;
        }
    </style>

    <div class="setting-section"> 
        <div class="center-v title">NGコメント</div>
        <div class="setting-params">     
            <div class="comment-ng-grid-container">
                <div class="comment-ng-grid"></div>
            </div>
            <button type="button" class="delete-button" title="選択された項目を削除" 
                onclick={onclickDelete}>削除</button>
        </div>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;
        const { GridTable } = window.GridTable;
        const player_obs = riot.obs;

        export default {
            obs_dialog:null,
            grid_table:null,
            onBeforeMount() {
                player_obs.on("setting-ng-comment:ng-items", (args) => {
                    this.setup(args);
                });
            },
            deleteSelectedItems() {
                const items = this.grid_table.getSelectedDatas();
                if(items.length===0){
                    return;
                }

                const ng_texts = items.filter(item => {
                    return item.type=="text";
                }).map(item => {
                    return item.value;
                });
                const ng_user_ids = items.filter(item => {
                    return item.type=="user_id";
                }).map(item => {
                    return item.value;
                });

                player_obs.trigger("player-main-page:delete-ng-comment", { 
                    ng_texts, ng_user_ids 
                });

                this.grid_table.deleteItems(items);
            },
            setup(ng_items) {
                if (this.grid_table == null) {
                    const columns = [
                        { id: "title", name: "種類" },
                        { id: "value", name: "値" },
                    ];
                    const options = {
                        rowHeight: 25,
                    };
                    this.grid_table = new GridTable("comment-ng-grid", columns, options);
                    this.grid_table.init(".comment-ng-grid");
                    this.grid_table.setupResizer(".comment-ng-grid-container");
                    this.grid_table.onContextMenu(async (e) => { // eslint-disable-line no-unused-vars
                        const menu_id = await myapi.ipc.popupContextMenu("player-setting-ngcomment");
                        if(!menu_id){
                            return;
                        }
                        if(menu_id=="delete"){
                            this.deleteSelectedItems();
                        }
                    });
                }
                
                const { ng_texts, ng_user_ids } = ng_items;
                const items1 = ng_texts.map((text, index) => {
                    return {
                        id: index,
                        title: "コメント",
                        type: "text",
                        value: text
                    };
                });

                const base_index = ng_texts.length;
                const items2 = ng_user_ids.map((user_id, index) => {
                    return {
                        id: index + base_index,
                        title: "ユーザーID",
                        type: "user_id",
                        value: user_id
                    };
                });
                const items = items1.concat(items2);
                this.grid_table.setData(items);

                const container = this.$(".comment-ng-grid-container");
                this.grid_table.resizeGrid(container.clientWidth, container.clientHeight); 
            },
            onclickDelete(e) { // eslint-disable-line no-unused-vars
                this.deleteSelectedItems();
            }
        };
    </script>
</setting-ng-comment>