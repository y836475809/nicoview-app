const fsPromises = require("fs").promises;
const NicoDataParser = require("./nico-data-parser");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");
const { getWatchURL } = require("./nico-url");
const { toTimeString } = require("./time-format");

class XMLDataConverter {
    async convertThumbInfo(nico_xml, nico_json){
        const thumbinfo_xml = await this._read(nico_xml.thumbInfoPath);
        await this._write(nico_json.thumbInfoPath, this._convertThumbinfo(thumbinfo_xml));
    }

    async convertComment(nico_xml, nico_json){
        const owner_xml = await this._read(nico_xml.ownerCommentPath);
        const user_xml = await this._read(nico_xml.commentPath);
        
        await this._write(nico_json.commentPath, this._convertComment(owner_xml, user_xml));
    }

    async _read(file_path){
        return await fsPromises.readFile(file_path, "utf-8");
    }

    async _write(file_path, data){
        const json = JSON.stringify(data, null, "  ");
        await fsPromises.writeFile(file_path, json, "utf-8");
    }

    _convertComment(owner_xml, user_xml){
        const owner_comment_data = NicoDataParser.xml_comment(owner_xml, true);
        const user_comment_data = NicoDataParser.xml_comment(user_xml, false);
        return owner_comment_data.concat(user_comment_data);
    }

    _convertThumbinfo(xml){
        const obj = NicoDataParser.xml_thumb_info(xml);
        const tags = this._convertTags(obj.tags);
        return {
            video: {
                video_id: obj.video_id,
                title: obj.title,
                description: obj.description,
                thumbnailURL: obj.thumbnail_url,
                largeThumbnailURL: obj.thumbnail_url + ".L",
                postedDateTime: obj.first_retrieve,
                duration: obj.length,
                viewCount: obj.view_counter,
                mylistCount: obj.mylist_counter,
                video_type: obj.video_type
            },
            thread: {
                commentCount: obj.comment_counter
            },
            tags: tags,
            owner: {
                id: obj.user_id,
                nickname: obj.user_nickname,
                iconURL: obj.user_icon_url
            }
        };
    }

    _convertTags(tags){
        return tags.map((tag, index)=>{
            const obj = {
                id: index.toString(),
                name: tag.text,
                isLocked: tag.lock
            };
            if(tag.category === true){
                obj.category = true;
            }
            return obj;
        });
    }
}

class JsonDataConverter {
    constructor(video_item){
        const { nico_xml, nico_json } = this._getNicoFileData(video_item);
        this.nico_xml = nico_xml;
        this.nico_json = nico_json;
    }
    async convertThumbInfo(){
        const thumbinfo_json = await this._read(this.nico_json.thumbInfoPath);
        await this._write(this.nico_xml.thumbInfoPath, this._convertThumbinfo(thumbinfo_json));
    }

    async convertComment(){
        const comment_json = JSON.parse(await this._read(this.nico_json.commentPath));
        const { owner_comment_xml, user_comment_xml } = this._convertComment(comment_json);
        await this._write(this.nico_xml.ownerCommentPath, owner_comment_xml);
        await this._write(this.nico_xml.commentPath, user_comment_xml);
    }

    async convertThumbnai(){
        if(this.nico_json.thumbImgPath == this.nico_xml.thumbImgPath){
            return;
        }
        await this._copyFile(this.nico_json.thumbImgPath, this.nico_xml.thumbImgPath);
    }

    _getNicoFileData(video_item){
        const nico_xml = new NicoXMLFile(video_item.id);
        nico_xml.dirPath = video_item.dirpath;
        nico_xml.commonFilename = video_item.common_filename;

        const nico_json = new NicoJsonFile(video_item.id);
        nico_json.dirPath = video_item.dirpath;
        nico_json.commonFilename = video_item.common_filename;
        nico_json.thumbnailSize = video_item.thumbnail_size;

        return { nico_xml, nico_json };
    }

