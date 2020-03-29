const fsPromises = require("fs").promises;
const reader = require("./reader");

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
        const owner_comment_data = reader.comment(owner_xml, true);
        const user_comment_data = reader.comment(user_xml, false);
        return owner_comment_data.concat(user_comment_data);
    }

    _convertThumbinfo(xml){
        const obj = reader.thumb_info(xml);
        const tags = obj.tags.map((tag, index)=>{
            return {
                id: index.toString(),
                name: tag.text,
                isLocked: tag.lock
            };
        });
        return {
            video: {
                video_id: obj.video_id,
                title: obj.title,
                description: obj.description,
                thumbnailURL: obj.thumbnail_url,
                largeThumbnailURL: obj.thumbnail_url,
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
}


module.exports = {
    XMLDataConverter
};