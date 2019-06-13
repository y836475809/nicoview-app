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

        .component {
            display: flex;
            padding-bottom: 5px;
        }

        .section-label {
            display: block;
            /* font-size: 1.2em; */
        }

        .setting-label {
            width: 10em;
            /* width: 150px; */
        }

        .input-path{
            /* width: 300px; */
            width: 40vw;
        }
    </style>

    <div class="setting-page">
        <div class="content">
            <label class="section-label">設定保存場所(*再起動後に有効)</label>
            <div class="component">
                <label class="setting-label">
                    <input type="radio" name="setting-radio" value="userata"
                        checked={!specify_setting_dir}
                        onchange={onchangeSetting}>UserDataに保存
                </label>    
                <input disabled={this.specify_setting_dir} class="input-path userdata-dir-input" type="text" readonly>
            </div>
            <div class="component">
                <label class="setting-label">
                    <input type="radio" name="setting-radio" value="specify"
                        checked={specify_setting_dir}
                        onchange={onchangeSetting}>保存場所を指定
                </label>
                <div style="display: flex;">
                    <input disabled={!this.specify_setting_dir} class="input-path setting-dir-input" type="text" readonly>
                    <button disabled={!this.specify_setting_dir} class="input-button" onclick="{onclickSelectSettingDir.bind(this,'setting-dir-input')}">フォルダ選択</button>
                </div>
            </div>
            <button onclick={onclickOpenSettingDir}>設定フォルダを開く</button>
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
            <label>インポート方法</label>
            <label each={item in import_db_mode_items} >
                <input  type="radio" name="import-db" value={item.mode}
                    onchange={onchangeImportDBMode.bind(this,item)}>{item.title}
            </label>
            <div>
                <button onclick={onclickImport}>DB選択</button>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals app_base_dir riot */
        const path = require("path");
        const { remote, shell } = require("electron");
        const { dialog } = require("electron").remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { FileUtil } = require(`${app_base_dir}/js/file-utils`);
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        this.import_db_mode_items = [
            {title:"差分を追加する", mode:"a"},
            {title:"上書きする", mode:"w"},  
        ];

        this.onchangeSetting = (e) => {
            if(e.target.value=="specify"){
                this.specify_setting_dir = true;
            }else{
                this.specify_setting_dir = false;
                const dir = SettingStore.getUserDataSettingDir();
                FileUtil.mkDirp(dir);    
            }
        };

        const selectDir = (item) => {
            const path = FileUtil.selectFolderDialog();
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
                FileUtil.mkDirp(dir);
            }        
        };

        this.onclickSelectDownloadDir = (item, e) => {
            const dir = selectDir(item);
            if(dir!==null){
                FileUtil.mkDirp(dir);
                SettingStore.setValue("download-dir", dir);
            }
        };

        this.onclickOpenSettingDir = (e) => {
            const dirname = SettingStore.getSettingDirname();
            let parentdir = null;
            if(this.specify_setting_dir===true){
                parentdir = getInputValue(".setting-dir-input");
            }else{
                parentdir = SettingStore.getUserDataSettingDir();
            }
            const dir = path.join(parentdir, dirname);
            FileUtil.mkDirp(dir);

            shell.openItem(dir);
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

        const getInputValue = (selector) => {          
            const elm = this.root.querySelector(selector);
            return elm.value;
        };

        this.on("mount", () => {
            setInputValue(".setting-dir-input", path.dirname(SettingStore.getSettingDir()));
            this.specify_setting_dir = SettingStore.getValue("specify-setting-dir", false);

            setInputValue(".userdata-dir-input", SettingStore.getUserDataDir());

            const library_path = SettingStore.getLibraryDir();
            if(!library_path){
                setLibraryDirAtt("");
            }else{
                setLibraryDirAtt(library_path);
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

        window.onbeforeunload = (e) => {
            SettingStore.setValue("specify-setting-dir", this.specify_setting_dir);

            if(this.specify_setting_dir===true){
                const dir = getInputValue(".setting-dir-input");
                SettingStore.setSettingDir(dir);
            }
        };

        this.onclickSelectLibrarayPath = ()=>{
            const path = FileUtil.selectFolderDialog();
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
            const db_file_path = FileUtil.selectFileDialog("Sqlite db", ["db"]);
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