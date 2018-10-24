<setting-page>
    <style scoped>
        :scope {
            font-size: 16px;
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
            border-radius: 2px;
            background-color:lightgray;
        }
        label {
            margin-right: 10px;
            width:100px;
            float: left;
        }
    </style>

    <div class="group">
        <label>{this.library}</label><input id="library-path" type="text" readonly>
        <input type="button" value="Select" onclick={onclicklibraryPath}>
    </div>
    <div class="group">
        <label>library</label><input type="button" value="refresh" onclick={onclickRefreshLibrary}>
    </div>
    <div class="group">
        <div class="param">
            <label>db</label><input id="db-path" type="text" readonly>
            <input type="button" value="Select" onclick={onclickDBPath}>
        </div>
        <div class="param">
            <label>dist</label><input id="dist-path" type="text" readonly>
            <input type="button" value="Select" onclick={onclickDistPath}>
        </div>
        
        <input type="button" value="import" onclick={onclickConvertDB}>
    </div>
    <script>
        /* globals obs */
        const path = require("path");
        const SQLiteDB = require("../js/sqlite_db");
        const serializer = require("../js/serializer");
        const { dialog } = require("electron").remote;

        this.library = "library";

        let library_path = null;

        this.on("mount", () => {
            library_path = localStorage.getItem("library.path");
            document.getElementById("library-path").setAttribute("value", library_path);
        });

        const selectFileDialog = (name, extensions)=>{
            const paths = dialog.showOpenDialog(null, {
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
            const paths = dialog.showOpenDialog(null, {
                properties: ["openDirectory"],
                title: "Select",
                defaultPath: "."
            });
            if(paths){
                return paths[0];
            }
            return null;
        };

        this.onclicklibraryPath = ()=>{
            const path = selectFolderDialog();
            if(!path){
                return;
            }
            library_path = path;
            localStorage.setItem("library.path", library_path);
            document.getElementById("library-path").setAttribute("value", library_path);
        };

        this.onclickDBPath = () =>{
            const path = selectFileDialog("Sqlite db", ["db"]);
            if(!path){
                return;
            }
            document.getElementById("db-path").setAttribute("value", path);
        };

        this.onclickDistPath = () =>{
            const path = selectFolderDialog();
            if(!path){
                return;
            }
            document.getElementById("dist-path").setAttribute("value", path);
        };

        this.onclickRefreshLibrary = ()=>{
            obs.trigger("on_load_library");
        };

        this.onclickConvertDB = ()=>{
            const db_file_path = document.getElementById("db-path").value;
            const dist_path = document.getElementById("dist-path").value;

            let db = new SQLiteDB();
            function asyncFunc1() {
                return new Promise((resolve, reject) => {
                    db.init(db_file_path, (error)=>{
                        if(error){
                            reject(error);
                        }else{
                            db.read();
                            resolve();
                        }
                    });
                });
            }
            function asyncFunc2() {
                return new Promise((resolve, reject) => {
                    if(!dist_path){
                        reject({
                            message:"dist_path is empty"
                        });
                    }
                    const dist_file_path = path.join(dist_path, "dirpath.json");
                    serializer.save(dist_file_path, db.get_dirpath(), (error)=>{
                        if(error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                });
            }
            function asyncFunc3() {
                return new Promise((resolve, reject) => {
                    if(!dist_path){
                        reject({
                            message:"dist_path is empty"
                        });
                    }
                    const dist_video_path = path.join(dist_path, "video.json");
                    serializer.save(dist_video_path, db.get_video(), (error)=>{
                        if(error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                });
            }

            async function convertPromise() {
                await asyncFunc1();
                await asyncFunc2();
                await asyncFunc3();
            }
            convertPromise().then(() => {
                dialog.showMessageBox(null,{
                    type: "info",
                    buttons: ["OK"],
                    message: "Conversion complete"
                });
            }).catch((err) => {
                dialog.showMessageBox(null,{
                    type: "error",
                    buttons: ["OK"],
                    message: err.message
                });
            });
        };
    </script>
</setting-page>