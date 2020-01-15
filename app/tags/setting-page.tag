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
            <label class="setting-label" title={this.data_path_desc}>データの保存先を指定</label>     
            <div style="display: flex;">
                <input disabled=true class="input-path data-dir-input" type="text" readonly title={this.data_path_desc}>
                <button class="input-button" onclick={onclickSelectDataDir}>フォルダ選択</button>
            </div>
        </div>
        <div class="content">
            <label class="section-label">動画の保存先</label>
            <div style="display: flex;">
                <input disabled=true class="input-path download-dir-input" type="text" readonly>
                <button class="input-button" onclick={onclickSelectDownloadDir}>フォルダ選択</button>
            </div>
        </div>
        <div class="content">
            <label class="section-label">NNDD DBのインポート</label>
            <button onclick={onclickImport}>DB選択</button>
        </div>
        <div class="content">
            <label class="section-label" title={this.ffmpeg_path_desc}>ffmpeg実行ファイルのパス</label>
            <div style="display: flex;">
                <input disabled=true class="input-path ffmpeg-path-input" type="text" readonly title={this.ffmpeg_path_desc}>
                <button class="input-button" onclick={onclickSelectffmpegPath} title={this.ffmpeg_path_desc}>
                    ファイル選択
                </button>
            </div>
        </div>
        <div class="content">
            <label class="section-label">アプリの設定保存フォルダ</label>
            <div style="display: flex;">
                <input disabled=true class="input-path app-setting-dir-input" type="text" readonly}>
                <button class="input-button" onclick={onclickOpenDir}>フォルダを開く</button>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals rootRequire riot */
        const { shell } = require("electron");
        const DBConverter = rootRequire("app/js/db-converter");
        const { ConfigRenderer } = rootRequire("app/js/config");
        const { selectFileDialog, selectFolderDialog, showMessageBox } = rootRequire("app/js/remote-dialogs");

        this.data_path_desc = "ブックマーク、履歴等のデータを保存するフォルダ";
        this.ffmpeg_path_desc = "保存済みflv, swfをmp4に変換するffmpegのパスを設定";
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();
        const main_store = storex.get("main");

        const config_renderer = new ConfigRenderer();

        this.onclickSelectDataDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return;
            }
            setInputValue(".data-dir-input", dir);
            config_renderer.set("data_dir", dir);  
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            config_renderer.set("download_dir", dir);
        };

        this.onclickOpenDir = async (e) => {
            const dir = await config_renderer.get("app_setting_dir", "");
            shell.openItem(dir);
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await selectFileDialog("ffmpeg", ["*"]);
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            config_renderer.set("ffmpeg_path", file_path);
        };

        const setInputValue = (selector, value) => {          
            const elm = this.root.querySelector(selector);
            elm.value = value;
        };

        this.on("mount", async () => {
            setInputValue(".app-setting-dir-input", await config_renderer.get("app_setting_dir", ""));  
            setInputValue(".data-dir-input", await config_renderer.get("data_dir", ""));  
            setInputValue(".download-dir-input", await config_renderer.get("download_dir", ""));
            setInputValue(".ffmpeg-path-input", await config_renderer.get("ffmpeg_path", ""));
        });

        const importNNDDDB = async (sqlite_file_path)=>{
            const db_converter = new DBConverter();
            db_converter.init(sqlite_file_path);
            db_converter.read();
            const dir_list = db_converter.get_dirpath();
            const video_list = db_converter.get_video();
            return { dir_list, video_list };
        };

        this.onclickImport = async ()=>{
            const db_file_path = await selectFileDialog("Sqlite db", ["db"]);
            if(db_file_path == null){
                return;
            }

            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
            });
            //TODO
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const data_path = await config_renderer.get("data_dir", "");
                const {dir_list, video_list} = await importNNDDDB(db_file_path);
                await main_store.action("setLibraryData", data_path, dir_list, video_list);

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