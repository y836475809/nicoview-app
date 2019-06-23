const fsPromises = require("fs").promises;
const path = require("path");
const { NicoWatch, NicoComment, 
    getThumbInfo, filterComments, NicoThumbnail } = require("./niconico");
const { NicoJsonFile, NicoXMLFile } = require("./nico-data-file");
const { XMLDataConverter } = require("./xml-data-converter");
const { Library } = require("./library");

class NicoUpdate {
    /**
     * 
     * @param {String} video_id 
     * @param {Library} library 
     */
    constructor(video_id, library){
        this.video_id = video_id;
        this.library = library;
        this.nico_watch = null;
        this.nico_comment = null;
        
        //TODO
        this.nico_thumbnail = null;
    }

    //TODO
    /**
     * 
     * @returns {boolean} true:update false:not update 
     */
    async update(){
        // const video_info = await this.library._getVideoInfo(this.video_id);
        // if(video_info.is_deleted===true){
        //     throw new Error(`${this.video_id}は削除されています`);
        // }

        // const dir_path = await this.library._getDir(video_info.dirpath_id);

        // const { api_data, is_deleted, tags, thumbInfo } = await this._getThumbInfo();

        // await this._setDeleted(is_deleted);
        // if(is_deleted===true){
        //     throw new Error(`${this.video_id}は削除されています`);
        // }
        // await this._setTags(tags);

        // const cur_comments = await this._getCurrentComments(dir_path, video_info);
        // const comments = await this._getComments(api_data, cur_comments);
        
        // const nico_json = new NicoJsonFile();
        // nico_json.dirPath = dir_path;
        // nico_json.commonFilename = video_info.common_filename;
        // nico_json.thumbnailSize = "S";

        // await this._writeFile(nico_json.thumbInfoPath, thumbInfo);
        // await this._writeFile(nico_json.commentPath, comments);

        // if(!await this._isDBTypeJson()){
        //     if(api_data.video.largeThumbnailURL!==null){
        //         const thumbImg = await this._getThumbImg(api_data.video.largeThumbnailURL);
        //         if(thumbImg!==null){                
        //             nico_json.thumbnailSize = "L";
        //             await this._writeBinary(nico_json.thumbImgPath, thumbImg);
                    
        //             await this._setThumbnailSize(nico_json.thumbnailSize);
        //         }
        //     }
        //     await this._setDBtype("json");
        // }
        const { video_info, dir_path } = await this._getVideoInfo(this.video_id);
        const api_data = await this._getApiData();

        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        await this._updateThumbInfo(api_data, nico_json);
        await this._updateComment(api_data, video_info, dir_path, nico_json);
        await this._updateThumbnail(api_data, video_info.thumbnail_size, nico_xml, nico_json);

        return true;
    }

    async updateThumbInfo(){
        const { video_info, dir_path } = await this._getVideoInfo(this.video_id);
        const api_data = await this._getApiData();

        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);
        // await this._setTags(api_data.tags);
        await this._updateThumbInfo(api_data, nico_json);

        // const thumbInfo = getThumbInfo(api_data);
        // await this._writeFile(nico_json.thumbInfoPath, thumbInfo);

        if(!await this._isDBTypeJson()){
            const cnv_data = new XMLDataConverter();
            cnv_data.convertComment(nico_xml, nico_json);
            await this._setDBtype("json");
        }else if(!await this._existPath(nico_json.commentPath)){
            const cnv_data = new XMLDataConverter();
            cnv_data.convertComment(nico_xml, nico_json);    
        }

