// const fs = require("fs");
const fsPromises = require("fs").promises;
// const util = require("util");
// const path = require("path");
const reader = require("./reader");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

const ConvertXMLDBItem = (item) => {
    return {
        _data_type: "video",
        _db_type: "json",
        dirpath_id: item.dirpath_id,
        video_id: item.video_id,
        video_name: item.video_name,
        video_type: item.video_type,
        common_filename: item.common_filename,
        is_economy: item.is_economy!==0,
        creation_date: item.creation_date,
        play_count: item.play_count,
        time: item.time,
        pub_date: item.pub_date,
        tags: item.tags
    };
};

class XMLDataConverter {
    /**
     * 
     * @param {NicoXMLFile} from 
     * @param {NicoJsonFile} to 
     */
    constructor(from, to){
        this.from = from; 
        this.to = to; 
    }

    async convert(){
        await this.convertThumbinfo();
        await this.convertComment();
    }

    async convertThumbinfo(){
        const xml = await fsPromises.readFile(this.from.thumbInfoPath, "utf-8");
        const data = this._convertThumbinfo(xml);
        await this._write(this.to.thumbInfoPath, data);
    }

    async convertComment(){
        const common_xml = await fsPromises.readFile(this.from.commentPath, "utf-8");
        const owner_xml = await fsPromises.readFile(this.from.ownerCommentPath, "utf-8");
        const data =  this._convertComment(common_xml, owner_xml);
        await this._write(this.to.commentPath, data);
    }

    async _write(file_path, data){
        const json = JSON.stringify(data, null, "  ");
        await fsPromises.writeFile(file_path, json, "utf-8");
    }

    _convertComment(common_xml, owner_xml){
        const common_cmts = reader.comment(common_xml);
        const owner_cmts = reader.comment(owner_xml);
        return owner_cmts.concat(common_cmts);
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
                id: obj.video_id,
                title: obj.title,
                description: obj.description,
                thumbnailURL: obj.thumbnail_url,
                largeThumbnailURL: obj.thumbnail_url,
                postedDateTime: obj.first_retrieve,
                duration: obj.length,
                viewCount: obj.view_counter,
                mylistCount: obj.mylist_counter,
                movieType: obj.video_type
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
    ConvertXMLDBItem,
    XMLDataConverter
};