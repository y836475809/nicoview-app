
const Datastore = require("nedb");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

class Library {
    constructor(){
        this.nico_xml = new NicoXMLFile();
        this.nico_json = new NicoJsonFile();
    }

    async init(db_file, in_memory_only=false) {
        this.db = new Datastore({ 
            filename: db_file,
            autoload: true,
            inMemoryOnly: in_memory_only
        });

        await this._updateDirPathMap();
    }

    /**
     * 
     * @param {Array} dir_list
     * @param {Array} video_list
     */
    async setData(dir_list, video_list) {
        const data_list = this._normalizeDirData(dir_list).concat(video_list);
        await this._clear(this.db);
        await this._setData(this.db, data_list);

        await this._updateDirPathMap();
    }

    async _updateDirPathMap(){
        const count = await new Promise(async (resolve, reject) => {
            this.db.count({}, function (err, count) {
                resolve(count);
            });
        });
        if(count==0){
            this.id_dirpath_map = new Map();
            this.dirpath_id_map = new Map();
            return;
        }

        this.id_dirpath_map = await this._getDirMap();
        this.dirpath_id_map = new Map();
        this.id_dirpath_map.forEach((value, key) => {
            this.dirpath_id_map.set(value, key);
        });
    }

    /**
     * 
     * @param {String} dirpath 
     * @returns {Number} new_dirpath_id
     */
    async _addDirPath(dirpath){
        const n_dirpath = this._normalizePath(dirpath);
        if(this.dirpath_id_map.has(n_dirpath)){
            return this.dirpath_id_map.get(n_dirpath);
        }

        let new_dirpath_id = null;
        const max_dir_id = 10000;
        for (let index = 0; index < max_dir_id; index++) {
            if(!this.id_dirpath_map.has(index)){
                new_dirpath_id = index;
                break;
            } 
        }
        if(new_dirpath_id===null){
            throw new Error("maximum id value has been exceeded");
        }

        await this._setData(this.db, [{ 
            _data_type: "dir",
            dirpath_id: new_dirpath_id,
            dirpath: n_dirpath
        }]);

        await this._updateDirPathMap();

        return new_dirpath_id;
    }

    /**
     * 
     * @param {object} item 
     * @param {String} item._data_type      
     * @param {String} item._db_type
     * @param {String} item.dirpath
     * @param {String} item.video_id
     * @param {String} item.video_name
     * @param {String} item.video_type
     * @param {boolean} item.max_quality
     * @param {Number} item.time
     * @param {Number} item.pub_date
     * @param {Array} item.tags
     */
    async addItem(item){
        const dirpath = item.dirpath;
        const dirpath_id = await this._addDirPath(dirpath);

        const cu_date = new Date().getTime();
        const library_item = {
            _data_type: item._data_type,
            _db_type: item._db_type,
            dirpath_id: dirpath_id,
            video_id: item.video_id,        
            video_name: item.video_name,
            video_type: item.video_type,
            common_filename: item.video_id,
            is_economy: !item.max_quality,
            creation_date: cu_date,
            play_count: 0,
            time: item.time,
            pub_date: item.pub_date,
            tags: item.tags
        };
        await this._updateData(this.db, library_item, true);
    }

    async updateItem(item){
        await this._updateData(this.db, item, false);
    }

    getLibraryItem(video_id){
        return new Promise(async (resolve, reject) => {
            this.db.find({_data_type: "video", video_id: video_id}, async (err, docs) => { 
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    resolve([]);
                    return;
                }
                const value = docs[0];
                const dir_path = this.id_dirpath_map.get(value.dirpath_id);
                const data =  {
                    thumb_img: this._getThumbImgPath(dir_path, value),
                    id: video_id,
                    name: value.video_name,
                    creation_date: value.creation_date,
                    pub_date: value.pub_date,
                    play_count: value.play_count,
                    play_time: value.time,
                    tags: value.tags?value.tags.join(" "):""
                };
                resolve(data);
            });
        });       
    }

    getLibraryData(){
        return new Promise(async (resolve, reject) => {
            const dir_map = await this._getDirMap(); //TODO

            this.db.find({_data_type: "video"}, async (err, docs) => { 
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    resolve([]);
                    return;
                }
                const data = await Promise.all(docs.map(async value=>{
                    const video_id = value.video_id;
                    const dir_path = dir_map.get(value.dirpath_id);
                    return {
                        thumb_img: this._getThumbImgPath(dir_path, value),
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
    
        const video_path = this._getVideoPath(dir_path, video_info);
        const video_type = this._getVideoType(video_info);
        const comments = this._getComments(dir_path, video_info);
        const thumb_info = this._getThumbInfo(dir_path, video_info);

        return {
            video_data: {
                src: video_path,
                type: `video/${video_type}`,
                comments: comments
            },
            viweinfo: {
                thumb_info:thumb_info,
                comments: comments
            }
        };
    }

    _setData(db, data_list) {
        return new Promise((resolve, reject) => {
            db.insert(data_list, (err, new_doc) => {
                if(err){
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    _updateData(db, data, upsert) {
        return new Promise((resolve, reject) => {
            db.update({ video_id: data.video_id }, data, { upsert: upsert }, (err, numReplaced, upsert) => {
                if(err){
                    reject(err);
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
    _normalizeDirData(dir_list){
        return dir_list.map(value=>{
            const npath = this._normalizePath(value.dirpath);
            value.dirpath = npath;
            return value;
        });
    }

    _normalizePath(dirpath){
        return dirpath.replace(/^(file:\/\/\/)|^(file:\/\/)/i, "");
    }

    _getDir(dirpath_id) {
        return new Promise((resolve, reject) => {
            this.db.find({ $and : [{_data_type: "dir"}, { dirpath_id: dirpath_id }]}, (err, docs) => {
                if(err){
                    reject(err);
                    return;
                }
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
     * @returns {Map<Number, String>}
     */
    _getDirMap() {
        const dir_map = new Map();
        return new Promise((resolve, reject) => {
            this.db.find({_data_type: "dir"}, (err, docs) => {
                if(err){
                    reject(err);
                    return;
                }
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

    _getVideoInfo(video_id) {
        return new Promise((resolve, reject) => {
            this.db.find({ $and : [{_data_type: "video"}, { video_id: video_id }] }, (err, docs) => {   
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    reject(new Error(`not find video_info, id=${video_id}`));
                    return;
                }
                delete docs[0]._data_type;
                // delete docs[0]._db_type;
                delete docs[0]._id;
                resolve(docs[0]);
            });
        });
    }

    _getDataFileInst(dir_path, video_info){
        const db_type = video_info._db_type;
        if(db_type=="xml"){
            this.nico_xml.dirPath = dir_path;
            this.nico_xml.commonFilename = video_info.common_filename;
            this.nico_xml.videoType = video_info.video_type;
            return this.nico_xml;
        }
        if(db_type=="json"){
            this.nico_json.dirPath = dir_path;
            this.nico_json.commonFilename = video_info.common_filename;
            this.nico_json.videoType = video_info.video_type;
            return this.nico_json;
        }

        throw new Error(`${db_type} is unkown`);
    }

    _getVideoPath(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.videoPath;
    }

    _getThumbImgPath(dir_path, video_info){
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.thumbImgPath;
    }

    _getComments(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.getComments();
    }

    _getThumbInfo(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        const thumb_info = datafile.getThumbInfo();
        thumb_info.thumbnail_url = this._getThumbImgPath(dir_path, video_info);
        return thumb_info;
    }

    _getVideoType(video_info){
        return video_info.video_type;
    }
}

module.exports = Library;