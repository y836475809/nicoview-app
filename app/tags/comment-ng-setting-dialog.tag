<comment-ng-setting-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            /* width: 50vw;
            height: 50vh; */
            width: 500px;
            height: 400px;
        }

        dialog::backdrop {
            opacity: 0;
        }

        /* .container {
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
        } */

        .comment-ng-grid-container,
        .omment-ng-grid {
            width: 100%;
            height: calc(100% - 25px);
            /* border: 1px solid var(--control-border-color); */
        }

        .ng-delete-item-button {
            float: right;
            width: 60px;
            height: 25px;
            border-radius: 2px;
            /* background-color: green; */
            /* padding: 20px; */
            text-align: center;
            color: black;
            user-select: none;
            border-style: none;
            border: 1px solid var(--control-border-color);
            
        }
        .ng-delete-item-button:active {
            background-color: var(--control-color);
        }
        .ng-delete-item-button:hover {
            cursor: pointer;
        }
        /* .button {
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer;
            user-select: none;
        } */

        .tab_wrap {
            /* width: 500px; */
            width: 100%;
            height: 100%;
            /* margin: 30px auto; */
        }

        .tab_area {
            width: 100%;
            height: 30px;
            /* font-size: 0; */
            /* margin: 0 10px; */
            top: 20px;
            position: relative;
        }

        .tab_area label {
            width: 100px;
            height: 30px;
            /* margin: 0 5px; */
            display: inline-block;
            padding: 12px 0;
            color: #999;
            background: #ddd;
            text-align: center;
            font-size: 13px;
            cursor: pointer;
            /* transition: ease 0.2s opacity; */
        }

        .tab_area label:hover {
            opacity: 0.5;
        }

        .panel_area {
            width: 100%;
            height: calc(100% - 50px);
            background: #fff;
            top:60px;
            /* border: 1px solid red */
        }

        .tab_panel {
            /* width: 100%; */
            /* width: calc(100% - 25px); */
            /* height: calc(100% - 40px - 30px); */
            /* width: 50vw;
            height: 50vh; */
            /* padding: 80px 0; */
            /* padding-right: 30px; */
            /* display: none; */
            /* display: inline-block; */
            top:65px;
            position: absolute;
            background-color: aliceblue
        }

        .tab_panel p {
            /* font-size: 14px;
            letter-spacing: 1px; */
            /* text-align: center; */
        }

        .tab_area label.active {
            background: #fff;
            color: #000;
        }

        .tab_panel.active {
            display: block;
        }
        .close-button {
            font-size: 15px;
            /* margin-right: auto; */
            float: right;
        }
        .close-button:hover {
            cursor: pointer;
            background-color: lightgray; 
        }

    </style>

    <dialog class="dialog-shadow">
            <!-- <div class="title-header">test</div> -->
        <!-- <div class="close-button">x</div> -->
        <i class="close-button fas fa-times" onclick={this.onclickClose}></i>
        <!-- <div class="container">
            
            <div class="params-container center-hv">
                <div class="comment-ng-grid-container">
                    <div class="comment-ng-grid"></div>
                </div>
            </div>
            <div class="button-container">
                <div class="button" onclick="{this.onclickButton.bind(this,'ok')}">ok</div>
                <div class="button" onclick="{this.onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div> -->
        <!-- <div class="tab_wrap"> -->
            <div class="tab_area">
                <label class="tab1_label" onclick="{this.onclickSelect.bind(this,'tab1')}">tab1</label>
                <label class="tab2_label" onclick="{this.onclickSelect.bind(this,'tab2')}">tab2</label>
                <label class="tab3_label" onclick="{this.onclickSelect.bind(this,'tab3')}">tab3</label>
            </div>
            <div class="panel_area">
                <div class="tab1 tab_panel">
                    <div class="comment-ng-grid-container">
                        <div class="comment-ng-grid"></div>
                    </div>
                    <button type="button" class="ng-delete-item-button">Delete</button>
                </div>
                <div class="tab2 tab_panel">
                    <p>panel2</p>
                </div>
                <div class="tab3 tab_panel">
                    <p>panel3</p>
                </div>
            </div>
        <!-- </div> -->
    </dialog>

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
        let deleted_items = [];

        this.onclickSelect = (page_name, e)=>{
            ["tab1_label","tab2_label","tab3_label"].forEach(value => {
                const elm = this.root.querySelector(`.${value}`);
                elm.classList.remove("active");
            });
            e.target.classList.add("active");

            ["tab1","tab2","tab3"].forEach(value => {
                const page = this.root.querySelector(`.${value}`);
                if(value==page_name){
                    page.style.zIndex = 1;
                }else{
                    page.style.zIndex = 0;
                }  
            });
        };

        const createMenu = () => {
            const nemu_templete = [
                {
                    label: "NGリストから削除", click() {
                        deleted_items = grid_table.getSelectedDatas();
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

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

        const setup = (args) => {
            if (grid_table == null) {
                grid_table = new GridTable("comment-ng-grid", columns, options);
                grid_table.init(this.root.querySelector(".comment-ng-grid"));
                const context_menu = createMenu();
                grid_table.onContextMenu((e) => {
                    context_menu.popup({ window: remote.getCurrentWindow() });
                });
            }

            deleted_items = [];
            const { ng_texts, ng_user_ids } = args;
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

            const tab_label = this.root.querySelector(".tab1_label");
            tab_label.classList.add("active");

            ["tab1","tab2","tab3"].forEach(value => {
                const page = this.root.querySelector(`.${value}`);
                if(value=="tab1"){
                    page.style.zIndex = 1;
                }else{
                    page.style.zIndex = 0;
                }  
            });
        };

        obs.on("comment-ng-setting-dialog:show", (args) => {
            const dialog = this.root.querySelector("dialog");
            dialog.showModal();

            const panel_area = this.root.querySelector(".panel_area");
            ["tab1","tab2","tab3"].forEach(value => {
                const page = this.root.querySelector(`.${value}`);
                page.style.width = panel_area.clientWidth + "px";
                page.style.height = panel_area.clientHeight + "px";
            });
            
            setup(args);
        });

        this.onclickClose = (e) => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        this.onclickButton = (result, e) => {
            // if (result == "ok") {
            //     const text_items = deleted_items.filter(items => {
            //         return items.type == "text";
            //     });
            //     const user_id_items = deleted_items.filter(items => {
            //         return items.type == "user_id";
            //     });

            //     const ng_texts = text_items.map(item => { return item.value; });
            //     const ng_user_ids = user_id_items.map(item => { return item.value; });
            //     obs.trigger("delete-comment-ng", {
            //         ng_texts,
            //         ng_user_ids
            //     });
            // }
            close();
        };
    </script>
</comment-ng-setting-dialog>