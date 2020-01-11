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
                <label class="setting-label" title={this.setting_path_desc}>
                    <input type="radio" name="setting-radio" value="userdata"
                        checked={enable_user_data}
                        onchange={onchangeSetting}>UserDataに保存
                </label>    
                <input disabled={!enable_user_data} class="input-path userdata-dir-input" type="text" readonly title={this.setting_path_desc}>
            </div>
            <div class="component">
                <label class="setting-label" title={this.setting_path_desc}>
                    <input type="radio" name="setting-radio" value="specify"
                        checked={!enable_user_data}
                        onchange={onchangeSetting}>保存場所を指定
                </label>
                <div style="display: flex;">
                    <input disabled={enable_user_data} class="input-path setting-dir-input" type="text" readonly title={this.setting_path_desc}>
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
            <button onclick={onclickImport}>DB選択</button>
        </div>
        <div class="content">
            <label class="section-label" title={this.ffmpeg_path_desc}>ffmpeg実行ファイルのパス</label>
            <div style="display: flex;">
                <input class="input-path ffmpeg-path-input" type="text" readonly title={this.ffmpeg_path_desc}>
                <button class="input-button" onclick="{onclickSelectffmpegPath.bind(this,'ffmpeg-path-input')}" title={this.ffmpeg_path_desc}>
                    ファイル選択
                </button>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals rootRequire riot */
        const { shell } = require("electron");
        const DBConverter = rootRequire("app/js/db-converter");
        const { SettingStore, SettingDirConfig } = rootRequire("app/js/setting-store");
        const { selectFileDialog, selectFolderDialog, showMessageBox } = rootRequire("app/js/remote-dialogs");
        const { FileUtils } = rootRequire("app/js/file-utils");

        this.setting_path_desc = "ここに設定保存用フォルダ「setting」を作成";
        this.ffmpeg_path_desc = "保存済みflv, swfをmp4に変換するffmpegのパスを設定";
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();
        const main_store = storex.get("main");

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

        this.onclickSelectSettingDir = async (item, e) => {
            const dir = await selectFolderDialog();
            if(dir!==null){
                setting_dir_config.setDir(dir);
                setInputValue(`.${item}`, dir);
            }        
        };

        this.onclickSelectDownloadDir = async (item, e) => {
            const dir = await selectFolderDialog();
            if(dir!==null){
                setInputValue(`.${item}`, dir);
                SettingStore.setValue("download-dir", dir);
                FileUtils.mkDirp(dir);
            }
        };

        this.onclickOpenDir = (e) => {
            const dir = setting_dir_config.getDir(this.enable_user_data);
            FileUtils.mkDirp(dir);

            shell.openItem(dir);
        };

        this.onclickSelectffmpegPath = async (item, e) => {
            const file_path = await selectFileDialog("ffmpeg", ["*"]);
            if(!file_path){
                return;
            }
            setInputValue(`.${item}`, file_path);
            SettingStore.setValue("ffmpeg-path", file_path);
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

            const ffmpeg_file_path = SettingStore.getValue("ffmpeg-path", "");
            setInputValue(".ffmpeg-path-input", ffmpeg_file_path);
        });

        window.onbeforeunload = (e) => {
            setting_dir_config.save();
        };

        const importNNDDDB = async (sqlite_file_path)=>{
            const db_converter = new DBConverter();
            db_converter.init(sqlite_file_path);
            db_converter.read();
            const dir_list = db_converter.get_dirpath();
            const video_list = db_converter.get_video();
            return { dir_list, video_list };
        };

        const getImportDBMode = () => {
            const elm = this.root.querySelector("input[name='import-db']:checked");
            return elm.value;
        };

        this.onclickImport = async ()=>{
            const db_file_path = await selectFileDialog("Sqlite db", ["db"]);
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
                await main_store.action("setLibraryData", 
                    SettingStore.getSettingDir(),
                    dir_list, video_list);

                await showMessageBox("info", "インポート完了");
            } catch (error) {
                console.log(error);
                await showMessageBox("error", `インポート失敗: ${error.message}`);
            }finally{
                this.obs_msg_dialog.trigger("close");
            }
        };
    </script>
</setting-page>