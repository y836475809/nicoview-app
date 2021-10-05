const { CacheStore } = require("./cache-store");

class ImgCacheStore {
    constructor(dir, file_name){
        this._enable = false;
        this._loaded = false;
        this._cs = new CacheStore(dir, file_name);
    }

    async set(img){
        const url = img.src;

        if(this.has(url)){
            return;
        }
        if(url.startsWith("data:image/")){
            return;
        }

        this._cs.set(url, this._getBase64(img));    
    }

    get(url){
        if(this.has(url)){
            return this._cs.get(url);
        }
        return url;
    }

    has(url){
        return this._cs.has(url);
    }

    load(){
        if(this._loaded){
            return;
        }
        this._loaded = true;
        this._cs.load();
    }

    save(){
        this._cs.save();
    }

    _getBase64(img){
        const canvas = document.createElement("canvas");
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg");
        return data;
    }
}

module.exports = {
    ImgCacheStore
};