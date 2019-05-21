const fsPromises = require("fs").promises;
const path = require("path");
const { NicoWatch, NicoComment, 
    getThumbInfo, filterComments } = require("./niconico");
const { NicoJsonFile } = require("./nico-data-file");
const Library = require("./library");

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
    }

    /**
     * 
     * @param {Array} cur_comments 
     * @returns {boolean} true:update false:not update 
     */
    async update(cur_comments){
        if(!await this._isDBTypeJson()){
            return false;
        }
        if(await this._isDeleted()===true){
            return false;
        }

        const { is_deleted, thumbInfo, comments } = await this._get(cur_comments);
        await this._setDeleted(is_deleted);

        if(is_deleted===true){
            return true;
        }

        const video_info = await this.library._getVideoInfo(this.video_id);
        const dir_path = await this.library._getDir(video_info.dirpath_id);
        
        const nico_json = new NicoJsonFile();
        nico_json.dirPath = dir_path;
        nico_json.commonFilename = video_info.common_filename;
        nico_json.videoType = video_info.video_type;

        await this._writeFile(nico_json.thumbInfoPath, thumbInfo);
        await this._writeFile(nico_json.commentPath, comments);

        return true;
    }
    /**
     * 
     * @param {Array} comments 
     */
    async _get(cur_comments){
        const watch_data = await this._getWatchData();
        
        const is_deleted = watch_data.api_data.video.isDeleted;
        if(is_deleted===true){
            return { is_deleted: is_deleted, thumbInfo: null, comments: null };
        }

        const thumbInfo = getThumbInfo(watch_data.api_data);
        const comments = await this._getComments(watch_data.api_data, cur_comments);
        return { is_deleted, thumbInfo, comments };
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
        this.library.setFieldValue(this.video_id, "is_deleted", is_deleted);
    }
    
    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        } 
        if(this.nico_comment){
            this.nico_comment.cancel();
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