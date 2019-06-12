<setting-page>
    <style scoped>
        .setting-page{       
            width: 100%;
            height: 100%;
            padding: 5px;
            background-color: var(--control-color);
        }

        label, input[type='text'], button {
            height: 25px;
        }

        .input-button {
            margin-left: 5px;
        }

        .content {
            margin-bottom: 5px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
        }

        .section-label {
            display: block;
            font-size: 1.2em;
        }

        .input-path{
            width: 300px;
        }
    </style>

    <div class="setting-page">
        <div class="content">
            <label class="section-label">設定保存フォルダ</label>
            <input type="checkbox" checked={this.enable_setting_dir} onclick={this.onclickEnableSettingDirCheck} />
                <label>設定保存フォルダを指定する</label>
            <div style="display: flex;">
                <input disabled={this.enable_setting_dir} class="input-path setting-dir-input" type="text" readonly>
                <button disabled={this.enable_setting_dir} class="input-button" onclick="{onclickSelectSettingDir.bind(this,'setting-dir-input')}">フォルダ選択</button>
            </div>
            <button onclick={onclickOpenSettingDir}>フォルダを表示</button>
        </div>
        <div class="content">
            <label class="section-label">動画の保存先</label>
            <div style="display: flex;">
                <input class="input-path download-dir-input" type="text" readonly>
                <button class="input-button" onclick="{onclickSelectDownloadDir.bind(this,'download-dir-input')}">フォルダ選択</button>
            </div>
        </div>
        <div class="content">
            <label class="section-label">Refresh library</label>
            <button onclick={onclickRefreshLibrary}>Refresh</button>
        </div>
        <div class="content">
            <label class="section-label">NNDD DBのインポート</label>
            <label>インポート方法選択</label>
            <label each={item in import_db_mode_items} >
                <input  type="radio" name="import-db" value={item.mode}
                    onchange={onchangeImportDBMode.bind(this,item)}>{item.title}
            </label>
            <div>
                <button onclick={onclickImport}>DBを選択</button>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals app_base_dir riot */
        const { remote, shell } = require("electron");
        const { dialog } = require("electron").remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        this.import_db_mode_items = [
            {title:"差分を追加する", mode:"a"},
            {title:"上書きする", mode:"w"},  
        ];

        // this.onclickSelectDir = (item, e) => {
        //     const path = selectFolderDialog();
        //     if(!path){
        //         return;
        //     }
        //     const class_name = item;
        //     const elm = this.root.querySelector(`.${class_name}`);
        //     elm.value = path;
        // };

        const selectDir = (item) => {
            const path = selectFolderDialog();
            if(!path){
                return null;
            }

            const class_name = item;
            const elm = this.root.querySelector(`.${class_name}`);
            elm.value = path;

            return path;
        };

        this.onclickSelectSettingDir = (item, e) => {
            const dir = selectDir(item);
            if(dir!==null){
                SettingStore.setSettingDir(dir);
            }        
        };

        this.onclickSelectDownloadDir = (item, e) => {
            const dir = selectDir(item);
            if(dir!==null){
                SettingStore.setValue("download-dir", dir);
            }
        };


        this.onclickEnableSettingDirCheck = (e) => {
            this.enable_setting_dir = e.target.checked;
            SettingStore.setValue("enable-setting-dir", this.enable_setting_dir);
            this.update();
        };

        this.onclickOpenSettingDir = (e) => {
            const dir = SettingStore.getSettingDir();
            shell.showItemInFolder(dir);
        };

        this.onchangeImportDBMode = (item, e) => {
            SettingStore.setValue("import-db-mode", item.mode);
        };

        const setLibraryDirAtt = (value) => {          
            const elm = this.root.querySelector(".download-dir-input");
            elm.value = value;
        };

        const setInputValue = (selector, value) => {          
            const elm = this.root.querySelector(selector);
            elm.value = value;
        };

        this.on("mount", () => {
            setInputValue("setting-dir-input", SettingStore.getSettingDir());
            this.enable_setting_dir = SettingStore.getValue("enable-setting-dir", false);

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