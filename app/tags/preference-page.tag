<preference-page>
    <style scoped>
        :scope {
            font-size: 12px;
            font-family: Verdana, Geneva, Tahoma, sans-serif;
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
            display: block;
            padding: 5px;
            margin: 10px;
        }
        #library-path{
            width: 300px;
        }
    </style>

    <div class="group">
        <label class="param">Library path</label>
        <input id="library-path" type="text" readonly>
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
    <indicator ref="indicator"></indicator>

    <script>
        /* globals riot obs */
        const fs = require("fs");
        const SQLiteDB = require("../js/sqlite_db");
        const serializer = require("../js/serializer");
        const { remote } = require("electron");
        const { dialog } = require("electron").remote;
        const pref = require("../js/preference");

        require("./indicator.tag");
        riot.mount("indicator");
        
        let self = this;

        const setLibraryPathAtt = (value) => {
            document.getElementById("library-path").setAttribute("value", value);
        };

        this.on("mount", () => {
            const path = pref.getLibraryPath();
            if(!path){
                setLibraryPathAtt("");
            }else{
                setLibraryPathAtt(path);
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

            pref.setLibraryPath(path);
            setLibraryPathAtt(path);
        };

        this.onclickRefreshLibrary = ()=>{
            obs.trigger("on_load_library");
        };

        this.onclickImport = ()=>{
            const db_file_path = selectFileDialog("Sqlite db", ["db"]);
            if(!db_file_path){
                return;
            }

            let db = new SQLiteDB();
            
            function asyncMkDir(data_path) {
                return new Promise((resolve, reject) => {
                    fs.mkdir(data_path, (error)=>{
                        if(error && error.code != "EEXIST"){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                });
            }

            function asyncRead(file_path) {
                // return new Promise(resolve => setTimeout(resolve, 5000));
                return new Promise((resolve, reject) => {
                    db.init(file_path, (error)=>{
                        if(error){
                            reject(error);
                        }else{
                            db.read();
                            resolve();
                        }
                    });
                });
            }
            function asyncSave() {
                return new Promise((resolve, reject) => {
                    const file_path = pref.getLibraryFilePath();
                    const data = new Map([
                        [ "dirpath", [...db.get_dirpath()] ],
                        [ "video", [...db.get_video()] ]
                    ]);

                    serializer.save(file_path, data, (error)=>{
                        if(error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                });
            }

            async function convertPromise() {
                self.refs.indicator.showLoading("Now Loading...");

                const data_path = pref.getDataPath();
                if(!data_path){
                    throw { message:"Library path is empty" };
                }

                await asyncMkDir(data_path);
                await asyncRead(db_file_path);
                await asyncSave();
            }

            convertPromise().then(() => {
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "info",
                    buttons: ["OK"],
                    message: "Conversion complete"
                });
            }).catch((err) => {
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "error",
                    buttons: ["OK"],
                    message: err.message
                });
            }).then(() => {
                self.refs.indicator.hideLoading();
            });
        };
    </script>
</preference-page>