const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { dialog, Menu } = require("electron");
const { logger } = require("./js/logger");
const { CSSLoader } = require("./js/css-loader");

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
        this._css_loader = new CSSLoader();
    }

    async load(file_path){
        if(!file_path){
            return;
        }
        try {
            await this._css_loader.load(file_path);
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
            const css = this._css_loader.CSS;
            if(!css){
                return;
            }
            win.webContents.insertCSS(css);
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

module.exports = {
    JsonStore,
    UserCSS,
    getWindowState,
    setLogLevel,
    popupInputContextMenu,
    selectFolder
};