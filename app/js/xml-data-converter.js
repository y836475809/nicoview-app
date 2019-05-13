const fs = require("fs");
const fsPromises = require("fs").promises;
const util = require("util");
const path = require("path");
const reader = require("./reader");

class XMLDataConverter {
    constructor(video_id){
        this.video_id = video_id; 
    }
    
    async convertThumbinfo(thumbinfo_filepath){
        const xml = await fsPromises.readFile(thumbinfo_filepath, "utf-8");
        const data = this._cnvThumbInfo(xml);
        const json = JSON.stringify(data, null, "  ");

        const dir = path.dirname(thumbinfo_filepath);
        const dist_path = path.join(dir,`${this.video_id}[ThumbInfo].json`);
        await fsPromises.writeFile(dist_path, json, "utf-8");
    }

    async convertComment(common_filepath, owner_filepath){
        const common_xml = await fsPromises.readFile(common_filepath, "utf-8");
        const owner_xml = await fsPromises.readFile(owner_filepath, "utf-8");
        const data = this._cnvComment(common_xml, owner_xml);
        const json = JSON.stringify(data);

        const dir = path.dirname(common_filepath);
        const dist_path = path.join(dir,`${this.video_id}[Comment].json`);
        await fsPromises.writeFile(dist_path, json, "utf-8");
    }

    async renameThumbImg(old_filepath){
        const dir = path.dirname(old_filepath);
        const ext = path.extname(old_filepath);
        const new_path = path.join(dir, `${this.video_id}[ThumbImg]${ext}`);
        await fsPromises.rename(old_filepath, new_path);
        // await this._renameTmp(old_filepath, new_path);
    }
    async renameVideo(old_filepath){
        const dir = path.dirname(old_filepath);
        const ext = path.extname(old_filepath);
        const new_path = path.join(dir, `${this.video_id}${ext}`);
        // await this._renameTmp(old_filepath, new_path);
        await fsPromises.rename(old_filepath, new_path);
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