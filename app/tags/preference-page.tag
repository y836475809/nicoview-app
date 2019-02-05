<preference-page>
    <style scoped>
        :scope {
            position: absolute;
            z-index: 9999; 
        }
        .pref-container{
            position: absolute;
            width: 100vw;
            height: 100vh;
            margin: 0;
            background-color:black;
            opacity: 0.95;
        }
        .pref-page{
            --pref-container-margin: 25px;
            position: absolute;
            top: var(--pref-container-margin);
            left: var(--pref-container-margin);
            width: calc(100vw - var(--pref-container-margin) * 2);
            height: calc(100vh - var(--pref-container-margin) * 2);
            display: block;
            background-color: var(--control-color);
            border: 1px solid var(--control-border-color);
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
            /* display: flex; */
            padding: 5px;
            margin: 10px;
        }
        #library-dir{
            width: 300px;
        }
        .pref-close-btn{
            position: absolute;
            width: 25px;
            height: 25px;
            top: 5px;
            left: calc(100% - 30px);            
        }
        .pref-checkbox{
            height: 25px;
            vertical-align:middle;
        }
    </style>

    <div class={ this.isloading === true ? "pref-container" : "display-none" }>
            <div class="pref-page">
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
    <div class="group">
        <input class="pref-checkbox play-org-size" type="checkbox" onclick={onclickPlayOrgSizeCheck} />
        <label>play with original size of video</label>
    </div>
    <button class="pref-close-btn" type="button" onclick={onclickClose}>x</button>
    </div>
</div>
    <indicator ref="indicator"></indicator>

    <script>
        /* globals riot obs */
        const fs = require("fs");
        const SQLiteDB = require("../js/sqlite_db");
        const serializer = require("../js/serializer");
        const { ipcRenderer, remote } = require("electron");
        const { dialog } = require("electron").remote;

        require("./indicator.tag");
        riot.mount("indicator");
        
        this.isloading = false;
        let self = this;

        const setLibraryDirAtt = (value) => {
            document.getElementById("library-dir").setAttribute("value", value);
        };

        this.on("mount", () => {
            const path = ipcRenderer.sendSync("getPreferences","library_dir");
            if(!path){
                setLibraryDirAtt("");
            }else{
                setLibraryDirAtt(path);
            } 

            let play_org_size_ch = this.root.querySelector(".pref-checkbox.play-org-size");
            play_org_size_ch.checked = ipcRenderer.sendSync("getPreferences", "play_org_size");
        });

        obs.on("on_change_show_pref_page", (is_show)=> {
            this.isloading = is_show;
            this.update();
        });

        this.onclickClose = () => {
            this.isloading = false;
            this.update();            
        };

        this.onclickPlayOrgSizeCheck = (e) => {
            ipcRenderer.send("setPreferences", { key:"play_org_size", value: e.target.checked});
        };

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

            ipcRenderer.send("setPreferences", { key:"library_dir", value: path});
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
                    const file_path = ipcRenderer.sendSync("getPreferences", "library_file");
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

                const data_path = ipcRenderer.sendSync("getPreferences", "data_dir");
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