const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { NicoClientRequest } = require("./nico-client-request");

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

    save(mylist_id, xml){
        const path = this._getFilePath(mylist_id);
        fs.writeFileSync(path, xml, "utf-8");
    }

    _getFilePath(mylist_id){
        const dir = this.get_dir_path;
        return path.join(dir, `mylist${mylist_id}.xml`);
    }
}

module.exports = {
    NicoMylist: NicoMylist,
    NicoMylistReader: NicoMylistReader,
    NicoMylistStore: NicoMylistStore
};