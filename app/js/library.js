
const fs = require("fs");
const reader = require("./reader");
const Datastore = require("nedb");

class Library {
    constructor(db_file, in_memory_only=false) {
        this.db = new Datastore({ 
            filename: db_file,
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
        const data_list = 
            this._normalizePath(dir_list).map(value=>{
                value["_db_type"] = "dir";
                return value;
            }).concat(video_list.map(value=>{
                value["_db_type"] = "video";
                return value;
            }));    

        await this._clear(this.db);
        await this._setData(this.db, data_list);
    }

    getLibraryData(){
        return new Promise(async (resolve, reject) => {
            const dir_map = await this._getDirMap();

            this.db.find({_db_type: "video"}, async (err, docs) => {   
                if(docs.length==0){
                    reject(new Error("not find data"));
                    return;
                }
                const data = await Promise.all(docs.map(async value=>{
                    const video_id = value.video_id;
                    const dir_path = dir_map.get(value.dirpath_id);
                    return {
                        thumb_img: this._getThumbPath(dir_path, value),
                        id: video_id,
                        name: value.video_name,
                        creation_date: value.creation_date,
                        pub_date: value.pub_date,
                        play_count: value.play_count,
                        play_time: value.time,
                        tags: value.tags?value.tags.join(" "):""
                    };
                }));
                resolve(data);
            });
        });
    }

    async getPlayData(video_id){
        const video_info = await this._getVideoInfo(video_id);
        const dir_path = await this._getDir(video_info.dirpath_id);

        const video_file_path = this._getVideoPath(dir_path, video_info);
        const video_type = this._getVideoType(video_info);
        const commnets = await this._findComments(video_id);
        const thumb_info = this._findThumbInfo(dir_path, video_info);
        const thumb_url = this._getThumbPath(dir_path, video_info);
        thumb_info.thumbnail_url = thumb_url;

        return {
            video_data: {
                src: video_file_path,
                type: video_type,
                commnets: commnets
            },
            viweinfo: {
                thumb_info:thumb_info,
                commnets: commnets
            }
        };
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

    _getDir(dirpath_id) {
        return new Promise((resolve, reject) => {
            this.db.find({ $and : [{_db_type: "dir"}, { dirpath_id: dirpath_id }]}, (err, docs) => {
                if(docs.length==0){
                    reject(new Error(`not find dir_path, dirpath_id=${dirpath_id}`));
                    return;
                }
                resolve(docs[0].dirpath);
            });
        });
    }

    /**
     * キャッシュとして使用する
     */
    _getDirMap() {
        const dir_map = new Map();
        return new Promise((resolve, reject) => {
            this.db.find({_db_type: "dir"}, (err, docs) => {
                if(docs.length==0){
                    reject(new Error("not find dir_path"));
                    return;
                }
                docs.forEach(value => {
                    dir_map.set(value.dirpath_id, value.dirpath);
                });
                resolve(dir_map);
            });
        });
    }

    /**
     * 
     * @param {string} video_id 
     */
    async _findComments(video_id) {
        const video_info = await this._getVideoInfo(video_id);
        const dir_path = await this._getDir(video_info.dirpath_id);
        const file_path = this._getCommentPath(dir_path, video_info);

        const xml = fs.readFileSync(file_path, "utf-8");
        let comments = reader.comment(xml);
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
        return comments;
    }

    _getVideoInfo(video_id) {
        return new Promise((resolve, reject) => {
            this.db.find({ $and : [{_db_type: "video"}, { video_id: video_id }] }, (err, docs) => {   
                if(docs.length==0){
                    reject(new Error(`not find video_info, id=${video_id}`));
                    return;
                }
                delete docs[0]._db_type;
                delete docs[0]._id;
                resolve(docs[0]);
            });
        });
    }

    /**
     * 
     * @param {string} dir_path 
     * @param {object} video_info 
     */
    _findThumbInfo(dir_path, video_info) {
        const path = this._getThumbInfoPath(dir_path, video_info);
        const xml = fs.readFileSync(path, "utf-8");
        return reader.thumb_info(xml);
    }

    _getVideoType(video_info){
        return video_info.video_type;
    }

    /**
     * 
     * @param {string} dir_path 
     * @param {object} video_info 
     */
    _getVideoPath(dir_path, video_info) {
        return `${dir_path}/${video_info.video_filename}`;
    }
    /**
     * 
     * @param {string} dir_path 
     * @param {object} video_info 
     */
    _getCommentPath(dir_path, video_info) {
        return `${dir_path}/${video_info.video_name} - [${video_info.video_id}].xml`;
    }

    _getThumbInfoPath(dir_path, video_info) {
        return `${dir_path}/${video_info.video_name} - [${video_info.video_id}][ThumbInfo].xml`;
    }

    /**
     * 
     * @param {string} dir_path 
     * @param {object} video_info 
     */
    _getThumbPath(dir_path, video_info) {
        return `${dir_path}/${video_info.video_name} - [${video_info.video_id}][ThumbImg].jpeg`;
    }
}

module.exports = Library;