const cheerio = require("cheerio");

class MylistReader {
    parse(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        
        const title = $("channel > title").text();
        const link = $("channel > link").text();
        const description = $("channel > description").text();
        const creator = $("channel > dc\\:creator").text();

        const items = [];
        $("channel > item").each((i, el) => {
            const item = $(el);
            
            const description = this._pdesc(item.find("description").text());
            items.push( {
                title: item.find("title").text(),
                link: item.find("link").text(),
                memo: description.memo,
                thumbnail_src: description.thumbnail_src,
                length: description.length,
                date: description.date,
                num_view: description.num_view,
                num_comment: description.num_comment
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

    _pdesc(xml){
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
                && item.link 
                && item.thumbnail_src
                && item.length
                && item.date;
        });
    }
}

module.exports = {
    MylistReader: MylistReader
};