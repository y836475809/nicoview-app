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
            <div class="center-v title">データの保存先(ブックマーク, 履歴, DB等の保存先)</div> 
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
            <div class="center-v title">ログ出力レベル設定</div>
            <div class="content">
                <label>
                    <input class="check-loglevel-debug" type="checkbox" 
                        onclick={onclickCheckLogLevelDebug} />Debug
                </label>
            </div>
        </div>
    </div>

    <script>
        /* globals riot logger ModalDialog */
        const myapi = window.myapi;
        const { ImportLibrary } = window.ImportLibrary;
        const { ImportNNDDData } = window.ImportNNDDData;
        const { MouseGesture } = window.MouseGesture;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();
        let modal_dialog = null;

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
            await myapi.ipc.Config.set(mouse_gesture.name, config);
            obs.trigger("main-page:update-mousegesture-config", { config });
        };

        const setupMouseGesture = async () => {
            const config = await myapi.ipc.Config.get(mouse_gesture.name, mouse_gesture.defaultConfig);

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
            const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
            if(dir == null){
                return;
            }
            setInputValue(".data-dir-input", dir);
            await myapi.ipc.Config.set("data_dir", dir);
        };

        this.onclickSelectDownloadDir = async e => {
            const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".download-dir-input", dir);
            await myapi.ipc.Config.set("download.dir", dir);
        };

        this.onclickSelectffmpegPath = async e => {
            const file_path = await myapi.ipc.Dialog.showSelectFileDialog({
                name: "ffmpeg",
            });
            if(file_path == null){
                return;
            }
            setInputValue(".ffmpeg-path-input", file_path);
            await myapi.ipc.Config.set("ffmpeg_path", file_path);
        };

        this.onclickCheckLogLevelDebug = async (e) => {
            const ch_elm = this.root.querySelector(".check-loglevel-debug");
            let value = "info";
            if(ch_elm.checked === true){
                value = "debug";
            }
            await myapi.ipc.Config.set("log.level", value);
            await myapi.ipc.Setting.setLogLevel(value);
        };

        this.onclickNNDDSystemDir = async (e) => {
            const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
            if(dir == null){
                return; 
            }
            setInputValue(".nndd-system-path-input", dir);
            await myapi.ipc.Config.set("nndd.system_path", dir);
        };

        this.onclickCheckNNDDImportItem = async (item, e) => {
            const ch_elm = this.root.querySelector(`input[name='${item.name}']`);
            const checked = ch_elm.checked;
            await myapi.ipc.Config.set(`nndd.${item.name}`, checked);
        };

        this.onclickExecNNDDImport = async (e) => {
            if(modal_dialog.isOpend()){
                return;
            }

            let data_dir = "";
            let nndd_system_dir = "";
            try {
                data_dir = await myapi.ipc.Setting.getAppDataPath();
                nndd_system_dir = await myapi.ipc.Setting.getNNDDSystemPath();
            } catch (error) {
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: error.message
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

                await myapi.ipc.Dialog.showMessageBox({
                    message: "インポート完了"
                });
            } catch (error) {
                logger.error(error);
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `インポート失敗\n${error.message}`
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

        this.on("mount", async () => {
            setInputValue(".data-dir-input", await myapi.ipc.Config.get("data_dir", "")); 
            setInputValue(".download-dir-input", await myapi.ipc.Config.get("download.dir", "")); 
            setInputValue(".ffmpeg-path-input", await myapi.ipc.Config.get("ffmpeg_path", "")); 

            const log_level = await myapi.ipc.Config.get("log.level", "info");
            setCheckValue(".check-loglevel-debug", log_level=="debug");
            
            setInputValue(".nndd-system-path-input", await myapi.ipc.Config.get("nndd.system_path", "")); 
            
            for (let index = 0; index < this.import_items.length; index++) {
                const import_item = this.import_items[index];
                setCheckValue(`.${import_item.name}`, await myapi.ipc.Config.get(`nndd.${import_item.name}`, false));
            }

            setupMouseGesture();
        
            modal_dialog = new ModalDialog(this.root, "setting-md", {
                obs:this.obs_modal_dialog
            });
        });

        this.onclickImportFiles = async ()=>{
            if(modal_dialog.isOpend()){
                return;
            }
            
            const file_paths = await myapi.ipc.Dialog.showSelectFileDialog({
                name: "avi",
                exts: ["mp4", "flv", "swf"],
                multi_select: true
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
                    await myapi.ipc.Library.addItem(item);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    logger.error(error);
                    error_files.push(file_path);
                }

                const message = `進歩:${index+1}/${file_paths.length} 失敗:${error_files.length}`;
                this.obs_modal_dialog.trigger("update-message", message);

                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            await myapi.ipc.Dialog.showMessageBox({
                message: `インポート完了\n失敗:${error_files.length}`
            });
            this.obs_modal_dialog.trigger("close");

            if(error_files.length>0){
                await myapi.ipc.Dialog.showMessageBox({
                    type: "error",
                    message: `${error_files.length}個がインポートに失敗\n詳細はログを参照`
                });
            } 
        };
    </script>
</setting-page>