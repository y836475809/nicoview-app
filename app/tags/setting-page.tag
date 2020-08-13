<setting-page>
    <style scoped>
        .setting-page {       
            width: 100%;
            height: 100%;
            overflow: auto;
        }
        
        .setting-page label, 
        .setting-page button {
            height: 25px;
            user-select: none;
        }

        .setting-page button {
            margin-left: 5px;
            cursor: pointer;
        }

        .setting-page input[type='text'] {
            width: 40vw;
            height: 25px;
            border: solid 1px #ccc;
            border-radius: 2px;
            user-select: none;
        }

        .setting-page input[type='checkbox'] {
            height: 25px;
            vertical-align: middle;
        }
        .setting-page input[type='checkbox']:hover {
            cursor: pointer;
        }

        .setting-page .container {
            margin: 10px;
            background-color: white;
            border-radius: 3px;
            border: 1px solid darkgray;
        }

        .setting-page .content {
            padding: 10px;
        }

        .setting-page .title {
            height: 30px;
            border-radius: 3px 3px 0 0;
            padding: 0 10px 0 10px;
            vertical-align: middle;
            background-color: lightblue;
            user-select: none;
        }

        .setting-page .label {
            height: 25px;
            float: left; 
            line-height: 25px;
            user-select: none;
        }

        .setting-page .cache-label {
            min-width: 200px;
            user-select: none;
        }
    </style>

    <div class="setting-page">
        <div class="container">
            <div class="center-v title">ブックマーク, 履歴, DB等の保存先</div> 
            <div class="content" style="display: flex;">
                <input disabled=true class="data-dir-input" type="text" readonly>
                <button title="フォルダ選択" onclick={onclickSelectDataDir}>
                    <i class="far fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">動画の保存先</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="download-dir-input" type="text" readonly>
                <button title="フォルダ選択" onclick={onclickSelectDownloadDir}>
                    <i class="far fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">動画インポート</div>
            <div class="content">
                <div style="display:flex;">
                    <div class="label">動画を選択して動画、コメント、サムネイル、動画情報をインポート</div>
                    <button title="ファイル選択" onclick={onclickImportFiles}>
                        <i class="far fa-file"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">NNDDデータインポート</div>
            <div class="content">
                <div style="display:flex; flex-direction:column; margin-bottom:5px;">
                    <div class="label">NNDDシステムフォルダのパス</div>
                    <div style="display: flex;">
                        <input disabled=true class="nndd-system-path-input" type="text" readonly}>
                        <button title="NNDDシステムフォルダ選択" onclick={onclickNNDDSystemDir}>
                            <i class="far fa-file"></i>
                        </button>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; margin-top:10px;">
                    <div class="label" style="margin-bottom:-5px;">インポートする対象</div>
                    <div style="display: flex;">
                        <label style="margin-right: 10px;" each={item in import_items} >
                            <input type="checkbox" class={item.name} name={item.name} 
                                onclick={onclickCheckNNDDImportItem.bind(this,item)}/>{item.title}
                        </label>
                    </div>
                    <button style="width:120px; margin-top:10px;" onclick={onclickExecNNDDImport}>
                        インポート実行
                    </button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">ffmpeg実行ファイルのパス(保存済みflv, swfを再生可能な形式に変換する)</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="ffmpeg-path-input" type="text" readonly>
                <button title="ファイル選択" onclick={onclickSelectffmpegPath}>
                    <i class="far fa-file"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">設定ファイル(config.json)のフォルダ</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="app-setting-dir-input" type="text" readonly}>
                <button title="フォルダを開く" onclick={onclickOpenDir}>
                    <i class="far fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">CSS</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="css-path-input" type="text" readonly}>
                <button title="ファイル選択" onclick={onclickSelectcCssPath}>
                    <i class="far fa-file"></i>
                </button>
                <button title="読み込み" onclick={onclickReloadCss}>
                    <i class="fas fa-redo-alt"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="content">
                <input class="check-window-close" type="checkbox" 
                onclick={onclickCheckWindowClose} /><label>ウィンドウを閉じる時に確認する</label>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">アプリのキャッシュ</div>
            <div class="content">
                <div style="display: flex;">
                <div class="center-v cache-label">キャッシュサイズ {cache_size}</div>
                    <button onclick={onclickGetCacheSize}>キャッシュサイズ取得</button>
                    <button onclick={onclickclearCache}>キャッシュクリア</button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">ログ出力レベル設定</div>
            <div class="content">
                <input class="check-loglevel-debug" type="checkbox" 
                onclick={onclickCheckLogLevelDebug} /><label>Debug</label>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_msg_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const { shell, ipcRenderer, remote } = window.electron;
        const ipc = window.electron.ipcRenderer;
        const { dialog } = remote;
        const path = window.path;
        const fs = window.fs;
        const { selectFileDialog, selectFolderDialog, showMessageBox } = window.RendererDailog;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { ImportLibrary } = window.ImportLibrary;
        const { ImportNNDDData } = window.ImportNNDDData;
        
        const obs = this.opts.obs; 
        this.obs_msg_dialog = riot.observable();

        this.cache_size = "--MB";
        this.import_items = ImportNNDDData.getItems();

        this.onclickSelectDataDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return;
            }
            setInputValue(".data-dir-input", dir);
            await ipc.invoke("config:set", { key:"data_dir", value:dir });
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            await ipc.invoke("config:set", { key:"download.dir", value:dir });
        };

        this.onclickOpenDir = async (e) => {
            const dir = await ipc.invoke("config:get", { key:"app_setting_dir", value:"" });
            shell.openItem(dir);
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await selectFileDialog("ffmpeg", ["*"]);
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            await ipc.invoke("config:set", { key:"ffmpeg_path", value:file_path });
        };

        
        this.onclickSelectcCssPath = async e => {
            const file_path = await selectFileDialog("CSS", ["css"]);
            if(file_path == null){
                return;
            }
            setInputValue(".css-path-input", file_path);
            await ipc.invoke("config:set", { key:"css_path", value:file_path });
        };

        this.onclickReloadCss = async e => {
            const elm = this.root.querySelector(".css-path-input");
            const file_path = elm.value;
            await ipc.invoke("setting:reload-css", { file_path });
        };

        this.onclickCheckWindowClose = async (e) => {
            const ch_elm = this.root.querySelector(".check-window-close");
            await ipc.invoke("config:set", { key:"check_window_close", value:ch_elm.checked });
        };

        const getCacheSizeLabel = async () => {
            const size_byte = await ipc.invoke("setting:get-app-cache");
            const mb = 1024**2;
            return `${(size_byte/mb).toFixed(1)}MB`;
        };

        this.onclickGetCacheSize = async (e) => {
            this.cache_size = await getCacheSizeLabel();
            this.update();
        };

        this.onclickclearCache = async (e) => {
            this.obs_msg_dialog.trigger("show", {
                message: "キャッシュクリア中...",
            });
            await new Promise(resolve => setTimeout(resolve, 100));

            await ipc.invoke("setting:clear-app-cache");

            this.obs_msg_dialog.trigger("close");

            this.cache_size = await getCacheSizeLabel();
            this.update();
        };

        this.onclickCheckLogLevelDebug = async (e) => {
            const ch_elm = this.root.querySelector(".check-loglevel-debug");
            let value = "info";
            if(ch_elm.checked === true){
                value = "debug";
            }
            await ipc.invoke("config:set", { key:"log.level", value:value });
            await ipc.invoke("setting:change-log-level", { level:value });
        };

        this.onclickNNDDSystemDir = async (e) => {
            const dir = await selectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".nndd-system-path-input", dir);
            await ipc.invoke("config:set", { key:"nndd.system_path", value:dir });

        };

        this.onclickCheckNNDDImportItem = async (item, e) => {
            const ch_elm = this.root.querySelector(`input[name='${item.name}']`);
            const checked = ch_elm.checked;
            await ipc.invoke("config:set", { key:`nndd.${item.name}`, value:checked });
        };

        this.onclickExecNNDDImport = async (e) => {
            const data_dir = await ipc.invoke("config:get", { key:"data_dir", value:"" });
            const nndd_system_dir = await ipc.invoke("config:get", { key:"nndd.system_path", value:"" });
            try {
                fs.statSync(data_dir);
            } catch (error) {
                await showMessageBox("error", `アプリのデータ保存先 "${data_dir}" が見つからない\n${error.message}`);
                return;
            }

            try {
                fs.statSync(nndd_system_dir);
            } catch (error) {
                await showMessageBox("error", `NNDDのシステムパス "${nndd_system_dir}" が見つからない\n${error.message}`);
                return;
            }

            const import_items = [];
            this.import_items.forEach(item => {
                const ch_elm = this.root.querySelector(`input[name='${item.name}']`);
                if(ch_elm.checked){
                    import_items.push(item);
                }
            });

            this.obs_msg_dialog.trigger("show", {
                message: "インポート中...",
            });
            try {
                const import_nndd = new ImportNNDDData(nndd_system_dir, data_dir);
                for (let index = 0; index < import_items.length; index++) {
                    const import_item = import_items[index];
                    this.obs_msg_dialog.trigger("update-message", `${import_item.title}をインポート`);
                    await import_nndd.call(import_item.name);
                }

                obs.trigger("search-page:sidebar:reload-items");
                obs.trigger("play-history-page:reload-items");
                obs.trigger("mylist-page:sidebar:reload-items");

                await showMessageBox("info", "インポート完了");
            } catch (error) {
                logger.error(error);
                await showMessageBox("error", `インポート失敗: ${error.message}`);
            } finally {
                this.obs_msg_dialog.trigger("close");
            }            
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
                const css_path = path.join(process.resourcesPath, "user.css");
                await fs.promises.stat(css_path);
                return css_path;
            } catch(err) {
                return "";
            }
        };

        this.on("mount", async () => {
            setInputValue(".app-setting-dir-input", await ipc.invoke("config:get", { key:"app_setting_dir", value:"" })); 
            
            const css_path = await getDefaultCSSPath();
            setInputValue(".css-path-input", await ipc.invoke("config:get", { key:"css_path", value:css_path }));   
            
            setInputValue(".data-dir-input", await ipc.invoke("config:get", { key:"data_dir", value:""}));  
            setInputValue(".download-dir-input", await ipc.invoke("config:get", { key:"download.dir", value:""}));
            setInputValue(".ffmpeg-path-input", await ipc.invoke("config:get", { key:"ffmpeg_path", value:""}));
            setCheckValue(".check-window-close", await ipc.invoke("config:get", { key:"check_window_close", value:true}));
        
            const log_level = await ipc.invoke("config:get", { key:"log.level", value:"info"});
            setCheckValue(".check-loglevel-debug", log_level=="debug");
            
            setInputValue(".nndd-system-path-input", await ipc.invoke("config:get", { key:"nndd.system_path", value:""}));  
            
            for (let index = 0; index < this.import_items.length; index++) {
                const import_item = this.import_items[index];
                setCheckValue(`.${import_item.name}`, 
                    await ipc.invoke("config:get", { key:`nndd.${import_item.name}`, value:false}));
            }
           
        });

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
                    const video_id = item.id;
                    const exist = await ipc.invoke("library:has", {video_id});
                    if(!exist){
                        await ipc.invoke("library:addItem", { item });
                    }
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
                ipc.send("app:show-message", {
                    type: "error",
                    title: `${error_files.length}個がインポートに失敗しました`,
                    message: "詳細はログを参照",
                });
            } 
        };
    </script>
</setting-page>