        return true;
    }

    async _updateThumbInfo(api_data, nico_json){
        await this._setTags(api_data.tags);

        // const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        const thumbInfo = getThumbInfo(api_data);
        await this._writeFile(nico_json.thumbInfoPath, thumbInfo);
    }

    async updateComment(){
        const { video_info, dir_path } = await this._getVideoInfo(this.video_id);
        const api_data = await this._getApiData();

        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        // const cur_comments = await this._getCurrentComments(dir_path, video_info);
        // const comments = await this._getComments(api_data, cur_comments);

        // await this._writeFile(nico_json.commentPath, comments);
        await this._updateComment(api_data, video_info, dir_path, nico_json);

        if(!await this._isDBTypeJson()){
            await this._setTags(api_data.tags);

            const cnv_data = new XMLDataConverter();
            cnv_data.convertThumbInfo(nico_xml, nico_json);
            await this._setDBtype("json");
        }else if(!await this._existPath(nico_json.thumbInfoPath)){
            const cnv_data = new XMLDataConverter();
            cnv_data.convertThumbInfo(nico_xml, nico_json);    
        }

        return true;
    }
    
    async _updateComment(api_data, video_info, dir_path, nico_json){
        // const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        const cur_comments = await this._getCurrentComments(dir_path, video_info);
        const comments = await this._getComments(api_data, cur_comments);

        await this._writeFile(nico_json.commentPath, comments);
    }

    //TODO
    async updateThumbnail(){
        const { video_info, dir_path } = await this._getVideoInfo(this.video_id);
        const api_data = await this._getApiData();

        // let thumbImg = null;
        // if(video_info.thumbnail_size == "S"){
        //     thumbImg = await this._getThumbImg(api_data.video.thumbnailURL);
        // }
        // if(video_info.thumbnail_size == "L"){
        //     thumbImg = await this._getThumbImg(api_data.video.largeThumbnailURL);
        // }

        // if(thumbImg!==null){
        //     const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);
        //     let img_path = null;
        //     if(await this._isDBTypeJson()){
        //         img_path = nico_json.thumbImgPath;
        //     }else{
        //         img_path = nico_xml.thumbImgPath;
        //     }

        //     await this._writeBinary(img_path, thumbImg);
        // }
        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);
        await this._updateThumbnail(api_data, video_info.thumbnail_size, nico_xml, nico_json);

        return true;
    }  

    async _updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json){
        let thumbImg = null;
        if(thumbnail_size == "S"){
            thumbImg = await this._getThumbImg(api_data.video.thumbnailURL);
        }
        if(thumbnail_size == "L"){
            thumbImg = await this._getThumbImg(api_data.video.largeThumbnailURL);
        }

        if(thumbImg!==null){
            // const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);
            let img_path = null;
            if(await this._isDBTypeJson()){
                img_path = nico_json.thumbImgPath;
            }else{
                img_path = nico_xml.thumbImgPath;
            }

            await this._writeBinary(img_path, thumbImg);
        }

        return true;
    }  

    //TODO
    async _getThumbInfo(){
        const watch_data = await this._getWatchData();
        const api_data = watch_data.api_data;
        const is_deleted = api_data.video.isDeleted;
        const tags = api_data.tags;
        if(is_deleted===true){
            return { api_data, is_deleted: is_deleted, tags: tags, thumbInfo: null };
        }

        const thumbInfo = getThumbInfo(api_data);
        return { api_data, is_deleted, tags, thumbInfo };
    }

    async _getApiData(){
        const watch_data = await this._getWatchData();
        const api_data = watch_data.api_data;
        const is_deleted = api_data.video.isDeleted;
        
        await this._setDeleted(is_deleted);

        if(is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        return api_data;
    }

    async _getVideoInfo(){
        const video_info = await this.library._getVideoInfo(this.video_id);
        
        if(video_info.is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }
        const dir_path = await this.library._getDir(video_info.dirpath_id);

        return { video_info, dir_path };
    }

    async _getNicoFileData(video_info, dir_path){
        const nico_xml = new NicoXMLFile();
        nico_xml.dirPath = dir_path;
        nico_xml.commonFilename = video_info.common_filename;
        nico_xml.thumbnailSize = video_info.thumbnail_size;

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = video_info.common_filename;
        nico_json.thumbnailSize = video_info.thumbnail_size;

        return { nico_xml, nico_json };
    }

    async _getThumbImg(url){
        this.nico_thumbnail = new NicoThumbnail();
        return await this.nico_thumbnail.getThumbImg(url);
    }

    /**
     * 
     * @param {Array} comments 
     */
    async _get(cur_comments){
        const watch_data = await this._getWatchData();
        const is_deleted = watch_data.api_data.video.isDeleted;
        const tags = watch_data.api_data.tags;
        if(is_deleted===true){
            return { is_deleted: is_deleted, tags: tags, thumbInfo: null, comments: null };
        }

        const thumbInfo = getThumbInfo(watch_data.api_data);
        const comments = await this._getComments(watch_data.api_data, cur_comments);
        return { is_deleted, tags, thumbInfo, comments };
    }

    async _getCurrentComments(dir_path, video_info){
        return await this.library._getComments(dir_path, video_info);
    }

    async _isDBTypeJson(){
        const value = await this.library.getFieldValue(this.video_id, "_db_type");
        return value=="json";
    }

    async _isDeleted(){
        const value = await this.library.getFieldValue(this.video_id, "is_deleted");
        return value;
    }
    /**
     * 
     * @param {boolean} is_deleted 
     */
    async _setDeleted(is_deleted){
        await this.library.setFieldValue(this.video_id, "is_deleted", is_deleted);
    }

    async _setDBtype(db_type){
        await this.library.setFieldValue(this.video_id, "_db_type", db_type);
    }

    async _setThumbnailSize(thumbnail_size){
        await this.library.setFieldValue(this.video_id, "thumbnail_size", thumbnail_size);
    }

    async _setTags(tags){
        const tag_names = tags.map(value => {
            return value.name;
        });
        const cur_tags = await this.library.getFieldValue(this.video_id, "tags");
        const new_tags = Array.from(new Set([...cur_tags, ...tag_names]));
        await this.library.setFieldValue(this.video_id, "tags", new_tags);
    }
    
    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        } 
        if(this.nico_comment){
            this.nico_comment.cancel();
        }
        if(this.nico_thumbnail){
            this.nico_thumbnail.cancel();
        }        
    }

    async _writeFile(file_path, data){
        const tmp_path = path.join(path.dirname(file_path), "_update.tmp");
        try {
            await this._write(tmp_path, data);
        } catch (error) {
            await this._unlink(tmp_path);
            throw error;
        }     
        await this._rename(tmp_path, file_path);
    }

    //TODO
    async _writeBinary(file_path, data){
        const tmp_path = path.join(path.dirname(file_path), "_update-bin.tmp");
        try {
            await fsPromises.writeFile(tmp_path, data, "binary");
        } catch (error) {
            await this._unlink(tmp_path);
            throw error;
        }     
        await this._rename(tmp_path, file_path);
    }

    async _unlink(file_path){
        await fsPromises.unlink(file_path);
    }

    async _rename(old_path, new_path){
        await fsPromises.rename(old_path, new_path);
    }

    async _write(file_path, data){
        const json = JSON.stringify(data, null, "  ");
        await fsPromises.writeFile(file_path, json, "utf-8");
    }

    async _existPath(path){
        try {
            await fsPromises.stat(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async _getWatchData(){
        this.nico_watch = new NicoWatch();
        const watch_data = await this.nico_watch.watch(this.video_id);
        return watch_data;
    }

    async _getComments(api_data, cur_comments){
        this.nico_comment = new NicoComment(api_data);
        const res_from = this._getMaxCommentNo(cur_comments) + 1;
        const comments_diff = await this.nico_comment.getCommentDiff(res_from);
        return cur_comments.concat(filterComments(comments_diff));
    }

    /**
     * 
     * @param {Array} comments 
     */
    _getMaxCommentNo(comments){
        return Math.max.apply(null, comments.map(comment=>{
            return comment.no;
        }));
    }
}

module.exports = {
    NicoUpdate
};