    /**
     * 
     * @param {Array} comment_json 
     */
    _convertComment(comment_json){
        const threads = comment_json.filter(value => {
            return Object.prototype.hasOwnProperty.call(value, "thread");
        }).map(value => {
            return value.thread;
        });
        const comments = comment_json.filter(value => {
            return Object.prototype.hasOwnProperty.call(value, "chat") 
                && !Object.prototype.hasOwnProperty.call(value.chat, "deleted");
        }).map(value => {
            return value.chat;
        });

        const owner_threads = threads.filter(value => {
            return Object.prototype.hasOwnProperty.call(value, "fork");
        });
        const user_threads = threads.filter(value => {
            return !Object.prototype.hasOwnProperty.call(value, "fork");
        });

        const owner_comments = comments.filter(value => {
            return Object.prototype.hasOwnProperty.call(value, "fork");
        });
        const user_comments = comments.filter(value => {
            return !Object.prototype.hasOwnProperty.call(value, "fork");
        });

        const user_thread = {
            thread: user_threads[0].thread,
            last_res: user_comments.length,
            ticket: user_threads[0].ticket,
            revision: user_threads[0].revision,
            server_time: user_threads[0].server_time,  
        };
        const owner_thread = Object.assign({}, user_thread);
        owner_thread.fork = 1;

        if(owner_threads.length==0){
            owner_thread.ticket = 0;
            owner_thread.last_res = 0;
        }else{
            owner_thread.thread = owner_threads[0].thread;
            owner_thread.last_res = owner_comments.length;
            owner_thread.ticket = owner_threads[0].ticket;
            owner_thread.revision = owner_threads[0].revision;
            owner_thread.server_time = owner_threads[0].server_time;
        }

        const owner_comment_xml = [
            "<packet>",
            `<thread resultcode="0" thread="${owner_thread.thread}" last_res="${owner_thread.last_res}" ticket="${owner_thread.ticket}" revision="${owner_thread.revision}" fork="1" server_time="${owner_thread.server_time}"/>`,
            owner_comments.map(value => {
                const no = value.no;
                const vpos = value.vpos;
                const date = value.date;
                const mail = value.mail;
                const content = value.content;
                return `<chat thread="${owner_thread.thread}" no="${no}" vpos="${vpos}" date="${date}" mail="${mail}" fork="1">${content}</chat>`;
            }).join("\r\n"),
            "</packet>"
        ].join("\r\n");

        const user_comment_xml = [
            "<packet>",
            `<thread resultcode="0" thread="${user_thread.thread}" last_res="${user_thread.last_res}" ticket="${user_thread.ticket}" revision="${user_thread.revision}" server_time="${user_thread.server_time}"/>`,
            user_comments.map(value => {
                const no = value.no;
                const vpos = value.vpos;
                const date = value.date;
                const mail = value.mail;
                const user_id = value.user_id;
                const content = value.content;
                return `<chat thread="${user_thread.thread}" no="${no}" vpos="${vpos}" date="${date}" mail="${mail}" user_id="${user_id}">${content}</chat>`;
            }).join("\r\n"),
            "</packet>"
        ].join("\r\n");

        return { owner_comment_xml, user_comment_xml };
    }

    _convertDate(date_str){
        const d = new Date(date_str);

        const year = d.getFullYear();
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const day = ("0" + d.getDate()).slice(-2);
        const hour = ("0" + d.getHours()).slice(-2);
        const min = ("0" + d.getMinutes()).slice(-2);
        const sec = ("0" + d.getSeconds()).slice(-2);

        const offset = -d.getTimezoneOffset();
        const offset_hour = ("0" + Math.floor(offset / 60)).slice(-2);
        const offset_min = ("0" + Math.floor(offset % 60)).slice(-2);

        return `${year}-${month}-${day}T${hour}:${min}:${sec}+${offset_hour}:${offset_min}`;
    }

    /**
     * 
     * @param {String} description 
     */
    _convertDescription(description){
        return description
            .replace(/&/g, "&amp;")
            .replace(/>/g, "&gt;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;");
    }

    /**
     * 
     * @param {Array} tags 
     */
    _convertTags(tags, prefix=""){
        return tags.map(value => {
            const lock = value.isLocked===true?" lock=\"1\"":"";
            const category = value.category===true?" category=\"1\"":"";
            return `${prefix}<tag${category}${lock}>${value.name}</tag>`;
        }).join("\r\n");
    }

    _convertThumbinfo(json){
        const thumb_info = JSON.parse(json);
        const video = thumb_info.video;
        const video_id = video.video_id;
        const title = video.title;
        const description = this._convertDescription(video.description);
        const thumbnail_url = video.thumbnailURL;
        const first_retrieve = this._convertDate(video.postedDateTime);
        const time = toTimeString(video.duration);
        const movie_type = video.video_type;
        const view_counter = video.viewCount;

        const comment_num = thumb_info.thread.commentCount;
        const mylist_counter = video.mylistCount;

        const user_id       = thumb_info.owner.id;
        const user_nickname = thumb_info.owner.nickname;
        const user_icon_url = thumb_info.owner.iconURL;

        const tags = this._convertTags(thumb_info.tags, "      ");

        const watch_url = getWatchURL(video_id);
        const xml = [
            "<nicovideo_thumb_response status=\"ok\">",
            "  <thumb>",
            `    <video_id>${video_id}</video_id>`,
            `    <title>${title}</title>`,
            `    <description>${description}</description>`,
            `    <thumbnail_url>${thumbnail_url}</thumbnail_url>`,
            `    <first_retrieve>${first_retrieve}</first_retrieve>`,
            `    <length>${time}</length>`,
            `    <movie_type>${movie_type}</movie_type>`,
            "    <size_high>0</size_high>",
            "    <size_low>0</size_low>",
            `    <view_counter>${view_counter}</view_counter>`,
            `    <comment_num>${comment_num}</comment_num>`,
            `    <mylist_counter>${mylist_counter}</mylist_counter>`,
            "    <last_res_body></last_res_body>",
            `    <watch_url>${watch_url}</watch_url>`,
            "    <thumb_type>video</thumb_type>",
            "    <embeddable>1</embeddable>",
            "    <no_live_play>0</no_live_play>",
            "    <tags domain=\"jp\">",
            `${tags}`,
            "    </tags>",
            `    <user_id>${user_id}</user_id>`,
            `    <user_nickname>${user_nickname}</user_nickname>`,
            `    <user_icon_url>${user_icon_url}</user_icon_url>`,
            "  </thumb>",
            "</nicovideo_thumb_response>"
        ].join("\r\n");

        return xml;
    }

    async _read(file_path){
        return await fsPromises.readFile(file_path, "utf-8");
    }

    async _write(file_path, data){
        await fsPromises.writeFile(file_path, data, "utf-8");
    }

    async _copyFile(src_file_path, dist_file_path){
        await fsPromises.copyFile(src_file_path, dist_file_path);
    }
}

module.exports = {
    XMLDataConverter,
    JsonDataConverter
};