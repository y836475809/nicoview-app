<comment-ng-setting-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }

        dialog::backdrop {
            opacity: 0;
        }

        .container {
            width: 280px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 30px;
            grid-template-areas: 
                "item1"
                "item2";
        }

        .params-container {
            grid-area: item1;
            display: flex;
        }

        .button-container {
            grid-area: item2;
            margin: auto;
        }
        
        .button { 
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
        }   
    </style>

    <dialog class="dialog-shadow">
        <div class="container">
            <div class="comment-ng-grid-container">
                <div class="comment-ng-grid"></div>
            </div>
            <div class="button-container">
                <div class="button" onclick="{this.onclickButton.bind(this,'ok')}">ok</div>
                <div class="button" onclick="{this.onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div>
    </dialog>

    <script> 
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);

        const columns = [
            {id: "title", name: "種類"},
            {id: "value", name: "値"},
        ];
        const options = {
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("comment-ng-grid", columns, options);

        let deleted_items = [];
        const createMenu = () => {
            const nemu_templete = [
                { label: "NGリストから削除", click() {
                    deleted_items = grid_table.getSelectedDatas();
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".comment-ng-grid"));
            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            resizeGridTable();
        });

        const resizeGridTable = () => {
            const container = this.root.querySelector(".comment-ng-grid-container");
            grid_table.resizeFitContainer(container);
        };

        obs.on("comment-ng-setting-dialog:show", (args) => {
            showModal(args);
        });

        const showModal = (args) => {
            const { ng_texts, ng_user_ids } = args;

            const items1 = ng_texts.map((text, index)=>{
                return {
                    id: index,
                    title:"コメント",
                    type:"text",
                    value: text
                };
            });

            const base_index = ng_texts.length;
            const items2 = ng_user_ids.map((user_id, index)=>{
                return {
                    id: index + base_index,
                    title:"ユーザーID",
                    type:"user_id",
                    value: user_id
                };
            });
            const items = items1.concat(items2);
            grid_table.setData(items);

            deleted_items = [];

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        };

        const close = () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        this.onclickButton = (result, e) =>{
            if(result=="ok"){
                const text_items = deleted_items.filter(items => {
                    return items.type == "text";
                });
                const user_id_items = deleted_items.filter(items => {
                    return items.type == "user_id";
                });

                const ng_texts = text_items.map(item=>{ return item.value; }); 
                const ng_user_ids = user_id_items.map(item=>{ return item.value; }); 
                obs.trigger("delete-comment-ng", { 
                    ng_texts, 
                    ng_user_ids 
                });
            }
            close();
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>
</comment-ng-setting-dialog>