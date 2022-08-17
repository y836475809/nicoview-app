const cheerio = require("cheerio");
const { toTimeSec } = require("./time-format");

/**
 * 
 * @param {String} value 
 * @returns {number}
 */
const getInt = (value) => {
    if(value===undefined){
        return 0;
    }
    return parseInt(value.replace(/,/g, ""));
};

const nicoSearchHtmlParse = (html, search_target) => {
    const $ = cheerio.load(html);

    const result = {
        total_num:0,
        list:[]
    };

    if(search_target == "tag"){
        const total_elm = $('.dataValue').filter(function() {
            const r =  $(this).text().trim().match(/タグを含む動画/);
            return r !== null;
        });
        const total = total_elm.find(".num").text();
        result.total_num = getInt(total);
    }else if(search_target == "search"){
        const total_elm = $(".searchTotal");
        const total = total_elm.text();
        result.total_num = getInt(total);
    }else{
        throw new Error(`search_target=${search_target}はtagでもsearchでもない`);
    }

    const elms = $("ul[data-video-list] > li[data-video-item]");
    elms.each((i, el) => {
        const video_item_elm = $(el);
        const video_id   = video_item_elm.data().videoId;
        const start_time = video_item_elm.find(".video_uploaded > .time").text();
        const thumb_url  = video_item_elm.find("img[data-thumbnail]").data().original;
        const video_len  = video_item_elm.find("span.videoLength").text();

        const item_content_elm = video_item_elm.find(".itemContent");
        const title    = item_content_elm.find(".itemTitle > a").text();
        const comments = item_content_elm.find(".itemComment").text().trim();
    
        const item_data_elm = video_item_elm.find(".itemData > .list");
        const view_count    = item_data_elm.find(".view > .value").text();
        const comment_count = item_data_elm.find(".comment > .value").text();

        const items = {
            thumbnailUrl:thumb_url,
            contentId:video_id,
            title:unescape(title),
            viewCounter:getInt(view_count),
            commentCounter:getInt(comment_count),
            lengthSeconds:toTimeSec(video_len),
            startTime:start_time,
            tags:comments,
        };

        let error_msg = "";
        Object.keys(items).forEach(key => {
            if(items[key]===undefined){
                error_msg += `${key}の値が不正, `;
            }
        });
        if(error_msg.length>0){
            throw new Error(`nicoSearchHtmlParse: ${error_msg}`);
        }

        result.list.push(items);
    });

    return result;
};

module.exports = {
    nicoSearchHtmlParse,
};