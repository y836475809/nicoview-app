const myapi = require("../../lib/my-api");
const { ImportFile } = require("../../lib/import-file");
const { ImportNNDDSetting } = require("../../lib/import-nndd-setting");
const { ModalDialog } = require("../../lib/modal-dialog");
const { MyObservable, window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    state: {
        /** @type {{name:string, title:string}[]} */
        import_items:[],
    },

    /** @type {ModalDialog} */
    modal_dialog:null,
    
    /** @type {MyObservable} */
    obs_modal_dialog:null,

    /**
     * 
     * @param {string} selector 
     * @param {string} value 
     */
    setInputValue(selector, value) { 
        /** @type {HTMLInputElement} */
        const elm = this.$(selector);
        elm.value = value;
    },
    /**
     * 
     * @param {string} selector 
     * @param {boolean} value 
     */
    setCheckValue(selector, value) {
        /** @type {HTMLInputElement} */          
        const elm = this.$(selector);
        elm.checked = value;
    },
    onBeforeMount() {
        this.obs_modal_dialog = new MyObservable();
        this.modal_dialog = null;

        this.state.import_items = ImportNNDDSetting.getItems();

        this.mouse_gesture_text = () => {
            return [
                "右ボタン押しながら",
                "動画検索ページ: 左で前ページに移動",
                "動画検索ページ: 右で次ページに移動",
                "全てのページ: 上でプレイヤーを前面に表示"
            ].join("\n");
        };
    },
    async onMounted() {
        this.setInputValue(".data-dir-input", await myapi.ipc.Config.get("data_dir", "")); 
        this.setInputValue(".download-dir-input", await myapi.ipc.Config.get("download.dir", "")); 
        this.setInputValue(".ffmpeg-path-input", await myapi.ipc.Config.get("ffmpeg_path", "")); 
        this.setInputValue(".nndd-system-path-input", await myapi.ipc.Config.get("nndd.system_path", ""));
        this.setCheckValue(".user_icon_cache", await myapi.ipc.Config.get("user_icon_cache", false));  
        this.setCheckValue(".use_mouse_gesture", await myapi.ipc.Config.get("use_mouse_gesture", true));  

        for (let index = 0; index < this.state.import_items.length; index++) {
            const import_item = this.state.import_items[index];
            this.setCheckValue(`.${import_item.name}`, await myapi.ipc.Config.get(`nndd.${import_item.name}`, false));
        }
    
        this.modal_dialog = new ModalDialog(this.root, "setting-md", {
            obs:this.obs_modal_dialog,
            testname:"setting-md"
        });
    },
    async onclickUseMg(e){
        const checked = e.target.checked;
        main_obs.trigger("main:update-mousegesture-config", { 
            use_mouse_gesture: checked
        });
        await myapi.ipc.Config.set("use_mouse_gesture", checked);
    },
    async onclickSelectDataDir(e) { // eslint-disable-line no-unused-vars
        const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
        if(dir == null){
            return;
        }
        this.setInputValue(".data-dir-input", dir);
        await myapi.ipc.Config.set("data_dir", dir);
    },
    async onclickSelectDownloadDir(e) { // eslint-disable-line no-unused-vars
        const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
        if(dir == null){
            return; 
        }
        this.setInputValue(".download-dir-input", dir);
        await myapi.ipc.Config.set("download.dir", dir);
    },
    async onclickSelectffmpegPath(e) { // eslint-disable-line no-unused-vars
        const file_path = await myapi.ipc.Dialog.showSelectFileDialog({
            name: "ffmpeg",
        });
        if(file_path == null){
            return;
        }
        this.setInputValue(".ffmpeg-path-input", file_path);
        await myapi.ipc.Config.set("ffmpeg_path", file_path);
    },
    async onclickNNDDSystemDir(e) { // eslint-disable-line no-unused-vars
        const dir = await myapi.ipc.Dialog.showSelectFolderDialog();
        if(dir == null){
            return; 
        }
        this.setInputValue(".nndd-system-path-input", dir);
        await myapi.ipc.Config.set("nndd.system_path", dir);
    },
    async onclickCheckNNDDImportItem(item, e) {  // eslint-disable-line no-unused-vars
        const ch_elm = this.$(`input[name='${item.name}']`);
        const checked = ch_elm.checked;
        await myapi.ipc.Config.set(`nndd.${item.name}`, checked);
    },
    async onclickExecNNDDImport(e) { // eslint-disable-line no-unused-vars
        if(this.modal_dialog.isOpend()){
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
        this.state.import_items.forEach(item => {
            const ch_elm = this.$(`input[name='${item.name}']`);
            if(ch_elm.checked){
                import_items.push(item);
            }
        });

        this.obs_modal_dialog.trigger("show", {
            message: "インポート中...",
        });
        try {
            const import_nndd = new ImportNNDDSetting(nndd_system_dir, data_dir);
            for (let index = 0; index < import_items.length; index++) {
                const import_item = import_items[index];
                this.obs_modal_dialog.trigger("update-message", `${import_item.title}をインポート`);
                await import_nndd.call(import_item.name);
            }

            main_obs.trigger("search:sidebar:reload-items");
            main_obs.trigger("history:reload-items");
            main_obs.trigger("mylist:sidebar:reload-items");

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
    },
    async onclickImportFiles() {
        if(this.modal_dialog.isOpend()){
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
            cb: ()=>{
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
                const import_file = new ImportFile(file_path);
                const item = await import_file.createLibraryItem();
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
    },
    async onclickChecUerIconCache(e) {
        const checked = e.target.checked;
        await myapi.ipc.Config.set("user_icon_cache", checked);
    }
};
