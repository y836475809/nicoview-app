const fs = require("fs");
const path = require("path");
const { NicoWatch, NicoComment, NicoThumbnail } = require("./niconico");
const { NicoJsonFile, NicoXMLFile, NicoVideoData } = require("./nico-data-file");
const { XMLDataConverter } = require("./nico-data-converter");
const NicoDataParser = require("./nico-data-parser");
const { deepCopy } = require("./deepcopy");

class NicoUpdate {
    /**
     * 
     * @param {LibraryItem} [video_item] 
     */
    constructor(video_item){
        if(video_item){
            this.setVideoItem(video_item);
        }

        this.nico_watch = null;
        this.nico_comment = null;
        this.nico_thumbnail = null;
    }
    /**
     * 
     * @param {LibraryItem} video_item 
     */
    setVideoItem(video_item){
        this.video_item = video_item;
        this.org_video_item = deepCopy(video_item);
        this.video_data = new NicoVideoData(this.video_item); 
    }

    _getResult(update_thumbnail=false){
        const props = this._getChangedProps(this.org_video_item, this.video_item);
        return {
            video_id:this.video_item.video_id,
            props:props,
            update_thumbnail:update_thumbnail,
        };
    }

    _getChangedProps(org_item, updated_item){
        const updated_props = {};
        Object.keys(org_item).forEach(key=>{
            if(!Object.prototype.hasOwnProperty.call(updated_item, key)){
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

    /**
     * 
     * @returns {Promise<{video_id:string, props:{}, update_thumbnail:boolean}>}
     */
    async update(){
        this._checkVideoDeleted();

        const nico_api = await this._getNicoAPI();

        const { nico_xml, nico_json } = this._getNicoFileData();

        this._updateThumbInfo(nico_api, nico_json);
        await this._updateComment(nico_api, nico_json);

        const thumbnail_size = "L";
        await this._updateThumbnail(nico_api, thumbnail_size, nico_xml, nico_json);

        if(!this._isDataTypeJson()){
            this._setDataType("json");
        }

        return this._getResult(true);
    }

    async updateThumbInfo(){
        this._checkVideoDeleted();

        const nico_api = await this._getNicoAPI();
        const { nico_xml, nico_json } = this._getNicoFileData();

        this._updateThumbInfo(nico_api, nico_json);

        if(!this._isDataTypeJson()){
            await this._convertComment(nico_xml, nico_json);
            this._setDataType("json");
        }else if(!await this._existPath(nico_json.commentPath)){
            await this._convertComment(nico_xml, nico_json);    
        }

        return this._getResult();
    }

    _updateThumbInfo(nico_api, nico_json){
        this._setTags(nico_api.getTags());

        const thumbInfo = NicoDataParser.json_thumb_info(nico_api);
        this._writeFile(nico_json.thumbInfoPath, thumbInfo, "json");
    }

    async updateComment(){
        this._checkVideoDeleted(true);

        const nico_api = await this._getNicoAPI(true);
        const { nico_xml, nico_json } = this._getNicoFileData();

        const is_update = await this._updateComment(nico_api, nico_json);
        if(!is_update){
            return;
        }
        
        if(!this._isDataTypeJson()){  
            await this._convertThumbInfo(nico_xml, nico_json);
            this._setTags(nico_api.getTags());
            this._setDataType("json");
        }else if(!await this._existPath(nico_json.thumbInfoPath)){ 
            await this._convertThumbInfo(nico_xml, nico_json);  
        }

        return this._getResult();
    }
    
    async _updateComment(nico_api, nico_json){
        const { chats } = this._getCurrentCommentData();
        const new_comments = await this._getComments(nico_api);
        const marge_commnets = this._margeCommentData(chats, new_comments);
        if(marge_commnets.length > 0){
            if(!this._validateComment(marge_commnets)){
                throw new Error(`${this.video_item.video_id}の更新コメントが正しくないデータです`);
            }
            this._writeFile(nico_json.commentPath, marge_commnets, "json");
        }

        return true;
    }
    
    /**
     * 
     * @param {CommentChatData[]} cur_comments 
     * @param {CommentChatData[]} new_comments 
     * @returns {CommentChatData[]}
     */
    _margeCommentData(cur_comments, new_comments){
        const cur_no_set = new Set();
        cur_comments.forEach(item => {
            cur_no_set.add(item.chat.no);
        });
        const comments = new_comments.filter(item => {
            return !cur_no_set.has(item.chat.no);
        });
        if(comments.length == 0){
            return [];
        }
        return cur_comments.concat(comments);
    }

    async updateThumbnail(){
        this._checkVideoDeleted();

        const nico_api = await this._getNicoAPI();

        let thumbnail_size = null;
        if(this._isDataTypeJson()){
            thumbnail_size = "L";
        }else{
            thumbnail_size = "S"; 
        }

        const { nico_xml, nico_json } = this._getNicoFileData();
        const is_update = await this._updateThumbnail(nico_api, thumbnail_size, nico_xml, nico_json);
        if(!is_update){
            return;
        }

        return this._getResult(true);
    }  

    async _updateThumbnail(nico_api, thumbnail_size, nico_xml, nico_json){
        let thumb_url = null;
        let img_path = null;
        const thumbnail = nico_api.getVideo().thumbnail;
        if(thumbnail_size=="L"){
            thumb_url = thumbnail.largeUrl;
            nico_json.thumbnailSize = thumbnail_size;
            img_path = nico_json.thumbImgPath;
        }else{
            thumb_url = thumbnail.url;
            img_path = nico_xml.thumbImgPath;   
        }

        if(!thumb_url){
            return false;
        }

        const thumbImg = await this._getThumbImg(thumb_url);
        
        if(!this._validateThumbnail(thumbImg)){
            throw new Error(`${this.video_item.video_id}のサムネイルが正しくないデータです`);
        }

        this._writeFile(img_path, thumbImg, "binary");

        this._setThumbnailSize(thumbnail_size);

        return true;
    }  

    async _getNicoAPI(ignore_deleted=false){
        let watch_data = null;
        try {
            watch_data = await this._getWatchData();
        } catch (error) {
            if(/404:/.test(error.message)){
                this._setDeleted(true);
            }
            throw error;
        }        

        const nico_api = watch_data.nico_api;
        if(!nico_api.validate()){
            throw new Error(`${this.video_item.video_id}のwatch dataが正しくないデータです`);
        }

        const is_deleted = nico_api.isDeletedVideo();
        
        this._setDeleted(is_deleted);

        if(ignore_deleted===true){
            return nico_api;
        }

        if(is_deleted===true){
            throw new Error(`${this.video_item.video_id}は削除されています`);
        }

        return nico_api;
    }

    _checkVideoDeleted(ignore_deleted=false){
        if(ignore_deleted===true){
            return;
        }

        if(this.video_item.is_deleted===true){
            throw new Error(`${this.video_item.video_id}は削除されています`);
        }
    }

    _getNicoFileData(){
        const nico_xml = new NicoXMLFile(this.video_item.video_id);
        nico_xml.dirPath = this.video_item.dirpath;
        nico_xml.commonFilename = this.video_item.common_filename;
        nico_xml.thumbnailSize = this.video_item.thumbnail_size;

        const nico_json = new NicoJsonFile(this.video_item.video_id);
        nico_json.dirPath = this.video_item.dirpath;
        nico_json.commonFilename = this.video_item.common_filename;
        nico_json.thumbnailSize = this.video_item.thumbnail_size;

        return { nico_xml, nico_json };
    }

    async _getThumbImg(url){
        this.nico_thumbnail = new NicoThumbnail();
        return await this.nico_thumbnail.getThumbImg(url);
    }

    async _convertComment(nico_xml, nico_json){
        const cnv_data = new XMLDataConverter();
        await cnv_data.convertComment(nico_xml, nico_json); 
    }

    async _convertThumbInfo(nico_xml, nico_json){
        const cnv_data = new XMLDataConverter();
        await cnv_data.convertThumbInfo(nico_xml, nico_json);
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

    _writeFile(file_path, data, encoding){
        const tmp_path = path.join(path.dirname(file_path), "_update.tmp");
        try {
            this._write(tmp_path, data, encoding);
        } catch (error) {
            this._unlink(tmp_path);
            throw error;
        }     
        this._rename(tmp_path, file_path);
    }

    _unlink(file_path){
        fs.unlinkSync(file_path);
    }

    _rename(old_path, new_path){
        fs.renameSync(old_path, new_path);
    }

    _write(file_path, data, encoding){
        if(encoding=="json"){
            const json = JSON.stringify(data, null, "  ");
            fs.writeFileSync(file_path, json, "utf-8");
            return;
        }

        if(encoding=="binary"){
            fs.writeFileSync(file_path, data, "binary");
            return;
        }

        throw new Error(`${encoding} is unkown encoding`);
    }

    async _existPath(path){
        try {
            await fs.promises.stat(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async _getWatchData(){
        this.nico_watch = new NicoWatch();
        const watch_data = await this.nico_watch.watch(this.video_item.video_id);
        return watch_data;
    }

    async _getComments(nico_api){
        this.nico_comment = new NicoComment(nico_api);
        const comments = await this.nico_comment.getComment();
        return comments;
    }
 
    _typeOf(obj) {
        const toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1).toLowerCase();
    }

    _validateComment(comments){
        if (!Array.isArray(comments)){
            return false;
        }

        if(comments.length>0){
            const cm = comments[0];
            if(cm.chat===undefined){
                return false;
            }
            if(cm.chat.no===undefined){
                return false;
            }
            if(cm.chat.vpos===undefined){
                return false;
            }
            if(cm.chat.date===undefined){
                return false;
            }
            if(cm.chat.user_id===undefined){
                return false;
            }
            if(cm.chat.mail===undefined){
                return false;
            }
            if(cm.chat.content===undefined){
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