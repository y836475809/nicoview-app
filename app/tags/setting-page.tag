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
            <input type="button" value="Import" onclick={onclickImport}>
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