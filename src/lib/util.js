import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path  from 'path';
import url from 'url';
import { logger } from "@lib/logger.js";
import { CacheStore } from "@lib/cache-store.js";

export const setLogLevel = (level) => {
    process.env.LOG_LEVEL = level;
    logger.setLevel(level);
};

export const selectFolder = (dir, title) => {
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

export class UserIconCache {
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
            const file_path = this._cnvToFilePath(img_url);
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
