// const fs = require("fs");
const fsPromises = require("fs").promises;
// const util = require("util");
// const path = require("path");
const reader = require("./reader");
const { createDBItem, Library } = require("./library");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

class XMLDataConverter {
    /**
     * 
     * @param {Library} library 
     * @param {*} video_id 
     */
    async convert(library, video_id){
        const video_info = await library._getVideoInfo(video_id);
        const dir_path = await library._getDir(video_info.dirpath_id);
        const cnv_item = this._convertItem(video_info);

        const nico_xml = new NicoXMLFile();
        nico_xml.dirPath = dir_path;
        nico_xml.commonFilename = cnv_item.common_filename;
        nico_xml.videoType = video_info.video_type;

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = cnv_item.common_filename;
        nico_json.videoType = video_info.video_type;

        const need_cnv = await this._need(video_info._db_type, nico_json);
        if(need_cnv===false){
            return false;
        }

        try {
            const thumbinfo_xml = await this._read(nico_xml.thumbInfoPath);
            await this._write(nico_json.thumbInfoPath, this._convertThumbinfo(thumbinfo_xml));

            const common_xml = await this._read(nico_xml.commentPath);
            const owner_xml = await this._read(nico_xml.ownerCommentPath);
            await this._write(nico_json.commentPath, this._convertComment(common_xml, owner_xml));

        } catch (error) {
            throw error;
        }
        await library.updateItem(cnv_item);

        return true;
    }

    async convertComment(nico_xml, nico_json){
        const common_xml = await this._read(nico_xml.commentPath);
        const owner_xml = await this._read(nico_xml.ownerCommentPath);
        await this._write(nico_json.commentPath, this._convertComment(common_xml, owner_xml));
    }

    async _need(db_type, nico_json){
        try {
            await this._stat(nico_json.thumbInfoPath);
            await this._stat(nico_json.commentPath);
        } catch (error) {
            return true;
        }

        if(db_type == "xml"){
            return true;
        }
        if(db_type == "json"){
            return false;
        }

        throw new Error(`${db_type} is unkown`);
    }

    async _stat(file_path){
        await fsPromises.stat(file_path);
    }

    _convertItem(item){
        const cnv_item = createDBItem();
        Object.assign(cnv_item, item);
        cnv_item._db_type = "json";
        return cnv_item;
    }

    async _read(file_path){
        return await fsPromises.readFile(file_path, "utf-8");
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