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
            padding:2px;
            border: solid 1px #ccc;
            border-radius: 2px;
        }
    </style>

    <div class="setting-page">
        <div class="content">
            <label class="section-label">設定保存場所(*再起動後に有効)</label>
            <div class="component">
                <label class="setting-label">
                    <input type="radio" name="setting-radio" value="userdata"
                        checked={enable_user_data}
                        onchange={onchangeSetting}>UserDataに保存
                </label>    
                <input disabled={!enable_user_data} class="input-path userdata-dir-input" type="text" readonly>
            </div>
            <div class="component">
                <label class="setting-label">
                    <input type="radio" name="setting-radio" value="specify"
                        checked={!enable_user_data}
                        onchange={onchangeSetting}>保存場所を指定
                </label>
                <div style="display: flex;">
                    <input disabled={enable_user_data} class="input-path setting-dir-input" type="text" readonly>
                    <button disabled={enable_user_data} class="input-button" onclick="{onclickSelectSettingDir.bind(this,'setting-dir-input')}">フォルダ選択</button>
                </div>
            </div>
            <button onclick={onclickOpenDir}>設定フォルダを開く</button>
        </div>
        <div class="content">
            <label class="section-label">動画の保存先</label>
            <div style="display: flex;">
                <input class="input-path download-dir-input" type="text" readonly>
                <button class="input-button" onclick="{onclickSelectDownloadDir.bind(this,'download-dir-input')}">フォルダ選択</button>
            </div>
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
        const { remote, shell } = require("electron");
        const { dialog } = require("electron").remote;
        const DBConverter = require(`${app_base_dir}/js/db-converter`);
        const { SettingStore, SettingDirConfig } = require(`${app_base_dir}/js/setting-store`);
        const { FileUtil } = require(`${app_base_dir}/js/file-utils`);
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        const setting_dir_config = new SettingDirConfig();

        this.import_db_mode_items = [
            {title:"差分を追加する", mode:"a"},
            {title:"上書きする", mode:"w"},  
        ];

        this.onchangeSetting = (e) => {
            if(e.target.value=="userdata"){
                this.enable_user_data = true;
            }else{
                this.enable_user_data = false;
                const dir = getInputValue(".setting-dir-input");
                setting_dir_config.setDir(dir);   
            }
            setting_dir_config.enableUserData = this.enable_user_data;
        };

        this.onclickSelectSettingDir = (item, e) => {
            const dir = FileUtil.selectFolderDialog();
            if(dir!==null){
                setting_dir_config.setDir(dir);
                setInputValue(`.${item}`, dir);
            }        
        };

        this.onclickSelectDownloadDir = (item, e) => {
            const dir = FileUtil.selectFolderDialog();
            if(dir!==null){
                setInputValue(`.${item}`, dir);
                SettingStore.setValue("download-dir", dir);
                FileUtil.mkDirp(dir);
            }
        };

        this.onclickOpenDir = (e) => {
            const dir = setting_dir_config.getDir(this.enable_user_data);
            FileUtil.mkDirp(dir);

            shell.openItem(dir);
        };

        this.onchangeImportDBMode = (item, e) => {
            SettingStore.setValue("import-db-mode", item.mode);
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
            setting_dir_config.load();

            setInputValue(".userdata-dir-input", setting_dir_config.getParentDir(true));
            setInputValue(".setting-dir-input", setting_dir_config.getParentDir(false));  
            this.enable_user_data = setting_dir_config.enableUserData;

            const download_dir = SettingStore.getDownloadDir();
            setInputValue(".download-dir-input", download_dir);

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
            setting_dir_config.save();
        };

        const importNNDDDB = async (sqlite_file_path)=>{
            return new Promise(async (resolve, reject) => {
                try {
                    const db_converter = new DBConverter();
                    db_converter.init(sqlite_file_path);
                    db_converter.read();
                    const dir_list = db_converter.get_dirpath();
                    const video_list = db_converter.get_video();
                    resolve({dir_list, video_list});    
                } catch (error) {
                    reject(error);
                }                
            });
        };

        const getImportDBMode = () => {
            const elm = this.root.querySelector("input[name='import-db']:checked");
            return elm.value;
        };

        this.onclickImport = async ()=>{
            const db_file_path = FileUtil.selectFileDialog("Sqlite db", ["db"]);
            if(!db_file_path){
                return;
            }

            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
            });
            //TODO
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const {dir_list, video_list} = await importNNDDDB(db_file_path);
                const mode = getImportDBMode();

                obs.trigger("library-page:import-data", {
                    data: {dir_list, video_list, mode},
                    cb:(error)=>{   
                        if(error){
                            throw error;
                        }else{
                            dialog.showMessageBox(remote.getCurrentWindow(),{
                                type: "info",
                                buttons: ["OK"],
                                message: "インポート完了"
                            });
                        } 
                    }
                });
            } catch (error) {
                console.log(error);
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "error",
                    buttons: ["OK"],
                    message: `インポート失敗: ${error.message}`
                });
            }finally{
                this.obs_msg_dialog.trigger("close");
            }
        };
    </script>
</setting-page>