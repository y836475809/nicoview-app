const fsPromises = require("fs").promises;
const path = require("path");
const { NicoWatch, NicoComment, 
    getThumbInfo, filterComments, NicoThumbnail } = require("./niconico");
const { NicoJsonFile } = require("./nico-data-file");
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
        // if(!await this._isDBTypeJson()){
        //     return false;
        // }

        const video_info = await this.library._getVideoInfo(this.video_id);
        if(video_info.is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const dir_path = await this.library._getDir(video_info.dirpath_id);
        const cur_comments = await this._getCurrentComments(dir_path, video_info);

        // const { is_deleted, tags, thumbInfo, comments } = await this._get(cur_comments);
        const { api_data, is_deleted, tags, thumbInfo } = await this._getThumbInfo();
        await this._setDeleted(is_deleted);

        if(is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const comments = await this._getComments(api_data, cur_comments);
        // await this._setDeleted(is_deleted);
        await this._setTags(tags);

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = video_info.common_filename;
        nico_json.videoType = video_info.video_type;

        await this._writeFile(nico_json.thumbInfoPath, thumbInfo);
        await this._writeFile(nico_json.commentPath, comments);

        //TODO
        await this._setDBtype("json");

        return true;
    }

    async updateThumbInfo(){
        const video_info = await this.library._getVideoInfo(this.video_id);
        if(video_info.is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const dir_path = await this.library._getDir(video_info.dirpath_id);

        const { api_data, is_deleted, tags, thumbInfo } = await this._getThumbInfo();
        await this._setDeleted(is_deleted);
        if(is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = video_info.common_filename;

        //TODO
        const cnv_data = new XMLDataConverter();
        cnv_data.convertCommnet()

        await this._writeFile(nico_json.thumbInfoPath, thumbInfo);

        return true;
    } 

    //TODO
    async updateThumbnail(){
        const video_info = await this.library._getVideoInfo(this.video_id);
        if(video_info.is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const dir_path = await this.library._getDir(video_info.dirpath_id);

        const { api_data, is_deleted, tags, thumbInfo } = await this._getThumbInfo();
        await this._setDeleted(is_deleted);
        if(is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = video_info.common_filename;

        const thumbImg = await this._getThumbImg(api_data.video.largeThumbnailURL);
        await this._writeBinary(nico_json.thumbImgPath, thumbImg);

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
        
        //TODO
        if(this.img_request){
            this.img_reuqest_canceled = true;
            this.img_request.abort();
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