const { ipcMain } = require("electron");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const url = require("url");
const { dialog, Menu } = require("electron");
const { logger } = require("../js/logger");
const { CacheStore } = require("../js/cache-store");

class JsonStore { 
    constructor(get_dir_func){
        this._get_dir_func = get_dir_func;
    }

    async load(name, default_value){
        const data_dir = await this._get_dir_func();
        const file_path = path.join(data_dir, `${name}.json`);
        try {
            await fsPromises.stat(file_path);
        } catch (error) {
            return default_value;
        }

        try {
            const data = await fsPromises.readFile(file_path, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            logger.error(`loadJson ${name}`, error);

            await dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                message: `${file_path}の読み込みに失敗\n${error.message}`
            });
            return default_value;
        }
    }

    async save(name, items){
        const data_dir = await this._get_dir_func();
        const file_path = path.join(data_dir, `${name}.json`);
        try {
            const json = JSON.stringify(items, null, "  ");
            await fsPromises.writeFile(file_path, json, "utf-8");
        } catch (error) {
            logger.error(`saveJson ${name}`, error);

            await dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                message: `${file_path}の保存に失敗\n${error.message}`
            });
        }
    }
}

class UserCSS {
    constructor(){
    }

    async load(file_path){
        if(!file_path){
            return;
        }
        try {
            await fs.promises.stat(file_path);
            this._css = await fs.promises.readFile(file_path, "utf8");
        } catch (error) {
            logger.error(error);
            await dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: `${path.basename(file_path)}の読み込みに失敗`,
                message: error.message
            });
        }
    }

    apply(win){
        if(!win){
            return;
        }
        
        try {
            if(!this._css){
                return;
            }
            win.webContents.insertCSS(this._css);
        } catch (error) {
            logger.error(error);
            dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK"],
                message: `CSSの適用に失敗: ${error.message}`
            });
        }
    }
}

const getWindowState = (w) => {
    const bounds = w.getBounds(); 
    return {
        x: bounds.x, 
        y: bounds.y,  
        width: bounds.width,  
        height: bounds.height, 
        maximized: w.isMaximized()
    };
};

const setLogLevel = (level) => {
    process.env.LOG_LEVEL = level;
    logger.setLevel(level);
};

const popupInputContextMenu = (bw, props) => {
    const { inputFieldType, editFlags } = props;
    if (inputFieldType === "plainText") {
        const input_context_menu = Menu.buildFromTemplate([
            { 
                id: "canCut",
                label: "切り取り",
                role: "cut",
            }, 
            {
                id: "canCopy",
                label: "コピー",
                role: "copy",
            }, 
            {
                id: "canPaste",
                label: "貼り付け",
                role: "paste",
            }, 
            {
                type: "separator",
            }, 
            {
                id: "canSelectAll",
                label: "すべて選択",
                role: "selectall",
            },
        ]);
        input_context_menu.items.forEach(item => {
            item.enabled = editFlags[item.id];
        });
        input_context_menu.popup(bw);
    }
};

const selectFolder = (dir, title) => {
    const checkDir = (dir) => {
        if (!dir) {
            return false;
        }
        try {
            fs.statSync(dir);
            return true;
        } catch (error) {
            return false;
        }
    };

    if(checkDir(dir)){
        return dir;
    }

    const dirs = dialog.showOpenDialogSync({
        title: title,
        properties: ["openDirectory", "createDirectory"]
    });
    if (dirs) {
        return dirs[0];
    }
    return null;
};

class UserIconCache {
    setup(dir, enable){
        this._dir = dir;
        this._enable = enable;

        ipcMain.handle("user-icon:enable", (event, args) => { // eslint-disable-line no-unused-vars
            return this._enable;
        });

        if(!this._enable){
            return;
        }

        try {
            fs.statSync(this._dir);
        } catch (error) {
            fs.mkdirSync(this._dir);
        }
        try {
            this._cache = new CacheStore( this._dir, "user_icon.json");
            this._cache.load();
        } catch (error) {
            // pass
        } 

        ipcMain.handle("user-icon:get", (event, args) => {
            const { img_url } = args;
            if(this._cache.has(img_url)){
                const file_name = this._cache.get(img_url);
                const local_url = this._cnvToFileURL(file_name);
                return local_url.href;
            }
            return img_url;
        });
        ipcMain.on("user-icon:set", (event, args) => {
            const { img_url, base64 } = args;
            const buf = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
            const file_path = 
            this._cnvToFilePath(img_url);
            fs.writeFileSync(file_path, buf);

            this._cache.set(img_url, path.basename(file_path));
            this._cache.save();
        });
        ipcMain.handle("user-icon:has", (event, args) => {
            const { img_url } = args;
            if(img_url.startsWith("file://")){
                return true;
            }
            return this._cache.has(img_url);
        });
    }

    _cnvToFilePath(img_url){
        const ary = img_url.split("/").pop().split("?");
        if(ary.length==1){
            return ary[0];
        }
        
        const ext = path.extname(ary[0]);
        const base_name = path.basename(ary[0], ext);
        const param = ary[1];
        return path.join(this._dir, `${base_name}_${param}${ext}`);
    }

    _cnvToFileURL(file_name){
        return url.pathToFileURL(path.join(this._dir, file_name));
    }
}

module.exports = {
    JsonStore,
    UserCSS,
    UserIconCache,
    getWindowState,
    setLogLevel,
    popupInputContextMenu,
    selectFolder
};