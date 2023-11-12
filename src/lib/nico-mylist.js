const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { NicoClientRequest } = require("./nico-client-request");
const { NICO_URL } = require("./nico-url");
const { CacheStore } = require("./cache-store");
const { logger } = require("./logger");

class NicoMylist {
    constructor(){
        this._req = null;

        this.reader = new NicoMylistReader();
        this.mylist = null;
        this.xml = null;
    }

    cancel(){   
        if (this._req) {
            this._req.cancel();
        }
    }

    async getMylist(mylist_id){
        await this.requestXML(mylist_id);
        this.mylist = this.reader.parse(mylist_id, this.xml);
        return this.mylist;
    }

    _isRedirection(status_code){
        return status_code == 301 || status_code == 302;
    }

    async requestXML(mylist_id){
        const url = this._getURL(mylist_id);
        try {
            this.xml = await this._requestXML(url); 
        } catch (error) {
            if(this._isRedirection(error.status)){
                // リダイレクトの場合
                const location = error.location;
                this.xml = await this._requestXML(location);
            }else{
                throw error;
            }
        }
        return this.xml;
    }

    _requestXML(url){
        this._req = new NicoClientRequest();
        return this._req.get(url);
    }

    _getURL(mylist_id){
        const sort = 6; // 投稿が新しい順
        if(/^mylist\/\d+$/.test(mylist_id)){
            return `${NICO_URL.VIDEO}/${mylist_id}?rss=2.0&numbers=1&sort=${sort}`;
        }
        if(/^user\/\d+$/.test(mylist_id)){
            return `${NICO_URL.VIDEO}/${mylist_id}/video?rss=2.0&numbers=1&sort=${sort}`;
        }

        throw new Error(`fault NicoMylist._getURL mylist_id=${mylist_id}`);
    }
}

class NicoMylistReader {
    parse(mylist_id, xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        
        const title = $("channel > title").text();
        const link = $("channel > link").text();
        const description = $("channel > description").text();
        const creator = $("channel > dc\\:creator").text();

        const items = [];
        $("channel > item").each((i, el) => {
            const item = $(el);
            const link = item.find("link").text();
            const video_id = this._getVideoIDFromLink(link);
            const cdata = this._parseCDATA(item.find("description").text());
            items.push( {
                no: i+1,
                title: item.find("title").text(),
                video_id: video_id,
                link: link,
                description: cdata.description,
                thumb_img: cdata.thumbnail_src,
                length: cdata.length,
                date: cdata.date,
            });
        });

        const mylist = {
            title: title,
            mylist_id: mylist_id,
            link: link,
            creator: creator,
            description: description,
            items: items
        };

        if(!this._isCorrect(mylist)){
            throw new Error("empty");
        }
        return mylist;
    }

    /**
     * 
     * @param {String} link 
     */
    _getVideoIDFromLink(link){
        const p = link.split("/").pop();
        if(p.includes("?")){
            return p.split("?")[0];
        }else{
            return p;
        }
    }

    _parseCDATA(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        let description = $(".nico-memo").text();
        if(description == ""){
            description = $(".nico-description").text();
        }
        return {
            description: description,
            thumbnail_src: $(".nico-thumbnail > img").attr("src"),
            length: $(".nico-info-length").text(),
            date: $(".nico-info-date").text(),
        };
    }

    _isCorrect(mylist){
        return mylist.title 
        && mylist.mylist_id 
        && mylist.link 
        && mylist.creator
        && mylist.items.every(item => {
            return item.title 
                && item.video_id 
                && item.link 
                && item.thumb_img
                && item.length
                && item.date;
        });
    }
}

class NicoMylistStore {
    constructor(get_dir_path){
        this.get_dir_path = get_dir_path;
        this.reader = new NicoMylistReader();
    }

    load(mylist_id){
        const path = this._getFilePath(mylist_id);
        const xml = fs.readFileSync(path, "utf-8");
        return this.reader.parse(mylist_id, xml);
    }

    delete(mylist_id){
        try {
            const file_path = this._getFilePath(mylist_id);
            fs.unlinkSync(file_path);     
        } catch (error) {
            logger.debug(`NicoMylistStore: delete mylistid=${mylist_id}, ${error}`);
        }
    }

