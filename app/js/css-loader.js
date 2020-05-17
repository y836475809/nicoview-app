const fs = require("fs");

class CSSLoader {
    constructor(){
        this._css = "";
    }

    async load(file_path){
        await fs.promises.stat(file_path);
        this._css = await fs.promises.readFile(file_path, "utf8");
        return this._css;
    }

    get CSS(){
        return this._css;
    }
}

module.exports = {
    CSSLoader,
};