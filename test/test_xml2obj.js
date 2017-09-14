
const assert = require("power-assert");
const cheerio = require('cheerio');
const fs = require('fs');                                                             

class Xml2js{
    constructor(){

    }

    /**
     * 
     * @param {string} xml 
     */
    get_commnets(xml){
        let $ = cheerio.load(xml);
        let commnets =[]
        $("chat").each(function(i, el) {
            const item = $(el)
            const text = item.text()
            const no = parseInt(item.attr('no'))
            const vpos = parseInt(item.attr('vpos'))
            const date = parseInt(item.attr('date'))
            const user_id = item.attr('user_id')
            const mail = item.attr('mail')
            commnets.push({
                no:no, 
                vpos:vpos, 
                date:date, 
                user_id:user_id, 
                mail:mail, 
                text:text
            })
        }) 
        
        return commnets
    }
    
    /**
     * 
     * @param {string} xml 
     */
    get_info(xml){
        let $ = cheerio.load(xml);

        let video_id = $("video_id").text()
        let title = $("title").text()
        let description = $("description").text()
        let first_retrieve = $("first_retrieve").text()
        let length = $("length").text()
        let movie_type = $("movie_type").text()

        let size_high = parseInt($("size_high").text())
        let size_low = parseInt($("size_low").text())

        let view_counter = parseInt($("view_counter").text())
        let comment_num = parseInt($("comment_num").text())
        let mylist_counter = parseInt($("mylist_counter").text())
        let last_res_body = $("last_res_body").text()
        
        let tags = []
        $("tag").each(function(i, el) {
            const item = $(el)
            const text = item.text()
            const lock = item.attr('lock')
            tags.push({tag:text, lock:lock!==undefined?lock:""})
        })

        let user_id = $("user_id").text()
        let user_nickname = $("user_nickname").text()
        let user_icon_url = $("user_icon_url").text()

        return {
            video_id:video_id, 
            title:title, 
            description:description, 
            first_retrieve:first_retrieve,
            length:length,
            movie_type:movie_type,
            size_high:size_high,
            size_low:size_low,
            view_counter:view_counter,
            comment_num:comment_num,
            mylist_counter:mylist_counter,
            last_res_body:last_res_body,
            tags:tags,
            user_id:user_id,
            user_nickname:user_nickname,
            user_icon_url:user_icon_url
        }
    }
}

it("Xml2js comment", function () {
    const xml = fs.readFileSync("./sample/sample.xml", "utf-8");
    const js = new Xml2js()
    const obj = js.get_commnets(xml)
    assert.deepStrictEqual(obj[0], {no:1, vpos:400, date:1505310000, user_id:"AAA", mail:"naka medium 184", text:"AAAテスト"})

})

it("Xml2js info", function () {
    const xml = fs.readFileSync("./sample/sample[ThumbInfo].xml", "utf-8");
    const js = new Xml2js()
    const obj = js.get_info(xml)

    assert.equal(obj.video_id, "sm1000")

    assert.deepStrictEqual(obj.tags[0], {tag:"タグ1", lock:"1"})
    assert.deepStrictEqual(obj.tags[1], {tag:"タグ2", lock:""})
    assert.deepStrictEqual(obj.tags[2], {tag:"タグ3", lock:""})

})