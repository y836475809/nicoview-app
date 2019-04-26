const cheerio = require("cheerio");
const { NicoRequest } = require("./nico-request");

class NicoMylist extends NicoRequest {
    constructor(){
        super();
        this.req = null;
    }

    cancel(){   
        if (this.req) {
            this._cancel();
            this.req.abort();
        }
    }

    async getXML(mylist_id){
        const id = this._getID(mylist_id);
        return await this._getXML(id);
    }

    _getXML(id){
        const sort = 1;
        const url = `http://www.nicovideo.jp/mylist/${id}?rss=2.0&numbers=1&sort=${sort}`;
        
        return new Promise((resolve, reject) => {
            const options = {
                method: "GET",
                uri: url, 
                headers: {
                    "User-Agent": "node request module"
                },
                timeout: 5 * 1000
            };
            this.req = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(body); 
                }
            });       
        });
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
        const description = $("channel > description").text();
        const creator = $("channel > dc\\:creator").text();

        const items = [];
        $("channel > item").each((i, el) => {
            const item = $(el);
            const link = item.find("link").text();
            const id = link.match(/[^/]+$/)[0];
            const description = this._parseCDATA(item.find("description").text());
            items.push( {
                title: item.find("title").text(),
                id: id,
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

module.exports = {
    NicoMylist: NicoMylist,
    NicoMylistReader: NicoMylistReader
};