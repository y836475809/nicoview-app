
const fs = require("fs");
const reader = require("./reader");
const Datastore = require("nedb");

class Library {
    constructor(video_db_file, dir_db_file, in_memory_only=false) {
        this.db = {};
        this.db.video = new Datastore({ 
            filename: video_db_file,
            autoload: true,
            inMemoryOnly: in_memory_only
        });   
        this.db.dir = new Datastore({ 
            filename: dir_db_file,
            autoload: true,
            inMemoryOnly: in_memory_only
        }); 
    }

    /**
     * 
     * @param {Array} dir_list
     * @param {Array} video_list
     */
    async setData(dir_list, video_list) {
        await this._clear(this.db.dir);
        await this._clear(this.db.video);
        await this._setData(this.db.dir, this._normalizePath(dir_list));
        await this._setData(this.db.video, video_list);
    }

    _setData(db, data_list) {
        return new Promise((resolve, reject) => {
            db.insert(data_list, (err, new_doc) => {
                if(err){
                    reject(reject);
                    return;
                }
                resolve();
            });
        });
    }

    _clear(db){
        return new Promise((resolve, reject) => {
            db.remove({}, { multi: true }, (err, num_removed) => {
                if(err){
                    reject(err);
                    return;
                }  
                resolve();     
            });
        });
    }

    /**
     * @param {Array} dir_list
     */
    _normalizePath(dir_list){
        return dir_list.map(value=>{
            return {
                dirpath_id: value.dirpath_id,
                dirpath: value.dirpath.replace(/^(file:\/\/\/)|^(file:\/\/)/i, "")
            };
        });
    }

    /**
     * 
     * @param {string} id 
     */
    findComments(id) {
        const file_path = this.getCommentPath(id);
        const xml = fs.readFileSync(file_path, "utf-8");
        let comments = reader.comment(xml);
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
        return comments;
    }

    /**
     * 
     * @param {string} id 
     */
    findThumbInfo(id) {
        const path = this.getThumbInfoPath(id);
        const xml = fs.readFileSync(path, "utf-8");
        return reader.thumb_info(xml);
    }

    async getVideoType(id){
        const video_info = await this.getVideoInfo(id);
        return video_info.video_type;
    }

    /**
     * 
     * @param {string} dirpath_id 
     * @param {string} filename 
     */
    getPath(dirpath_id, filename) {
        return new Promise((resolve, reject) => {
            this.db.dir.find({ dirpath_id: dirpath_id }, (err, docs) => {
                if(docs.length==0){
                    reject(new Error(`not find dir_path, dirpath_id=${dirpath_id}`));
                    return;
                }
                resolve(`${docs[0].dirpath}/${filename}`);
            });
        });
    }

    getVideoInfo(id) {
        return new Promise((resolve, reject) => {
            this.db.video.find({ video_id: id }, (err, docs) => {   
                if(docs.length==0){
                    reject(new Error(`not find video_info, id=${id}`));
                    return;
                }
                delete docs[0]._id;
                resolve(docs[0]);
            });
        });
    }

    /**
     * 
     * @param {string} id 
     */
    async getVideoPath(id) {
        const video_info = await this.getVideoInfo(id);
        return await this.getPath(
            video_info.dirpath_id, 
            video_info.video_filename);
    }
    /**
     * 
     * @param {string} id 
     */
    async getCommentPath(id) {
        const video_info = await this.getVideoInfo(id);
        return await this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}].xml`);
    }

    async getThumbInfoPath(id) {
        const video_info = await this.getVideoInfo(id);
        return await this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}][ThumbInfo].xml`);
    }

    /**
     * 
     * @param {string} id 
     */
    async getThumbPath(id) {
        const video_info = await this.getVideoInfo(id);
        return await this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}][ThumbImg].jpeg`);
    }



    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     * @param {string} video_type 
     */
    getVideoFileName(id, video_name, video_type) {
        return `${video_name} - [${id}].${video_type}`;
    }
    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     */
    getCommentFileName(id, video_name) {
        return `${video_name} - [${id}].xml`;
    }

    getThumbInfoFileName(id, video_name) {
        return `${video_name} - [${id}][ThumbInfo].xml`;
    }

    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     */
    getThumbFileName(id, video_name) {
        return `${video_name} - [${id}][ThumbImg].jpeg`;
    }
}

module.exports = Library;