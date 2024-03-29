
const cheerio = require("cheerio");

/**
 * 
 * @param {string} xml 
 * @param {boolean} is_owner 
 * @returns {{threads:CommentThreadData[], chats:CommentChatData[]}}
 */
const xml_comment = (xml, is_owner) => {
    let $ = cheerio.load(xml);

    let threads = [];
    $("thread").each((i, el) => {
        const item = $(el);
        const obj = {
            resultcode:parseInt(item.attr("resultcode")),
            thread:item.attr("thread"),
            server_time:parseInt(item.attr("server_time")),
            last_res:parseInt(item.attr("last_res")),
            ticket:item.attr("ticket"),
            revision:parseInt(item.attr("revision"))
        };
        if(is_owner){
            obj.fork = 1;
        }
        threads.push({thread:obj});
    });

    let chats = [];
    $("chat").each(function (i, el) {
        const item = $(el);
        if(!item.attr("deleted")){
            const content = item.text();
            const no = parseInt(item.attr("no"));
            const vpos = parseInt(item.attr("vpos"));
            const date = parseInt(item.attr("date"));
            
            const obj = {
                no: no,
                vpos: vpos,
                date: date,
                content: content
            };
            if(is_owner){
                obj.fork = 1;
            }
            const mail = item.attr("mail");
            if(mail){
                obj.mail = mail;
            }
            const user_id = item.attr("user_id");
            if(user_id){
                obj.user_id = user_id;
            }
            chats.push({chat:obj});
        }
    });
    return {threads, chats};
};

const xml_thumb_info_tags = ($) => {
    const tags = [];
    $("tag").each(function (i, el) {
        const item = $(el);
        const text = item.text();
        const lock = item.attr("lock");
        const tag = { 
            text: text, 
            lock: lock == "1" ? true : false 
        };
        if(item.attr("category")){
            tag.category = true;
        }
        tags.push(tag);
    });
    return tags;
};

/**
 * 
 * @param {string} xml 
 */
const xml_thumb_info  = (xml) => {
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

    const tags = xml_thumb_info_tags($);

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
};

const json_thumb_info_tags = (nico_api_tags) => {
    return nico_api_tags.map((value) => {
        const tag = {
            name: value.name,
            isLocked: value.isLocked,
            isCategory: value.isCategory
        };
        return tag;
    });  
};

const json_thumb_info = (nico_api) => {
    const video = nico_api.getVideo();
    const owner = nico_api.getOwner();
    const tags = json_thumb_info_tags(nico_api.getTags());
    return {
        video: {
            video_id: video.id,
            title: video.title, 
            description: video.description, 
            thumbnailURL: video.thumbnail.url, 
            largeThumbnailURL: video.thumbnail.largeUrl, 
            postedDateTime: video.registeredAt, 
            duration: video.duration, 
            viewCount: video.count.view, 
            mylistCount: video.count.mylist, 
            video_type: video.videoType
        },
        thread: {
            commentCount: video.count.comment
        },
        tags: tags,
        owner: {
            id: owner?owner.id:"", 
            nickname: owner?owner.nickname:"", 
            iconURL: owner?owner.iconUrl:"", 
        }
    };
};

/**
 * 
 * @param {string} json_str 
 * @returns {{threads:CommentThreadData[], chats:CommentChatData[]}}
 */
const json_comment = (json_str) => {
    const json_data = JSON.parse(json_str);
    
    /** @type {CommentThreadData[]} */
    const threads = json_data.filter(value => {
        return Object.prototype.hasOwnProperty.call(value, "thread");
    });

    /** @type {CommentChatData[]} */
    const chats =  json_data.filter(value => {
        return Object.prototype.hasOwnProperty.call(value, "chat");
    }).filter(value => {
        return !Object.prototype.hasOwnProperty.call(value.chat, "deleted");
    });

    return {threads, chats};
};

/**
 * 
 * @param {CommentChatData[]} chats 
 * @returns {CommentItem[]}
 */
const makeComments = (chats) => {
    const comments = chats.filter(value => {
        return Object.prototype.hasOwnProperty.call(value, "chat") 
            && !Object.prototype.hasOwnProperty.call(value.chat, "deleted");
    }).map(value => {
        if(Object.prototype.hasOwnProperty.call(value.chat, "fork")){
            value.chat.user_id = "owner";
        }
        if(!Object.prototype.hasOwnProperty.call(value.chat, "mail")){
            value.chat.mail = "184";
        }
        return value.chat;
    });

    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    return comments;
};

module.exports = { 
    xml_comment,
    xml_thumb_info_tags,
    xml_thumb_info,
    json_thumb_info_tags,
    json_thumb_info,
    json_comment,
    makeComments,
};