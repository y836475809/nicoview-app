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
    <modal-dialog ref="message-dialog"></modal-dialog>

    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { dialog } = require("electron").remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        
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
            obs.trigger("refresh_library");
        };

        this.onclickImport = ()=>{
            const db_file_path = selectFileDialog("Sqlite db", ["db"]);
            if(!db_file_path){
                return;
            }

            this.refs["message-dialog"].showModal("インポート中...");
            obs.trigger("import-library-from-sqlite", db_file_path);
        };

        obs.on("import-library-from-sqlite-rep", (error) => { 
            if(error){
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
            this.refs["message-dialog"].close();
        });
    </script>
</setting-page>