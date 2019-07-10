const fsPromises = require("fs").promises;
const path = require("path");
const EventEmitter = require("events");
const { NicoWatch, NicoComment, 
    getThumbInfo, filterComments, NicoThumbnail } = require("./niconico");
const { NicoJsonFile, NicoXMLFile } = require("./nico-data-file");
const { XMLDataConverter } = require("./xml-data-converter");
const { Library } = require("./library");

class NicoUpdate extends EventEmitter {
    /**
     * 
     * @param {String} video_id 
     * @param {Library} library 
     */
    constructor(video_id, library){
        super();

        this.video_id = video_id;
        this.library = library;
        this.nico_watch = null;
        this.nico_comment = null;
        this.nico_thumbnail = null;
    }

    /**
     * 
     * @returns {boolean} true:update false:not update 
     */
    async update(){
        const { video_info, dir_path } = await this._getVideoInfo();
        const api_data = await this._getApiData();

        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        await this._updateThumbInfo(api_data, nico_json);
        await this._updateComment(api_data, video_info, dir_path, nico_json);

        const thumbnail_size = "L";
        await this._updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json);

        if(!await this._isDBTypeJson()){
            await this._setDBtype("json");
        }

        return true;
    }

    async updateThumbInfo(){
        const { video_info, dir_path } = await this._getVideoInfo();
        const api_data = await this._getApiData();
        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        await this._updateThumbInfo(api_data, nico_json);

        if(!await this._isDBTypeJson()){
            this._convertComment(nico_xml, nico_json);
            await this._setDBtype("json");
        }else if(!await this._existPath(nico_json.commentPath)){
            this._convertComment(nico_xml, nico_json);    
        }

        return true;
    }

    async _updateThumbInfo(api_data, nico_json){
        await this._setTags(api_data.tags);

        const thumbInfo = getThumbInfo(api_data);
        await this._writeFile(nico_json.thumbInfoPath, thumbInfo, "json");
    }

    async updateComment(){
        const { video_info, dir_path } = await this._getVideoInfo(true);
        const api_data = await this._getApiData(true);
        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);

        const is_update = await this._updateComment(api_data, video_info, dir_path, nico_json);
        if(!is_update){
            return false;
        }
        
        if(!await this._isDBTypeJson()){  
            this._convertThumbInfo(nico_xml, nico_json);
            await this._setTags(api_data.tags);
            await this._setDBtype("json");
        }else if(!await this._existPath(nico_json.thumbInfoPath)){ 
            this._convertThumbInfo(nico_xml, nico_json);  
        }

        return true;
    }
    
    async _updateComment(api_data, video_info, dir_path, nico_json){
        const cur_comments = await this._getCurrentComments(dir_path, video_info);
        const comments_diff = await this._getComments(api_data, cur_comments);
        if(comments_diff.length===0){
            return false;
        }

        if(!this._validateComment(comments_diff)){
            throw new Error(`${this.video_id}の差分コメントが正しくないデータです`);
        }

        const new_comments = cur_comments.concat(filterComments(comments_diff));
        await this._writeFile(nico_json.commentPath, new_comments, "json");
        return true;
    }

    async updateThumbnail(){
        const { video_info, dir_path } = await this._getVideoInfo();
        const api_data = await this._getApiData();

        let thumbnail_size = null;
        if(await this._isDBTypeJson()){
            thumbnail_size = "L";
        }else{
            thumbnail_size = "S"; 
        }

        const { nico_xml, nico_json } = this._getNicoFileData(video_info, dir_path);
        return await this._updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json);
    }  

    async _updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json){
        let thumb_url = null;
        let img_path = null;
        
        if(thumbnail_size=="L"){
            thumb_url = api_data.video.largeThumbnailURL;
            nico_json.thumbnailSize = thumbnail_size;
            img_path = nico_json.thumbImgPath;
        }else{
            thumb_url = api_data.video.thumbnailURL;
            img_path = nico_xml.thumbImgPath;   
        }

        if(thumb_url===null){
            return false;
        }

        const thumbImg = await this._getThumbImg(thumb_url);
        
        if(!this._validateThumbnail(thumbImg)){
            throw new Error(`${this.video_id}のサムネイルが正しくないデータです`);
        }

        await this._writeFile(img_path, thumbImg, "binary");

        await this._setThumbnailSize(thumbnail_size);

        this.emit("updated-thumbnail", thumbnail_size, img_path); 

        return true;
    }  

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

    async _getApiData(ignore_deleted=false){
        let watch_data = null;
        try {
            watch_data = await this._getWatchData();
        } catch (error) {
            if(/404:/.test(error.message)){
                await this._setDeleted(true);
            }
            throw error;
        }        

        if(!this._validateWatchData(watch_data)){
            throw new Error(`${this.video_id}のwatch dataが正しくないデータです`);
        }

        const api_data = watch_data.api_data;
        const is_deleted = api_data.video.isDeleted;
        
        await this._setDeleted(is_deleted);

        if(ignore_deleted===true){
            return api_data;
        }

        if(is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }

        return api_data;
    }

    async _getVideoInfo(ignore_deleted=false){
        const video_info = await this.library._getVideoInfo(this.video_id);
        const dir_path = await this.library._getDir(video_info.dirpath_id);

        if(ignore_deleted===true){
            return { video_info, dir_path };
        }

        if(video_info.is_deleted===true){
            throw new Error(`${this.video_id}は削除されています`);
        }
        
        return { video_info, dir_path };
    }

    _getNicoFileData(video_info, dir_path){
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

    _convertComment(nico_xml, nico_json){
        const cnv_data = new XMLDataConverter();
        cnv_data.convertComment(nico_xml, nico_json); 
    }

    _convertThumbInfo(nico_xml, nico_json){
        const cnv_data = new XMLDataConverter();
        cnv_data.convertThumbInfo(nico_xml, nico_json);
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

    async _writeFile(file_path, data, encoding){
        const tmp_path = path.join(path.dirname(file_path), "_update.tmp");
        try {
            await this._write(tmp_path, data, encoding);
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

    async _write(file_path, data, encoding){
        if(encoding=="json"){
            const json = JSON.stringify(data, null, "  ");
            await fsPromises.writeFile(file_path, json, "utf-8");
            return;
        }

        if(encoding=="binary"){
            await fsPromises.writeFile(file_path, data, "binary");
            return;
        }

        throw new Error(`${encoding} is unkown encoding`);
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
        return comments_diff;
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
 
    _typeOf(obj) {
        const toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1).toLowerCase();
    }

    _validateWatchData(watch_data){
        if(this._typeOf(watch_data)!="object"){
            return false;
        }

        const api_data = watch_data.api_data;
        if(this._typeOf(api_data)!="object"){
            return false;
        }

        const video = api_data.video;
        if(this._typeOf(video)!="object"){
            return false;
        } 

        const thread = api_data.thread;
        if(this._typeOf(thread)!="object"){
            return false;
        }   
        
        const owner = api_data.owner;
        if(this._typeOf(owner)!="object"){
            return false;
        }   
        return true;
    }

    _validateComment(comments){
        if (!Array.isArray(comments)){
            return false;
        }

        if(comments.length>0){
            if(this._typeOf(comments[0])!="object"){
                return false;
            }
        }

        return true;
    }

    _validateThumbnail(bytes){
        if (!(bytes instanceof Uint8Array)){
            return false;
        }

        if(bytes.length<4){
            return false;
        }

        if(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length-2] === 0xff && bytes[bytes.length-1] === 0xd9) {
            return true;
        } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
            return true;
        }

        return false;
    }
}

module.exports = {
    NicoUpdate
};