const fs = require("fs");
const path = require("path");
const remote = require("electron").remote;
const app = remote.app;

class SettingStore {
    static getSystemDir() {
        if(localStorage.getItem("system-dir")==null){
            const user_data_dir = app.getPath("userData");
            const library_dir = path.join(user_data_dir, "library");
            const system_dir = path.join(library_dir, "data");
            SettingStore.setValue("system-dir", system_dir);
        }
        return localStorage.getItem("system-dir");
    }

    static getSystemFile(filename) {
        return path.join(SettingStore.getSystemDir(), filename);
    }

    static setLibraryDir(value) {
        SettingStore.setValue("library-dir", value);

        const system_dir = path.join(value, "data");
        SettingStore.setValue("system-dir", system_dir);
    }

    static getLibraryDir() {
        if(localStorage.getItem("library-dir")==null){
            const user_data_dir = app.getPath("userData");
            const library_dir = path.join(user_data_dir, "library");
            SettingStore.setValue("library-dir", library_dir);
        }
        return localStorage.getItem("library-dir");
    }

    static getMylistDir() {
        const mylist_dir = path.join(SettingStore.getSystemDir(), "mylist");
        try {
            fs.statSync(mylist_dir);
        } catch (error) {
            fs.mkdirSync(mylist_dir);
        }
        return mylist_dir;
    }

    static getCommentParams() {
        return {
            duration_sec: SettingStore.getValue("comment-duration-sec", 4),
            fps: SettingStore.getValue("comment-fps", 60)
        };
    }
    static setCommentParams(params) {
        const { duration_sec, fps } = params;
        SettingStore.setValue("comment-duration-sec", duration_sec);
        SettingStore.setValue("comment-fps", fps);
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

module.exports = {
    SettingStore: SettingStore
};