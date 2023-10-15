
class LRUCache extends Map {
    constructor(capacity){
        super();
        this._capacity = capacity;
    }
    get(key){
        if(!super.has(key)){
            return undefined;
        }
        const value = super.get(key);
        super.delete(key);
        super.set(key, value);
        return value;
    }
    set(key, value){
        if(super.has(key)){
            super.delete(key); 
        }
        super.set(key, value);
        if(super.size > this._capacity){
            const old_key = [...super.keys()][0];
            super.delete(old_key);
        }
        return this;
    }
}

class ImgElementCache {
    /**
     * 
     * @param {number} capacity 
     * @param {string[]} img_classes 
     */
    constructor(capacity, img_classes){
        this._img_classes = img_classes;
        /** @type {Map<string, HTMLImageElement>} */
        this._cache = new LRUCache(capacity);
    }
    
    /**
     * 
     * @param {string[]} img_src_list 
     * @returns {HTMLImageElement[]}
     */
    getImgs(img_src_list){
        const values = this._cache.values();
        for(const value of values){
            const pe = value.parentElement;
            if(pe){
                while (pe.lastChild) {
                    pe.removeChild(pe.lastChild);
                }
            } 
        }

        const img_elms = [];
        for(const img_src of img_src_list){
            img_elms.push(this._preloadImg(img_src));
        }
        return img_elms;
    }
    /**
     * 
     * @param {string} img_src 
     */
    _preloadImg(img_src) {
        if(this._cache.has(img_src)){
            return this._cache.get(img_src);
        }else{
            const img = new Image();
            this._cache.set(img_src, img);
            img.loading = "lazy";
            img.classList.add(...this._img_classes);
            img.src = img_src;
            return img;
        }
    }
}

module.exports = {
    ImgElementCache
};
