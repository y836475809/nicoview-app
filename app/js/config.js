
const { ipcRenderer, ipcMain, app, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;

const IPC_CHANNEL = Object.freeze({
    SET_VALUE: "ipc-config-set-value",
    GET_VALUE: "ipc-config-get-value",
});

class ConfigRenderer {
    async get(key, default_value) {
        return await ipcRenderer.invoke(IPC_CHANNEL.GET_VALUE, { key, default_value });
    }

    set(key, value) {
        ipcRenderer.send(IPC_CHANNEL.SET_VALUE, { key, value });
    }
}

class ConfigMain {
    constructor() {
        this.setup();
    }

    setup(){
        this.config_path = path.join(app.getPath("userData"), "config.json");
        this._initJsonData();
        ipcMain.handle(IPC_CHANNEL.GET_VALUE, async (event, args) => {
            const { key, default_value } = args;
            return this.get(key, default_value);
        });

        ipcMain.on(IPC_CHANNEL.SET_VALUE, async (event, args) => {
            const { key, value } = args;
            this.set(key, value);
        });
    }

    _initJsonData(){
        this.json_data = {};
        this.json_data["app-setting-dir"] = app.getPath("userData");
    }

    getObj(key, json_data){
        let obj = json_data;
        const props = key.split(".");
        props.some(prop => {
            if(obj[prop] === undefined){
                obj = obj[prop];
                return true;
            }
            obj = obj[prop];
        });
        return obj;
    }

    setObj(key, value, json_data){
        let obj = json_data;
        const props = key.split(".");
        for (let index = 0; index < props.length-1; index++) {
            const prop = props[index];
            if(obj[prop] === undefined){
                obj[prop] = {};
            }
            if(typeof(obj[prop])!="object"){
                obj[prop] = {};
            }
            obj = obj[prop];
        }
        const prop = props[props.length-1];
        obj[prop] = value;
    }

    get(key, default_value) {
        const value = this.getObj(key, this.json_data);
        if (value === null || value === undefined) {
            return default_value;
        }
        return value;
    }

    set(key, value) {
        this.setObj(key, value, this.json_data);
    }

    clear() {
        this._initJsonData();
    }

    async load() {
        this._initJsonData();
        await fsPromises.stat(this.config_path);

        const data = await fsPromises.readFile(this.config_path, "utf-8");
        Object.assign(this.json_data, JSON.parse(data));
    }

    async save() {
        delete this.json_data["app-setting-dir"];
        const json = JSON.stringify(this.json_data, null, "  ");
        await fsPromises.writeFile(this.config_path, json, "utf-8");
    }

    async configFolder() {
        const data_dir = await this._selectFolder(this.json_data["data-dir"], "データを保存するフォルダの選択");
        if (data_dir === undefined) {
            throw new Error("データを保存するフォルダが選択されていない");
        }
        this.json_data["data-dir"] = data_dir;

        const download_dir = await this._selectFolder(this.json_data["download-dir"], "動画を保存するフォルダの選択");
        if (download_dir === undefined) {
            throw new Error("動画を保存するフォルダが選択されていない");
        }
        this.json_data["download-dir"] = download_dir;
    }

    async _checkDir(dir) {
        if (dir === undefined) {
            return false;
        }
        try {
            await fsPromises.stat(dir);
            return true;
        } catch (error) {
            return false;
        }
    }

    async _selectFolder(dir, title) {
        if (await this._checkDir(dir) === true) {
            return dir;
        } else {
            const dirs = dialog.showOpenDialogSync({
                title: title,
                properties: ["openDirectory", "createDirectory"]
            });
            if (dirs === undefined) {
                return undefined;
            }
            return dirs[0];
        }
    }
}

module.exports = {
    ConfigMain,
    ConfigRenderer
};