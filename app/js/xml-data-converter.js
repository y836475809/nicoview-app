// const fs = require("fs");
const fsPromises = require("fs").promises;
// const util = require("util");
// const path = require("path");
const reader = require("./reader");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

class XMLDataConverter {
    /**
     * 
     * @param {NicoXMLFile} from 
     * @param {NicoJsonFile} to 
     */
    constructor(video_id, from, to){
        this.from = from; 
        this.to = to; 
    }

    async convertThumbinfo(){
        const xml = await fsPromises.readFile(this.from.thumbInfoPath, "utf-8");
        const data = this._cnvThumbInfo(xml);
        const json = JSON.stringify(data, null, "  ");
        // await fsPromises.writeFile(this.to.thumbInfoPath, json, "utf-8");
        await this._write(this.to.thumbInfoPath, json);
    }

    async convertComment(){
        const common_xml = await fsPromises.readFile(this.from.commentPath, "utf-8");
        const owner_xml = await fsPromises.readFile(this.from.ownerCommentPath, "utf-8");
        const data = this._cnvComment(common_xml, owner_xml);
        const json = JSON.stringify(data);
        await this._write(this.to.commentPath, json);
    }

    async _write(file_path, json){
        await fsPromises.writeFile(file_path, json, "utf-8");
    }

    _cnvComment(common_xml, owner_xml){
        const common_cmts = reader.comment(common_xml);
        const owner_cmts = reader.comment(owner_xml);
        return owner_cmts.concat(common_cmts);
    }

    _cnvThumbInfo(xml){
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

    // async _renameTmp(oldname, newname){
    //     const promisify_rename = util.promisify(fs.rename);
    //     await promisify_rename(oldname, newname);
    // }
}