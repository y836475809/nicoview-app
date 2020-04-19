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

        .setting-checkbox{
            height: 25px;
            vertical-align:middle;
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
            <label class="section-label">ファイルのインポート</label>
            <button onclick={onclickImportFiles}>ファイル選択</button>
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
        <div class="content">
            <label class="section-label">CSS</label>
            <div style="display: flex;">
                <input disabled=true class="input-path css-path-input" type="text" readonly}>
                <button class="input-button" onclick={onclickSelectcCssPath}>ファイルを選択</button>
                <button class="input-button" onclick={onclickReloadCss}>読み込み</button>
            </div>
        </div>
        <div class="content">
            <input class="setting-checkbox check-window-close" type="checkbox" 
            onclick={onclickCheckWindowClose} /><label>ウィンドウを閉じる時に確認する</label>
        </div>
        <div class="content">
            <label class="section-label">ログ出力レベル設定</label>
            <input class="setting-checkbox check-loglevel-debug" type="checkbox" 
            onclick={onclickCheckLogLevelDebug} /><label>Debug</label>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const { shell, ipcRenderer, remote } = window.electron;
        const { dialog } = remote;
        const path = window.path;
        const fs = window.fs;
        const { DataIpcRenderer } = window.DataIpc;
        const { selectFileDialog, selectFolderDialog, showMessageBox } = window.RemoteDailog;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { ImportLibrary } = window.ImportLibrary;
        
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
            await DataIpcRenderer.action("config", "set", { key:"data_dir", value:dir });
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            await DataIpcRenderer.action("config", "set", { key:"download.dir", value:dir });
        };

        this.onclickOpenDir = async (e) => {
            const dir = await DataIpcRenderer.action("config", "get", { key:"app_setting_dir", value:"" });
            shell.openItem(dir);
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await selectFileDialog("ffmpeg", ["*"]);
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            await DataIpcRenderer.action("config", "set", { key:"ffmpeg_path", value:file_path });
        };

        
        this.onclickSelectcCssPath = async e => {
            const file_path = await selectFileDialog("CSS", ["css"]);
            if(file_path == null){
                return;
            }
            setInputValue(".css-path-input", file_path);
            await DataIpcRenderer.action("config", "set", { key:"css_path", value:file_path });
        };

        this.onclickReloadCss = async e => {
            const elm = this.root.querySelector(".css-path-input");
            const file_path = elm.value;
            await ipcRenderer.invoke(IPC_CHANNEL.RELOAD_CSS, { file_path });
        };

        this.onclickCheckWindowClose = async (e) => {
            const ch_elm = this.root.querySelector(".check-window-close");
            await DataIpcRenderer.action("config", "set", { key:"check_window_close", value:ch_elm.checked });
        };

        this.onclickCheckLogLevelDebug = async (e) => {
            const ch_elm = this.root.querySelector(".check-loglevel-debug");
            let value = "info";
            if(ch_elm.checked === true){
                value = "debug";
            }
            await DataIpcRenderer.action("config", "set", { key:"log.level", value:value });
            await ipcRenderer.invoke(IPC_CHANNEL.LOG_LEVEL, { level:value });
        };

        const setInputValue = (selector, value) => {          
            const elm = this.root.querySelector(selector);
            elm.value = value;
        };

        const setCheckValue = (selector, value) => {          
            const elm = this.root.querySelector(selector);
            elm.checked = value;
        };

        const getDefaultCSSPath = async () => {
            try {
                const css_path = path.join(process.resourcesPath, "setting.css");
                await fs.promises.stat(css_path);
                return css_path;
            } catch(err) {
                return "";
            }
        };

        this.on("mount", async () => {
            setInputValue(".app-setting-dir-input", await DataIpcRenderer.action("config", "get", { key:"app_setting_dir", value:"" })); 
            
            const css_path = await getDefaultCSSPath();
            setInputValue(".css-path-input", await DataIpcRenderer.action("config", "get", { key:"css_path", value:css_path }));   
            
            setInputValue(".data-dir-input", await DataIpcRenderer.action("config", "get",{ key:"data_dir", value:""}));  
            setInputValue(".download-dir-input", await DataIpcRenderer.action("config", "get",{ key:"download.dir", value:""}));
            setInputValue(".ffmpeg-path-input", await DataIpcRenderer.action("config", "get",{ key:"ffmpeg_path", value:""}));
            setCheckValue(".check-window-close", await DataIpcRenderer.action("config", "get",{ key:"check_window_close", value:true}));
        
            const log_level = await DataIpcRenderer.action("config", "get",{ key:"log.level", value:"info"});
            setCheckValue(".check-loglevel-debug", log_level=="debug");
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
                logger.error(ret.error);
                await showMessageBox("error", `インポート失敗: ${ret.error.message}`);
            }
            this.obs_msg_dialog.trigger("close");
        };

        this.onclickImportFiles = async ()=>{
            const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ["openFile", "multiSelections"],
                title: "ファイルを選択",
                defaultPath: ".",
                filters: [
                    {name: "avi", extensions:  ["mp4", "flv", "swf"]}
                ]
            });
            if(result.canceled===true){
                return;
            }

            let cancel = false;
            const file_paths = result.filePaths;
           
            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
                cb: result=>{
                    cancel = true;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const error_files = [];
            for (let index = 0; index < file_paths.length; index++) {
                if(cancel===true){
                    break;
                }
                const file_path = file_paths[index];
                try {
                    const import_lib = new ImportLibrary(file_path);
                    const item = await import_lib.createLibraryItem();
                    await DataIpcRenderer.action("library", "addItem", { item });
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    logger.error(error);
                    error_files.push(file_path);
                }

                const message = `進歩:${index+1}/${file_paths.length} 失敗:${error_files.length}`;
                this.obs_msg_dialog.trigger("update-message", message);

                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const result_msg = `インポート完了\n失敗:${error_files.length}`;
            await showMessageBox("info", result_msg);
            this.obs_msg_dialog.trigger("close");

            if(error_files.length>0){
                obs.trigger("main-page:toastr", {
                    type: "error",
                    title: `${error_files.length}個がインポートに失敗しました`,
                    message: error_files.join("\n"),
                });
            } 
        };
    </script>
</setting-page>