    save(mylist_id, xml){
        const file_path = this._getFilePath(mylist_id);
        const dir = path.dirname(file_path);
        try {
            fs.statSync(dir);
        } catch (error) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(file_path, xml, "utf-8");
    }

    _getFilePath(mylist_id){
        const dir = this.get_dir_path;
        const fname = mylist_id.replace("/", "-");
        return path.join(dir, `${fname}.xml`);
    }
}

class NicoMylistImageCache {
    constructor(dir_path){
        this._dir_path = dir_path;

        /** @type Map<string, CacheStore> */
        this._map = new Map();
        this._exist_local_id_list = [];
    }

    setExistLocalIDList(mylist_id_list){
        this._exist_local_id_list = mylist_id_list;
    }

    getImageHtml(mylist_id, url){
        if(this._existLocal(mylist_id)){
            const image = new Image();
            if(this._has(mylist_id, url)){
                // TODO <img src="${url}" ?
                image.src = this._map.get(mylist_id).get(url);
            }else{
                if(this._isImgData(url)){
                    image.src = url;
                }else{
                    image.onload = (e) => {
                        const data = this._getBase64(e.target);
                        this._set(mylist_id, url, data);
                    };
                    image.src = url;
                }
            }
            image.classList.add("mylist-grid-thumb", "mylist-img");
            return image.outerHTML;
        }else{
            return `<img src="${url}" class="mylist-grid-thumb mylist-img"/>`;
        }
    }

    /**
     * 
     * @param {string} mylist_id 
     * @param {HTMLImageElement} img 
     */
    setImage(mylist_id, img){
        this.loadCache(mylist_id);

        const url = img.src;
        if(this._isImgData(url)){
            return;
        }
        if(this._has(mylist_id, url) === true){
            return;
        }

        if(img.naturalWidth > 0 && img.naturalHeight > 0){
            if(this._map.has(mylist_id) === false){
                const cache_store = this._createCacheStore(mylist_id);
                this._map.set(mylist_id, cache_store);
            }
            const data = this._getBase64(img);
            this._set(mylist_id, url, data);
        }
    }

    save(){
        this._map.forEach((cache_store, mylist_id) => {
            try {
                if(this._existLocal(mylist_id) === true){
                    cache_store.save();
                }
            } catch (error) {
                logger.debug(`NicoMylistImageCache: save mylistid=${mylist_id}, ${error}`);
            }
        });
    }

    delete(mylist_id){
        this._map.delete(mylist_id);
        try {
            const file_path = path.join(this._dir_path,this._getFileName(mylist_id));
            fs.unlinkSync(file_path);
        } catch(error) {
            logger.debug(`NicoMylistImageCache: delete mylistid=${mylist_id}, ${error}`);
        }
    }

    _isImgData(url){
        return url.startsWith("data:image/");
    }

    _has(mylist_id, url){
        const has_mylist = this._map.has(mylist_id);
        if(!url){
            return has_mylist;
        }

        if(has_mylist === true){
            return this._map.get(mylist_id).has(url);
        }
        
        return false;
    }

    _set(mylist_id, url, data){
        this._map.get(mylist_id).set(url, data);
    }

    loadCache(mylist_id){
        if(this._existLocal(mylist_id) === false){
            return;
        }

        if(this._map.has(mylist_id)===true){
            return;
        }

        const cache_store = this._createCacheStore(mylist_id);
        try {
            cache_store.load();
        } catch (error) { 
            logger.debug(`NicoMylistImageCache: load mylistid=${mylist_id}, ${error}`);
        }
        this._map.set(mylist_id, cache_store);
    }

    _createCacheStore(mylist_id){
        return new CacheStore(this._dir_path, this._getFileName(mylist_id));
    }

    _getFileName(mylist_id){
        const fname = mylist_id.replace("/", "-");
        return `${fname}-img.json`;
    }

    _existLocal(mylist_id){
        return this._exist_local_id_list.includes(mylist_id);
    }

    _getBase64(img){
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg");
        return data;
    }
}

module.exports = {
    NicoMylist,
    NicoMylistReader,
    NicoMylistStore,
    NicoMylistImageCache
};