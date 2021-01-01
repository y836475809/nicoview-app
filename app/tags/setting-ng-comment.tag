<setting-ng-comment>
    <style scoped>
        :scope {
            --control-height: 25px;
        }

        .comment-ng-grid-container {
            width: 100%;
            height: calc(300px - var(--control-height));
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
            margin-top: 10px;
        }

        .delete-button:active {
            background-color: var(--control-color);
        }

        .delete-button:hover {
            cursor: pointer;
        }
    </style>

    <div class="setting-section"> 
        <div class="setting-params">
            <div class="comment-ng-grid-container">
                <div class="comment-ng-grid"></div>
            </div>
            <button type="button" class="delete-button" title="選択された項目を削除" 
                onclick={onclickDelete}>削除</button>
        </div>
    </div>

    <script>
        /* globals */
        const { remote } = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;

        const obs_dialog = this.opts.obs;

        const columns = [
            { id: "title", name: "種類" },
            { id: "value", name: "値" },
        ];
        const options = {
            rowHeight: 25,
        };

        let grid_table = null;

        const deleteSelectedItems = () =>{
            const items = grid_table.getSelectedDatas();
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

            obs_dialog.trigger("player-main-page:delete-ng-comment", { 
                ng_texts, ng_user_ids 
            });

            grid_table.deleteItems(items);
        };

        const createMenu = () => {
            const menu_templete = [
                {
                    label: "削除", click() {
                        deleteSelectedItems();
                    }
                }
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const setup = (ng_items) => {
            if (grid_table == null) {
                grid_table = new GridTable("comment-ng-grid", columns, options);
                grid_table.init(".comment-ng-grid");
                grid_table.setupResizer(".comment-ng-grid-container");
                const context_menu = createMenu();
                grid_table.onContextMenu((e) => {
                    context_menu.popup({ window: remote.getCurrentWindow() });
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
            grid_table.setData(items);

            const container = this.root.querySelector(".comment-ng-grid-container");
            grid_table.resizeGrid(container.clientWidth, container.clientHeight); 
        };

        this.onclickDelete = (e) => {
            deleteSelectedItems();
        };

        obs_dialog.on("setting-ng-comment:ng-items", (args) => {
            setup(args);
        });
    </script>
</setting-ng-comment>