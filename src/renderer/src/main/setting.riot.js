import mitt from 'mitt';
import { window_obs } from "@lib/my-observable.js";

import ModalDialog from '@renderer/common/modal-dialog.riot';

/** @type {MyObservable} */
const main_obs = window_obs;

export default {
    state: {
        /** @type {{name:string, title:string}[]} */
        import_items:[],
        /** @type {import('@/types/events.js').DialogEmitter} */
        dialogEmitter: mitt()
    },

    components: {
        'modal-dialog': ModalDialog
    },

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
     * @returns {string} 
     */
    getInputValue(selector) { 
        /** @type {HTMLInputElement} */
        const elm = this.$(selector);
        return elm.value;
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
        const config = await window.electronAPI.invoke('config:get');
        this.setInputValue(".data-dir-input", config.data_dir); 
        this.setInputValue(".download-dir-input", config.download.dir); 
        this.setInputValue(".ffmpeg-path-input", config.ffmpeg_path); 
        this.setInputValue(".nndd-system-path-input", config.nndd.system_path);
        this.setCheckValue(".user_icon_cache", true);  
        this.setCheckValue(".use_mouse_gesture", true);  
    },
    async onclickUseMg(e){
        const checked = e.target.checked;
        main_obs.trigger("main:update-mousegesture-config", { 
            use_mouse_gesture: checked
        });
    },
    async onclickSelectDataDir(e) { // eslint-disable-line no-unused-vars
        const dir = await window.electronAPI.invoke('showSelectFolderDialog');
        if(dir == null){
            return;
        }
        this.setInputValue(".data-dir-input", dir);
        await window.electronAPI.invoke('config:set', 'data_dir', dir);
    },
    async onclickSelectDownloadDir(e) { // eslint-disable-line no-unused-vars
        const dir = await window.electronAPI.invoke('showSelectFolderDialog');
        if(dir == null){
            return; 
        }
        this.setInputValue(".download-dir-input", dir);
        const configDownload = (await window.electronAPI.invoke('config:get')).download;
        configDownload.dir = dir;
        await window.electronAPI.invoke('config:set', 'download', configDownload);
    },
    async onclickSelectffmpegPath(e) { // eslint-disable-line no-unused-vars
        const file_path = await window.electronAPI.invoke('showSelectFileDialog');
        if(file_path == null){
            return;
        }
        this.setInputValue(".ffmpeg-path-input", file_path);
        await window.electronAPI.invoke('config:set', 'ffmpeg_path', file_path);
    },
    async onclickNNDDSystemDir(e) { // eslint-disable-line no-unused-vars
    },
    async onclickCheckNNDDImportItem(item, e) {  // eslint-disable-line no-unused-vars
        const ch_elm = this.$(`input[name='${item.name}']`);
        const checked = ch_elm.checked;
    },
    async onclickExecNNDDImport(e) { // eslint-disable-line no-unused-vars          
    },
    async onclickImportFiles() {
    },
    async onclickChecUerIconCache(e) {
    }
};
