const fsPromises = require("fs").promises;
const path = require("path");
const EventEmitter = require("events");
const { NicoWatch, NicoComment, 
    getThumbInfo, NicoThumbnail } = require("./niconico");
const { NicoJsonFile, NicoXMLFile, NicoVideoData } = require("./nico-data-file");
const { XMLDataConverter } = require("./nico-data-converter");


class NicoUpdate extends EventEmitter {
    /**
     * 
     * @param {Object} video_item 
     */
    constructor(video_item){
        super();

        this.video_item = video_item;
        this.org_video_item = this._deepCopy(video_item);
        this.video_data = new NicoVideoData(this.video_item);

        this.nico_watch = null;
        this.nico_comment = null;
        this.nico_thumbnail = null;
    }

    _emitUpdated(update_thumbnail=false){
        const props = this._getChangedProps(this.org_video_item, this.video_item);
        this.emit("updated", this.video_item.id, props, update_thumbnail); 
    }

    _getChangedProps(org_item, updated_item){
        const updated_props = {};
        Object.keys(org_item).forEach(key=>{
            if(!updated_item.hasOwnProperty(key)){
                throw new Error(`${key} is not exist`);
            }
            const org_value = org_item[key];
            const updated_value = updated_item[key];
            if (Array.isArray(org_value)) {
                if(org_value.sort().toString() != updated_value.sort().toString()){
                    updated_props[key] = updated_value;
                } 
            }else if(org_value != updated_value){
                updated_props[key] = updated_value;
            }
        });
        return updated_props;
    }

    _deepCopy(obj){
        if ( typeof obj === "boolean" || typeof obj === "number" 
        || typeof obj === "string" || obj === null ) {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            const ret = [];
            obj.forEach(value => { 
                ret.push(this._deepCopy(value)); 
            });
            return ret;
        }
        
        if (typeof obj === "object") {
            const ret = {};
            Object.keys(obj).forEach(key => {
                ret[key] = this._deepCopy(obj[key]);
            });
            return ret;
        }

        return null;
    }

    /**
     * 
     * @returns {boolean} true:update false:not update 
     */
    async update(){
        this._checkVideoDeleted();

        const api_data = await this._getApiData();

        const { nico_xml, nico_json } = this._getNicoFileData();

        await this._updateThumbInfo(api_data, nico_json);
        await this._updateComment(api_data, nico_json);

        const thumbnail_size = "L";
        await this._updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json);

        if(!this._isDataTypeJson()){
            this._setDataType("json");
        }

