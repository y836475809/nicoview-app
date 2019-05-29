<comment-ng-setting>
    <style scoped>
        .comment-ng-grid-container {
            height: calc(100% - 25px);
        }

        .delete-button {
            float: right;
            width: 60px;
            height: 25px;
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
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);

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

            obs.trigger("delete-comment-ng", { ng_texts, ng_user_ids });

            grid_table.deleteItems(items);
            grid_table.clearSelected();
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

        //TODO
        const resizeGridTable = () => {
            const container = this.root.querySelector(".comment-ng-grid-container");
            const new_height = container.clientHeight;
            const new_width = container.clientWidth;
            const new_szie = {
                height: new_height,
                width: new_width
            };
            grid_table.resize(new_szie);
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

            resizeGridTable();
        };

        this.onclickDelete = (e) => {
            deleteSelectedItems();
        };

        obs.on("comment-ng-setting:ng-items", (args) => {
            setup(args);
        });
    </script>
</comment-ng-setting>