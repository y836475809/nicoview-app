const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { NicoClientRequest } = require("./nico-client-request");
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
        this.mylist = this.reader.parse(this.xml);
        return this.mylist;
    }

    async requestXML(mylist_id){
        const id = this._getID(mylist_id);
        this.xml = await this._requestXML(id);
        return this.xml;
    }

    _requestXML(id){
        const host = "https://www.nicovideo.jp";
        const sort = 1;
        const url = `${host}/mylist/${id}?rss=2.0&numbers=1&sort=${sort}`;

        this._req = new NicoClientRequest();
        return this._req.get(url);
    }

    /**
     * mylist/00000 -> 00000
     * @param {string} mylist_id 
     */
    _getID(mylist_id){
        return mylist_id.replace("mylist/", "");
    }
}

class NicoMylistReader {
    parse(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        
        const title = $("channel > title").text();
        const link = $("channel > link").text();
        const mylist_id = link.match(/[^/]+$/)[0];
        const description = $("channel > description").text();
        const creator = $("channel > dc\\:creator").text();

        const items = [];
        $("channel > item").each((i, el) => {
            const item = $(el);
            const link = item.find("link").text();
            const video_id = link.match(/[^/]+$/)[0];
            const description = this._parseCDATA(item.find("description").text());
            items.push( {
                no: i+1,
                title: item.find("title").text(),
                id: video_id,
                link: link,
                description: description.memo,
                thumb_img: description.thumbnail_src,
                length: description.length,
                date: description.date,
                view_count: description.num_view,
                comment_count: description.num_comment
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

    _parseCDATA(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        return {
            memo: $(".nico-memo").text(),
            thumbnail_src: $(".nico-thumbnail > img").attr("src"),
            length: $(".nico-info-length").text(),
            date: $(".nico-info-date").text(),
            num_view: $(".nico-numbers-view").text(),
            num_comment: $(".nico-numbers-res").text(),
        };
    }

    _isCorrect(mylist){
        return mylist.title 
        && mylist.mylist_id 
        && mylist.link 
        && mylist.creator
        && mylist.items.every(item => {
            return item.title 
                && item.id 
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
        return this.reader.parse(xml);
    }

    // TODO add delete file

    save(mylist_id, xml){
        const path = this._getFilePath(mylist_id);
        fs.writeFileSync(path, xml, "utf-8");
    }

    _getFilePath(mylist_id){
        const dir = this.get_dir_path;
        return path.join(dir, `mylist${mylist_id}.xml`);
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
                image.onload = (e) => {
                    const data = this._getBase64(e.target);
                    this._set(mylist_id, url, data);
                };
                image.src = url;
            }
            image.classList.add("gridtable-thumbnail", "mylist-img");
            return image.outerHTML;
        }else{
            return `<img src="${url}" class="gridtable-thumbnail mylist-img"/>`;
        }
    }

    setImage(mylist_id, img){
        this.loadCache(mylist_id);

        const url = img.src;
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
            if(this._existLocal(mylist_id) === false){
                this._delete(mylist_id);
            }   
        });
        
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
        return new CacheStore(this._dir_path, `mylist${mylist_id}-img.json`);
    }

    _delete(mylist_id){
        if(this._has(mylist_id) === false){
            return;
        }

        this._map.delete(mylist_id);
        try {
            const file_path = this._map.get(mylist_id).file_path;
            fs.unlinkSync(file_path);
        } catch(error) {
            logger.debug(`NicoMylistImageCache: delete mylistid=${mylist_id}, ${error}`);
        }
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