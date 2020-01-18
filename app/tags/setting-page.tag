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
        const { shell, ipcRenderer } = require("electron");
        const { ConfigRenderer } = rootRequire("app/js/config");
        const { selectFileDialog, selectFolderDialog, showMessageBox } = rootRequire("app/js/remote-dialogs");
        const { IPC_CHANNEL } = rootRequire("app/js/ipc-channel");
        
        this.data_path_desc = "ブックマーク、履歴等のデータを保存するフォルダ";
        this.ffmpeg_path_desc = "保存済みflv, swfをmp4に変換するffmpegのパスを設定";
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        this.onclickSelectDataDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return;
            }
            setInputValue(".data-dir-input", dir);
            ConfigRenderer.set("data_dir", dir);  
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            ConfigRenderer.set("download.dir", dir);
        };

        this.onclickOpenDir = async (e) => {
            const dir = await ConfigRenderer.get("app_setting_dir", "");
            shell.openItem(dir);
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await selectFileDialog("ffmpeg", ["*"]);
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            ConfigRenderer.set("ffmpeg_path", file_path);
        };

        const setInputValue = (selector, value) => {          
            const elm = this.root.querySelector(selector);
            elm.value = value;
        };

        this.on("mount", async () => {
            setInputValue(".app-setting-dir-input", await ConfigRenderer.get("app_setting_dir", ""));  
            setInputValue(".data-dir-input", await ConfigRenderer.get("data_dir", ""));  
            setInputValue(".download-dir-input", await ConfigRenderer.get("download.dir", ""));
            setInputValue(".ffmpeg-path-input", await ConfigRenderer.get("ffmpeg_path", ""));
        });

        this.onclickImport = async ()=>{
            const db_file_path = await selectFileDialog("Sqlite db", ["db"]);
            if(db_file_path == null){
                return;
            }

            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
            });

            const ret = await ipcRenderer.invoke(IPC_CHANNEL.IMPORT_NNDD_DB, {db_file_path});
            if(ret.result===true){
                await showMessageBox("info", "インポート完了");
            } else {
                console.log(ret.error);
                await showMessageBox("error", `インポート失敗: ${ret.error.message}`);
            }
            this.obs_msg_dialog.trigger("close");
        };
    </script>
</setting-page>