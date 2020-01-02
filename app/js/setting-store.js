const path = require("path");
const remote = require("electron").remote;
const { FileUtils } = require("./file-utils");

const app = remote.app;

const setting_dir_name = "setting";

class SettingStore {
    static getSettingFilePath(filename) {
        return path.join(SettingStore.getSettingDir(), filename);
    }

    static getSettingDir() {
        const use_userdata = SettingStore.getValue("setting-use-userdata", true);
        const userdata_dir = app.getPath("userData");

        let setting_dir = null;
        if(use_userdata===true){
            setting_dir = path.join(userdata_dir, setting_dir_name);
        }else{
            const parent_dir = SettingStore.getValue("setting-data-dir", "");
            if(parent_dir==""){
                setting_dir = path.join(userdata_dir, setting_dir_name);
            }else{
                setting_dir = path.join(parent_dir, setting_dir_name);
            }
        }

        FileUtils.mkDirp(setting_dir);
        
        return setting_dir;
    }

    static setDownloadDir(dir) {
        SettingStore.setValue("download-dir", dir);
    }

    static getDownloadDir() {
        let dir = SettingStore.getValue("download-dir", "");
        if(dir==""){
            const user_data = app.getPath("userData");
            dir = path.join(user_data, "download");
        }
        FileUtils.mkDirp(dir);
        return dir;
    }

    static getMylistDir() {
        const mylist_dir = path.join(SettingStore.getSettingDir(), "mylist");
        FileUtils.mkDirp(mylist_dir);

        return mylist_dir;
    }

    static getCommentParams() {
        return {
            duration_sec: SettingStore.getValue("comment-duration-sec", 4),
            fps: SettingStore.getValue("comment-fps", 60),
            do_limit: SettingStore.getValue("comment-do-limit", true),
        };
    }
    static setCommentParams(params) {
        const { duration_sec, fps, do_limit } = params;
        SettingStore.setValue("comment-duration-sec", duration_sec);
        SettingStore.setValue("comment-fps", fps);
        SettingStore.setValue("comment-do-limit", do_limit);
    }

    static getValue(key, default_value) {
        const value = localStorage.getItem(key);
        if(value == null){
            return default_value;
        }
        const type = typeof(default_value);
        if(type=="string"){
            return value;
        }
        if(type=="number"){
            return parseFloat(value);
        }
        if(type=="boolean"){
            return value=="true";
        }
        if(type=="object"){
            return JSON.parse(value);
        }
        throw new Error(`${key}: ${value} is unknown`);
    }
    
    static setValue(key, value){
        const type = typeof(value);
        if(type=="object"){
            localStorage.setItem(key, JSON.stringify(value));
        }else{
            localStorage.setItem(key, value.toString());
        }
    }
}

class SettingDirConfig {
    load(){
        this.use_userdata = SettingStore.getValue("setting-use-userdata", true);
        if(this.use_userdata===true){
            this.dir = this._getUserData();
        }else{
            this.dir = SettingStore.getValue("setting-data-dir", this._getUserData());
        } 
        FileUtils.mkDirp(this._getFullpath());
    }

    save(){
        SettingStore.setValue("setting-use-userdata", this.use_userdata);
        SettingStore.setValue("setting-data-dir", this.dir);
    }

    _getUserData(){
        return app.getPath("userData");
    }
 
    _getFullpath(){
        return path.join(this.dir, setting_dir_name);
    }

    get enableUserData() {
        return this.use_userdata;
    }
    set enableUserData(enable) {
        this.use_userdata = enable;
    }

    getDir(use_userdata) {
        if(use_userdata===true){
            return path.join(this._getUserData(), setting_dir_name);
        }else{
            return this._getFullpath();
        }
    }

    getParentDir(use_userdata) {
        if(use_userdata===true){
            return this._getUserData();
        }else{
            return this.dir;
        }
    }

    setDir(dir) {
        this.dir = dir;
        FileUtils.mkDirp(this._getFullpath());
    }
}

module.exports = {
    SettingStore,
    SettingDirConfig
};