        this._emitUpdated(true);
    }

    async updateThumbInfo(){
        this._checkVideoDeleted();

        const api_data = await this._getApiData();
        const { nico_xml, nico_json } = this._getNicoFileData();

        await this._updateThumbInfo(api_data, nico_json);

        if(!this._isDataTypeJson()){
            this._convertComment(nico_xml, nico_json);
            this._setDataType("json");
        }else if(!await this._existPath(nico_json.commentPath)){
            this._convertComment(nico_xml, nico_json);    
        }

        this._emitUpdated();
    }

    async _updateThumbInfo(api_data, nico_json){
        this._setTags(api_data.tags);

        const thumbInfo = getThumbInfo(api_data);
        await this._writeFile(nico_json.thumbInfoPath, thumbInfo, "json");
    }

    async updateComment(){
        this._checkVideoDeleted(true);

        const api_data = await this._getApiData(true);
        const { nico_xml, nico_json } = this._getNicoFileData();

        const is_update = await this._updateComment(api_data, nico_json);
        if(!is_update){
            return;
        }
        
        if(!this._isDataTypeJson()){  
            this._convertThumbInfo(nico_xml, nico_json);
            this._setTags(api_data.tags);
            this._setDataType("json");
        }else if(!await this._existPath(nico_json.thumbInfoPath)){ 
            this._convertThumbInfo(nico_xml, nico_json);  
        }

        this._emitUpdated();
    }
    
    async _updateComment(api_data, nico_json){
        const cur_comment_data = this._getCurrentCommentData();
        const cur_comments = cur_comment_data.filter(value => {
            return value.hasOwnProperty("chat");
        }).map(value => {
            return {
                no: value.no
            };
        });
        const comments_diff = await this._getComments(api_data, cur_comments);
        if(comments_diff.length===0){
            return false;
        }

        if(!this._validateComment(comments_diff)){
            throw new Error(`${this.video_item.id}の差分コメントが正しくないデータです`);
        }

        const updated_comment_data =this._margeCommentData(cur_comment_data, comments_diff);
        await this._writeFile(nico_json.commentPath, updated_comment_data, "json");
        return true;
    }

    _margeCommentData(current_data, diff_data){
        const current = this._getCommentDataProps(current_data);
        const diff = this._getCommentDataProps(diff_data);

        let owner_threads = current.owner_threads;
        if(diff.owner_threads.length>0){
            owner_threads = diff.owner_threads; 
        }

        let user_threads = current.user_threads;
        if(diff.user_threads.length>0){
            user_threads = diff.user_threads; 
        }
        const comments = current.comments.concat(diff.comments);
        
        return owner_threads.concat(user_threads).concat(comments);
    }

    _getCommentDataProps(comment_data){
        const threads = comment_data.filter(value => {
            return value.hasOwnProperty("thread");
        });
        const owner_threads = threads.filter(value => {
            return value.thread.hasOwnProperty("fork");
        });
        const user_threads = threads.filter(value => {
            return !value.thread.hasOwnProperty("fork");
        });
        const comments = comment_data.filter(value => {
            return value.hasOwnProperty("chat");
        });

        return {
            owner_threads,
            user_threads,
            comments
        };
    }

    async updateThumbnail(){
        this._checkVideoDeleted();

        const api_data = await this._getApiData();

        let thumbnail_size = null;
        if(this._isDataTypeJson()){
            thumbnail_size = "L";
        }else{
            thumbnail_size = "S"; 
        }

        const { nico_xml, nico_json } = this._getNicoFileData();
        const is_update = await this._updateThumbnail(api_data, thumbnail_size, nico_xml, nico_json);
        if(!is_update){
            return;
        }
        this._emitUpdated(true);
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
            throw new Error(`${this.video_item.id}のサムネイルが正しくないデータです`);
        }

        await this._writeFile(img_path, thumbImg, "binary");

        this._setThumbnailSize(thumbnail_size);

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
                this._setDeleted(true);
            }
            throw error;
        }        

        if(!this._validateWatchData(watch_data)){
            throw new Error(`${this.video_item.id}のwatch dataが正しくないデータです`);
        }

        const api_data = watch_data.api_data;
        const is_deleted = api_data.video.isDeleted;
        
        this._setDeleted(is_deleted);

        if(ignore_deleted===true){
            return api_data;
        }

        if(is_deleted===true){
            throw new Error(`${this.video_item.id}は削除されています`);
        }

        return api_data;
    }

    _checkVideoDeleted(ignore_deleted=false){
        if(ignore_deleted===true){
            return;
        }

        if(this.video_item.is_deleted===true){
            throw new Error(`${this.video_item.id}は削除されています`);
        }
    }

    _getNicoFileData(){
        const nico_xml = new NicoXMLFile();
        nico_xml.dirPath = this.video_item.dirpath;
        nico_xml.commonFilename = this.video_item.common_filename;
        nico_xml.thumbnailSize = this.video_item.thumbnail_size;

        const nico_json = new NicoJsonFile();
        nico_json.dirPath = this.video_item.dirpath;
        nico_json.commonFilename = this.video_item.common_filename;
        nico_json.thumbnailSize = this.video_item.thumbnail_size;

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

    _getCurrentComments(){
        return this.video_data.getComments();
    }

    _getCurrentCommentData(){
        return this.video_data.getCommentData();
    }

    _isDataTypeJson(){
        const value = this.video_item.data_type;
        return value=="json";
    }

    /**
     * 
     * @param {boolean} is_deleted 
     */
    _setDeleted(is_deleted){
        this.video_item.is_deleted = is_deleted;
    }

    _setDataType(data_type){
        this.video_item.data_type = data_type;
    }

    _setThumbnailSize(thumbnail_size){
        this.video_item.thumbnail_size = thumbnail_size;
    }

    _setTags(tags){
        const tag_names = tags.map(value => {
            return value.name;
        });
        const cur_tags = this.video_item.tags;
        const new_tags = Array.from(new Set([...cur_tags, ...tag_names]));
        this.video_item.tags = new_tags;
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
        const watch_data = await this.nico_watch.watch(this.video_item.id);
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