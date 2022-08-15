const fsPromises = require("fs").promises;
const NicoDataParser = require("./nico-data-parser");

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

module.exports = {
    XMLDataConverter,
};