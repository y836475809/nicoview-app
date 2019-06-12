<setting-page>
    <style scoped>
        :scope {
            margin: 0;
            width: 100%;
            height: 100%;
        }

        .setting-page{
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        .display-none{
            display: none;
        }
        button, input, select, textarea {
            font-family : inherit;
            font-size   : 100%;
        }
        .param{
            display: block;
            margin: 5px;
        }
        .group{
            padding: 5px;
        }
        #library-dir{
            width: 300px;
        }
    </style>

    <div class="setting-page">
        <div class="group">
            <label class="param">Library dir</label>
            <input id="library-dir" type="text" readonly>
            <input type="button" value="Select" onclick={onclickSelectLibrarayPath}>
        </div>
        <div class="group">
            <label class="param">Refresh library</label>
            <input type="button" value="Refresh" onclick={onclickRefreshLibrary}>
        </div>
        <div class="group">
            <label class="param">Import db</label>
            <label each={item in import_db_mode_items} >
                <input type="radio" name="import-db" value={item.mode}
                    onchange={onchangeImportDBMode.bind(this,item)}>{item.title}
            </label>
            <button onclick={onclickImport}>インポートするDBを開く</button>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals app_base_dir riot */
        const { remote } = require("electron");
        const { dialog } = require("electron").remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        this.import_db_mode_items = [
            {title:"差分を追加", mode:"a"},
            {title:"上書き", mode:"w"},  
        ];

        this.onchangeImportDBMode = (item, e) => {
            SettingStore.setValue("import-db-mode", item.mode);
        };

        const setLibraryDirAtt = (value) => {
            document.getElementById("library-dir").setAttribute("value", value);
        };

        this.on("mount", () => {
            const path = SettingStore.getLibraryDir();
            if(!path){
                setLibraryDirAtt("");
            }else{
                setLibraryDirAtt(path);
            } 

            const elms = this.root.querySelectorAll("input[name='import-db']");
            const import_db_mode = SettingStore.getValue("import-db-mode", "a");
            try {
                const index = this.import_db_mode_items.findIndex(
                    item => item.mode === import_db_mode);
                if(index<0){
                    throw new Error(`${import_db_mode} is unkown import-db-mode`); 
                }  
                elms[index].checked = true;   
            } catch (error) {
                console.log(error);
                elms[0].checked = true;
                SettingStore.setValue("import-db-mode", "a");
            }
        });

        const selectFileDialog = (name, extensions)=>{
            const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ["openFile"],
                title: "Select",
                defaultPath: ".",
                filters: [
                    {name: name, extensions: extensions}, 
                    {name: "All", extensions: ["*"]},
                ]
            });
            if(paths){
                return paths[0];
            }
            return null;
        };

        const selectFolderDialog = ()=>{
            const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ["openDirectory"],
                title: "Select",
                defaultPath: "."
            });
            if(paths){
                return paths[0];
            }
            return null;
        };

        this.onclickSelectLibrarayPath = ()=>{
            const path = selectFolderDialog();
            if(!path){
                return;
            }
            setLibraryDirAtt(path);

            SettingStore.setLibraryDir(path);
        };

        this.onclickRefreshLibrary = ()=>{
            obs.trigger("library-page:refresh");
        };

        this.onclickImport = async ()=>{
            // const elms = this.root.querySelector("input[name='import-db']:checked");
            // console.log(elms.value);
            // return;
            const db_file_path = selectFileDialog("Sqlite db", ["db"]);
            if(!db_file_path){
                return;
            }

            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
            });
            //TODO
            await new Promise(resolve => setTimeout(resolve, 100));

            obs.trigger("library-page:import-library-from-sqlite", 
                {
                    file_path: db_file_path,
                    cb:(error)=>{   
                        if(error){
                            console.log(error);
                            dialog.showMessageBox(remote.getCurrentWindow(),{
                                type: "error",
                                buttons: ["OK"],
                                message: error.message
                            });
                        }else{
                            dialog.showMessageBox(remote.getCurrentWindow(),{
                                type: "info",
                                buttons: ["OK"],
                                message: "Conversion complete"
                            });
                        }

                        this.obs_msg_dialog.trigger("close");
                    }
                }
            );
        };
    </script>
</setting-page>