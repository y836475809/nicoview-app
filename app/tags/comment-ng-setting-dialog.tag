<comment-ng-setting-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            width: 50vw;
            height: 50vh;
        }

        dialog::backdrop {
            opacity: 0;
        }

        .container {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 30px 1fr 30px;
            grid-template-areas: 
                "header"
                "item1"
                "item2";
        }

        .title-header {
            grid-area: header;
        }

        .params-container {
            grid-area: item1;
            display: flex;
        }

        .button-container {
            grid-area: item2;
            margin: auto;
        }
        
        .comment-ng-grid-container ,
        .omment-ng-grid{
            width: 100%;
            height: 100%;
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
            <div class="title-header">test</div>
            <div class="params-container center-hv">
                <div class="comment-ng-grid-container">
                    <div class="comment-ng-grid"></div>
                </div>
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
            rowHeight: 25,
            _saveColumnWidth: true,
        };   

        let grid_table = null;
        let deleted_items = [];

        const createMenu = () => {
            const nemu_templete = [
                { label: "NGリストから削除", click() {
                    deleted_items = grid_table.getSelectedDatas();
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        const resizeGridTable = () => {
            const container = this.root.querySelector(".comment-ng-grid-container");
            const new_height =container.clientHeight;
            const new_width = container.clientWidth;
            const new_szie = {
                height: new_height,
                width: new_width
            };
            grid_table.resize(new_szie);
        };

        const setup = (args) => {
            if(grid_table==null){
                grid_table = new GridTable("comment-ng-grid", columns, options);
                grid_table.init(this.root.querySelector(".comment-ng-grid"));
                const context_menu = createMenu();
                grid_table.onContextMenu((e)=>{
                    context_menu.popup({window: remote.getCurrentWindow()});
                });
            }

            deleted_items = [];
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

            resizeGridTable();
        };

        obs.on("comment-ng-setting-dialog:show", (args) => {
            const dialog = this.root.querySelector("dialog");
            dialog.showModal();

            setup(args);
        }); 

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
    </script>
</comment-ng-setting-dialog>