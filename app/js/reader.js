
const cheerio = require("cheerio");

/**
 * 
 * @param {string} xml 
 */
function comment(xml) {
    let $ = cheerio.load(xml);
    let comments = [];
    $("chat").each(function (i, el) {
        const item = $(el);
        if(!item.attr("deleted")){
            const text = item.text();
            const no = parseInt(item.attr("no"));
            const vpos = parseInt(item.attr("vpos"));
            const date = parseInt(item.attr("date"));
            const user_id = item.attr("user_id");
            const mail = item.attr("mail");
            comments.push({
                no: no,
                vpos: vpos,
                date: date,
                user_id: user_id,
                mail: mail ? mail : "184",
                content: text
            });
        }
    });

    return comments;
}

/**
 * 
 * @param {string} xml 
 */
function thumb_info(xml) {
    let $ = cheerio.load(xml);

    const video_id = $("video_id").text();
    const title = $("title").text();
    const description = $("description").text();
    const thumbnail_url = $("thumbnail_url").text();
    const first_retrieve = $("first_retrieve").text();
    const length = $("length").text();
    const movie_type = $("movie_type").text();

    const size_high = parseInt($("size_high").text());
    const size_low = parseInt($("size_low").text());

    const view_counter = parseInt($("view_counter").text());
    const comment_num = parseInt($("comment_num").text());
    const mylist_counter = parseInt($("mylist_counter").text());
    const last_res_body = $("last_res_body").text();
    const watch_url = $("watch_url").text();
    const thumb_type = $("thumb_type").text();
    const embeddable = parseInt($("embeddable").text());
    const no_live_play = parseInt($("no_live_play").text());

    let tags = [];
    $("tag").each(function (i, el) {
        const item = $(el);
        const text = item.text();
        const lock = item.attr("lock");
        tags.push({ text: text, lock: lock == "1" ? true : false });
    });

    const user_id = $("user_id").text();
    const user_nickname = $("user_nickname").text();
    const user_icon_url = $("user_icon_url").text();

    return {
        video_id: video_id,
        title: title,
        description: description,
        thumbnail_url: thumbnail_url,
        first_retrieve: first_retrieve,
        length: length,
        video_type: movie_type,
        size_high: size_high,
        size_low: size_low,
        view_counter: view_counter,
        comment_counter: comment_num,
        mylist_counter: mylist_counter,
        last_res_body: last_res_body,
        watch_url: watch_url,
        thumb_type: thumb_type,
        embeddable: embeddable,
        no_live_play: no_live_play,
        tags: tags,
        user_id: user_id,
        user_nickname: user_nickname,
        user_icon_url: user_icon_url
    };
}

module.exports.comment = comment;
module.exports.thumb_info = thumb_info;