const fs = require("fs");

class JsonStore {
    constructor(file_path){
        this.file_path = file_path;
    }

    load(){
        fs.accessSync(this.file_path);
        const data = fs.readFileSync(this.file_path, "utf-8");
        return JSON.parse(data);
    }

    save(obj){
        const json = JSON.stringify(obj, null, "  ");
        fs.writeFileSync(this.file_path, json, "utf-8");       
    }
}

module.exports = {
    JsonStore
};