<modal-dialog-listbox>
    <style scoped>
        .container {
            width: 250px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 30px 30px;
            grid-template-areas: 
                "item1"
                "item2"
                "item3";
        }

        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }
        dialog::backdrop {
            opacity: 0;
        }

        .listbox-grid-container {
            grid-area: item1;
            /* color: black;
            user-select: none; */
        } 

        .message {
            grid-area: item2;
            color: black;
            user-select: none;
        } 

        .button-container {
            grid-area: item3;
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
        .item-red {
            color: red
        }
    </style>

    <dialog class="dialog-shadow" oncancel={this.oncancel}>
        <div class="listbox-grid-container">
            <div class="listbox-grid"></div>
        </div>
        <div class="center-hv">
            <p class="message">{this.message}</p>
        </div>
        <div class="container">
            <div class="button-container">
                <div class="button" onclick=this.onclickCancel()>cancel</div>
            </div>
        </div>
    </dialog>

    <script>
        const { GridTable } = window.GridTable;

        const obs_dialog = this.opts.obs;

        let grid_table = null;

        const resultFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(value=="success"){
                return "成功";
            }
            if(value=="fault"){
                const icon_class = "fas fa-times item-red";
                return `<p><i class="${icon_class}"></i>失敗</p>`;
            }

            return "-";
        };
        const columns = [
            { id: "result", name: "結果", formatter:resultFormatter},
            { id: "id", name: "id" },
            { id: "title", name: "title" },
            { id: "path", name: "パス" },
        ];
        const options = {
            rowHeight: 25,
            _saveColumnWidth: true,
        };

        const resizeGridTable = () => {
            const container = this.root.querySelector(".listbox-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const setup = (args) => {
            const { items } = args;
            if (grid_table == null) {
                grid_table = new GridTable("listbox-grid", columns, options);
                grid_table.init(this.root.querySelector(".listbox-grid"));
                // const context_menu = createMenu();
                // grid_table.onContextMenu((e) => {
                //     context_menu.popup({ window: remote.getCurrentWindow() });
                // });
            } 

            grid_table.setData(items);
            resizeGridTable();
        };

        obs_dialog.on("setup", (args) => {
            setup(args);
        });

        obs_dialog.on("show", async (args) => {
            const { message, cb } = args;
            this.message = message;
            this.cb = cb;

            this.update();

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        });

        obs_dialog.on("update", (args) => {
            const { video_id, result, message} = args;
            this.message = message;
            grid_table.updateCell(video_id, "result", result);
            this.update();
        });

        obs_dialog.on("close", () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        });

        this.onclickCancel = (e) =>{
            if(this.cb){
                this.cb();
            }
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };

        this.on("mount", async () => {

        });
    </script>
</modal-dialog-listbox>