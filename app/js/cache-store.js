const path = require("path");
const fs = require("fs");

class CacheStore {
    constructor(dir_path, fname){
        this.file_path =  path.join(dir_path, fname);
        this.cache = new Map();
        this.dirty = false;
    }

    set(key ,value, force=false){
        if(force){
            this.dirty = true;
            this.cache.set(key, value);
        }else if(!this.cache.has(key)){
            this.dirty = true;
            this.cache.set(key, value);
        }
    }

    has(key){

        return this.cache.has(key);
    }

    get(key){
        return this.cache.get(key);
    }

    clear(){
        this.cache = new Map();
    }

    load(){
        const obj = this._load();
        this.cache = new Map(obj);
        this.dirty = false;
    }

    save(){
        if(this.dirty){
            const ary = Array.from(this.cache.entries());
            this._save(ary); 
            this.dirty = false;  
        }   
    }

    _load(){
        fs.accessSync(this.file_path);
        const data = fs.readFileSync(this.file_path, "utf-8");
        return JSON.parse(data);
    }

    _save(obj){
        const json = JSON.stringify(obj, null, "  ");
        fs.writeFileSync(this.file_path, json, "utf-8");       
    }
}

module.exports = {
    CacheStore
};