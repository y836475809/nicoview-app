<setting-page>
    <style scoped>
    </style>

    <label>library<input id="library-path" type="text" readonly></label>
    <input type="button" value="show" onclick={read}>
    <input type="button" value="refresh" onclick={refresh}>

    <input type="button" value="import" onclick={import_db}>

    <script>
        /* globals obs */
        const path = require("path");
        const fs = require("fs");
        const SQLiteDB = require("../js/sqlite_db");
        const serializer = require("../js/serializer");
        const { dialog } = require("electron").remote;

        let library_path = null;

        this.read = ()=>{
            const dir_paths = dialog.showOpenDialog(null, {
                properties: ["openDirectory"],
                title: "Select",
                defaultPath: "."
            });
            if(!dir_paths){
                return;
            }
            library_path = dir_paths[0];
            document.getElementById("library-path").setAttribute("value", library_path);
        };

        this.refresh = ()=>{
            obs.trigger("on_load_library");
        };

        this.import_db = ()=>{
            const file_paths = dialog.showOpenDialog(null, {
                properties: ["openFile"],
                title: "Select",
                defaultPath: ".",
                filters: [
                    {name: "Sqlite db", extensions: ["db"]}, 
                    {name: "All", extensions: ["*"]},
                ]
            });
            if(!file_paths){
                return;
            }
            const db_file_path = file_paths[0];
            const dist_dir = path.join(library_path, "db");
            console.log(dist_dir);
            fs.mkdir(dist_dir, (err) => {
                if(!err){
                    // const dir_file_path = path.join(dist_dir, "dirpath.json");
                    // const dir_video_path = path.join(dist_dir, "video.json");
                    // let db = new SQLiteDB();
                    // db.init(db_file_path);
                    // db.read();
                    // serializer.save(dir_file_path, db.get_dirpath());
                    // serializer.save(dir_video_path, db.get_video());
                }
            });
        };
    </script>
</setting-page>