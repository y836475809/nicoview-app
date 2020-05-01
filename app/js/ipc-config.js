
const { dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const { DataIpcMain } = require("./ipc");
const { deepCopy } = require("./deepcopy");
const logger = require("./logger");

class ConfigIpcMain extends DataIpcMain {
    constructor() {
        super("config");
    }

    setup(config_path){
        this.config_path = config_path;
        this._initJsonData();
    }

    _initJsonData(){
        this.json_data = {};
        this.json_data["app_setting_dir"] = path.dirname(this.config_path);
        this.json_data.download = {};
    }

    getObj(key, json_data){
        let obj = deepCopy(json_data);
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
        if(typeof(obj[prop])=="object" && typeof(value)=="object"){
            Object.assign(obj[prop], value);
        }else{
            obj[prop] = value;
        }
    }

    get(args) {
        const { key, value } = args;
        const obj = this.getObj(key, this.json_data);
        if (obj === null || obj === undefined) {
            return value;
        }
        if(typeof(value)=="object"){
            for (const key in value) {
                if (!obj.hasOwnProperty(key)) {
                    obj[key] = value[key];
                }
            }
        }
        return obj;
    }

    set(args) {
        const { key, value } = args;
        this.setObj(key, value, this.json_data);
    }

    clear() {
        this._initJsonData();
    }

    async load() {
        this._initJsonData();
        try {
            await fsPromises.stat(this.config_path);
        } catch (error) {
            logger.debug(error);
            return;
        }
        
        const data = await fsPromises.readFile(this.config_path, "utf-8");
        Object.assign(this.json_data, JSON.parse(data));
    }

    async save() {
        delete this.json_data["app_setting_dir"];
        const json = JSON.stringify(this.json_data, null, "  ");
        await fsPromises.writeFile(this.config_path, json, "utf-8");
    }

    async configFolder(key, label) {
        const cfg_dir = this.get({key:key, value:undefined});
        if (await this._checkDir(cfg_dir) !== true) {     
            const dir = await this._selectFolder(`${label}を保存するフォルダの選択`);
            if (dir === undefined) {
                throw new Error(`${label}を保存するフォルダが選択されていない`);
            }
            this.set({key:key, value:dir});
        }
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

    async _selectFolder(title) {
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

module.exports = {
    ConfigIpcMain
};