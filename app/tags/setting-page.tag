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
        
        .setting-page .mg-container {
            margin-right: 15px;
        }
        .setting-page .mg-label {
            margin-right: 5px;
        }
    </style>

    <div class="setting-page">
        <div class="container">
            <div class="center-v title">マウスジェスチャ設定(右ボタン押しながら)</div>
            <div style="display: flex; flex-wrap:wrap;" class="content">
                <div style="display: flex;" class="mg-container" each={item in mouse_gesture_items}>
                    <div class="center-v mg-label">{item.text}</div>
                    <select class="{item.class}" onchange={onchangeMgSelect.bind(this,item)}>
                        <option value="-">-</option>
                        <option value="left">left</option>
                        <option value="right">right</option>
                        <option value="up">up</option>
                        <option value="down">down</option>
                        <option value="left_up">left_up</option>
                        <option value="left_down">left_down</option>
                        <option value="right_up">right_up</option>
                        <option value="right_down">right_down</option>
                    </select>
                </div>
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
                    <div class="label">動画ファイルを選択(コメント、サムネイル、動画情報もインポートされる)</div>
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
            <div class="center-v title">ユーザーCSS</div>
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
                <label>
                    <input class="check-window-close" type="checkbox" 
                        onclick={onclickCheckWindowClose} />ウィンドウを閉じる時に確認する
                </label>
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
                <label>
                    <input class="check-loglevel-debug" type="checkbox" 
                        onclick={onclickCheckLogLevelDebug} />Debug
                </label>
            </div>
        </div>
    </div>
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const ipc = window.electron.ipcRenderer;
        const path = window.path;
        const fs = window.fs;
        const { ImportLibrary } = window.ImportLibrary;
        const { ImportNNDDData } = window.ImportNNDDData;
        const { MouseGesture } = window.MouseGesture;
        
        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        this.cache_size = "--MB";
        this.import_items = ImportNNDDData.getItems();

        const mouse_gesture = new MouseGesture();
        
        this.mouse_gesture_items = [];
        for(const item of mouse_gesture.items){
            const obj = {};
            Object.assign(obj, item);
            obj.class = `mg-${item.action}`;
            this.mouse_gesture_items.push(obj);
        }

        this.onchangeMgSelect = async (item, e) => {
            const gesture = e.target.value;
            mouse_gesture.setGesture(gesture, item.action);
            const config = mouse_gesture.config;
            await ipc.invoke("config:set", { key: mouse_gesture.name, value: config });
            obs.trigger("main-page:update-mousegesture-config", { config });
        };

        const setupMouseGesture = async () => {
            const config = await ipc.invoke("config:get", 
                { 
                    key: mouse_gesture.name, 
                    value: mouse_gesture.defaultConfig
                });

            for (const [key, value] of Object.entries(config)) {
                const gesture = value;
                const class_name = `mg-${key}`;
                const elem = this.root.querySelector(`.${class_name}`);
                for(let i = 0; i < elem.options.length; i++) {
                    if(elem.options[i].value == gesture){
                        elem.options[i].selected = true ;
                    }
                }
            }
        };

        this.onclickSelectDataDir = async e => {
            const dir = await ipc.invoke("app:show-select-folder-dialog");
            if(dir == null){
                return;
            }
            setInputValue(".data-dir-input", dir);
            await ipc.invoke("config:set", { key:"data_dir", value:dir });
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await ipc.invoke("app:show-select-folder-dialog");
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            await ipc.invoke("config:set", { key:"download.dir", value:dir });
        };

        this.onclickOpenDir = async (e) => {
            const dir = await ipc.invoke("config:get", { key:"app_setting_dir", value:"" });
            await ipc.invoke("setting:open-dir", { dir });
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await ipc.invoke("app:show-select-file-dialog",{
                name:"ffmpeg",
                exts:["*"]
            });
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            await ipc.invoke("config:set", { key:"ffmpeg_path", value:file_path });
        };

        
        this.onclickSelectcCssPath = async e => {
            const file_path = await ipc.invoke("app:show-select-file-dialog",{
                name:"CSS",
                exts:["css"]
            });
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
            if(this.root.querySelector("modal-dialog").dataset.open=="true"){
                return;
            }

            this.obs_modal_dialog.trigger("show", {
                message: "キャッシュクリア中...",
            });
            await new Promise(resolve => setTimeout(resolve, 100));

            await ipc.invoke("setting:clear-app-cache");

            this.obs_modal_dialog.trigger("close");

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
            const dir = await ipc.invoke("app:show-select-folder-dialog");
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
            if(this.root.querySelector("modal-dialog").dataset.open=="true"){
                return;
            }

            const data_dir = await ipc.invoke("config:get", { key:"data_dir", value:"" });
            const nndd_system_dir = await ipc.invoke("config:get", { key:"nndd.system_path", value:"" });
            try {
                fs.statSync(data_dir);
            } catch (error) {
                await ipc.invoke("app:show-message-box", {
                    type:"error",
                    message:`アプリのデータ保存先 "${data_dir}" が見つからない\n${error.message}`
                });
                return;
            }

            try {
                fs.statSync(nndd_system_dir);
            } catch (error) {
                await ipc.invoke("app:show-message-box", {
                    type:"error",
                    message:`NNDDのシステムパス "${nndd_system_dir}" が見つからない\n${error.message}`
                });
                return;
            }

            const import_items = [];
            this.import_items.forEach(item => {
                const ch_elm = this.root.querySelector(`input[name='${item.name}']`);
                if(ch_elm.checked){
                    import_items.push(item);
                }
            });

            this.obs_modal_dialog.trigger("show", {
                message: "インポート中...",
            });
            try {
                const import_nndd = new ImportNNDDData(nndd_system_dir, data_dir);
                for (let index = 0; index < import_items.length; index++) {
                    const import_item = import_items[index];
                    this.obs_modal_dialog.trigger("update-message", `${import_item.title}をインポート`);
                    await import_nndd.call(import_item.name);
                }

                obs.trigger("search-page:sidebar:reload-items");
                obs.trigger("play-history-page:reload-items");
                obs.trigger("mylist-page:sidebar:reload-items");

                await ipc.invoke("app:show-message-box", {
                    type:"info",
                    message:"インポート完了"
                });
            } catch (error) {
                logger.error(error);
                await ipc.invoke("app:show-message-box", {
                    type:"error",
                    message:`インポート失敗\n${error.message}`
                });
            } finally {
                this.obs_modal_dialog.trigger("close");
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

            setupMouseGesture();
        });

        this.onclickImportFiles = async ()=>{
            if(this.root.querySelector("modal-dialog").dataset.open=="true"){
                return;
            }
            
            const file_paths = await ipc.invoke("app:show-select-file-dialog",{
                name:"avi",
                exts:["mp4", "flv", "swf"],
                multi_select:true
            });
            if(!file_paths){
                return;
            }

            let cancel = false;
            this.obs_modal_dialog.trigger("show", {
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
                    await ipc.invoke("library:addItem", { item });
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    logger.error(error);
                    error_files.push(file_path);
                }

                const message = `進歩:${index+1}/${file_paths.length} 失敗:${error_files.length}`;
                this.obs_modal_dialog.trigger("update-message", message);

                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            await ipc.invoke("app:show-message-box", {
                type:"info",
                message:`インポート完了\n失敗:${error_files.length}`
            });
            this.obs_modal_dialog.trigger("close");

            if(error_files.length>0){
                await ipc.invoke("app:show-message-box", {
                    type: "error",
                    message: `${error_files.length}個がインポートに失敗\n詳細はログを参照`,
                });
            } 
        };
    </script>
</setting-page>