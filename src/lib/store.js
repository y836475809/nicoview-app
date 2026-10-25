import fs from 'fs';
import path  from 'path';

export class Store {
    /**
     * 
     * @param {string} dataDir 
     */
    constructor(dataDir){
        /** @type {string} */
        this._dataDir = dataDir;
        this._map = new Map();
    }
    
    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @returns {boolean}
     */
    has(name){
        return this._map.has(name);
    }

    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @returns {StoreMap[K][]}
     */
    getItems(name){
        if(!this._map.has(name)){
            this._map.set(name, []);
        }
        return this._map.get(name);  
    }

    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @param {StoreMap[K]} item
     */
    addItem(name, item){
        const items = this.getItems(name);
        items.push(item);
        this.setItems(name, items);
    }

    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @param {(item: StoreMap[K]) => boolean} func
     */
    deleteItem(name, func){
        const items = this.getItems(name);
        const delItems = items.filter(func);
        this.setItems(name, delItems);
    }

    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @param {StoreMap[K][]} items 
     */
    setItems(name, items){
        this._map.set(name, items);
    }
    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     * @returns {Promise<void>} 
     */
    async load(name){
        const filePath = path.join(this._dataDir, `${name}.json`);
        if(!fs.existsSync(filePath)){
            return;
        }
        const content = await fs.promises.readFile(filePath, "utf-8");
        const items = JSON.parse(content);
        this._map.set(name, items);
    }
    /**
     * @template {keyof StoreMap} K
     * @param {K} name 
     */
    async save(name){
        const items = this._map.get(name); 
        const filePath = path.join(this._dataDir, `${name}.json`);
        const json = JSON.stringify(items, null, "  ");
        await fs.promises.writeFile(filePath, json, "utf-8");
    }
} 
