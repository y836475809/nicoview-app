<comment-ng-setting>
    <style scoped>
        :scope {
            --control-height: 25px;
        }

        .comment-ng-grid-container {
            width: 100%;
            height: calc(100% - var(--control-height));
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
        }

        .delete-button:active {
            background-color: var(--control-color);
        }

        .delete-button:hover {
            cursor: pointer;
        }
    </style>

    <div class="comment-ng-grid-container">
        <div class="comment-ng-grid"></div>
    </div>
    <button type="button" class="delete-button" onclick={this.onclickDelete}>Delete</button>

    <script>
        /* globals rootRequire */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = rootRequire("app/js/gridtable");

        const obs_dialog = this.opts.obs;

        const columns = [
            { id: "title", name: "種類" },
            { id: "value", name: "値" },
        ];
        const options = {
            rowHeight: 25,
            _saveColumnWidth: true,
        };

        let grid_table = null;

        const deleteSelectedItems = () =>{
            const items = grid_table.getSelectedDatas();
            if(items.length===0){
                return;
            }

            const ng_matching_texts = items.filter(item => {
                return item.type=="text";
            }).map(item => {
                return item.value;
            });
            const ng_user_ids = items.filter(item => {
                return item.type=="user_id";
            }).map(item => {
                return item.value;
            });

            obs_dialog.trigger("player-main-page:delete-comment-ng", { 
                ng_matching_texts, ng_user_ids 
            });

            grid_table.deleteItems(items);
        };

        const createMenu = () => {
            const nemu_templete = [
                {
                    label: "削除", click() {
                        deleteSelectedItems();
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        
        const resizeGridTable = () => {
            const container = this.root.querySelector(".comment-ng-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const setup = (ng_items) => {
            if (grid_table == null) {
                grid_table = new GridTable("comment-ng-grid", columns, options);
                grid_table.init(this.root.querySelector(".comment-ng-grid"));
                const context_menu = createMenu();
                grid_table.onContextMenu((e) => {
                    context_menu.popup({ window: remote.getCurrentWindow() });
                });
            }
            
            const { ng_matching_texts, ng_user_ids } = ng_items;
            const items1 = ng_matching_texts.map((text, index) => {
                return {
                    id: index,
                    title: "コメント",
                    type: "text",
                    value: text
                };
            });

            const base_index = ng_matching_texts.length;
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

            resizeGridTable();
        };

        this.onclickDelete = (e) => {
            deleteSelectedItems();
        };

        obs_dialog.on("comment-ng-setting:ng-items", (args) => {
            setup(args);
        });
    </script>
</comment-ng-setting>