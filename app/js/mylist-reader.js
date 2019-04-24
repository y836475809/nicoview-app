const cheerio = require("cheerio");

class MylistReader {
    parse(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        // const doc = new JSDOM(xml, {contentType:"text/xml"}).window.document;
        
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
                date: description.date
            });
        });
        // const items = 
        //     Array.from(doc.querySelectorAll("channel > item")).map(item => {
        //         const description = this._pdesc(item.querySelector("description").textContent);
        //         return {
        //             title: item.querySelector("title").textContent,
        //             link: item.querySelector("link").textContent,
        //             memo: description.memo,
        //             thumbnail_src: description.thumbnail_src,
        //             length: description.length,
        //             date: description.date
        //         };
        //     });

        return {
            title: title,
            link: link,
            creator: creator,
            description: description,
            items: items
        };
    }

    _pdesc(xml){
        const $ = cheerio.load(xml, {xmlMode: true});
        return {
            memo: $(".nico-memo").text(),
            thumbnail_src: $(".nico-thumbnail > img").attr("src"),
            length: $(".nico-info-length").text(),
            date: $(".nico-info-date").text(),
        };
    }
}

module.exports = {
    MylistReader: MylistReader
};