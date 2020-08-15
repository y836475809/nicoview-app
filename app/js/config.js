
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const { deepCopy } = require("./deepcopy");
const { logger } = require("./logger");

class Config {
    setup(config_path){
        this.config_path = config_path;
        this._initJsonData();
    }

    get(key, value) {
        const obj = this._getObj(key, this.json_data);
        if (obj === null || obj === undefined) {
            return value;
        }
        if(typeof(value)=="object"){
            for (const key in value) {
                if (!Object.prototype.hasOwnProperty.call(obj,  key)) {
                    obj[key] = value[key];
                }
            }
        }
        return obj;
    }

    set(key, value) {
        this._setObj(key, value, this.json_data);
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

    _initJsonData(){
        this.json_data = {};
        this.json_data["app_setting_dir"] = path.dirname(this.config_path);
        this.json_data.download = {};
    }

    _getObj(key, json_data){
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

    _setObj(key, value, json_data){
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
}

module.exports = {
    Config
};