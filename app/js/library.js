
const Datastore = require("nedb");
const path = require("path");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");
const { FileUtils } = require("./file-utils");

const createDBItem = () => {
    return {
        _db_type: "",
        dirpath_id: -1,
        video_id: "",
        video_name: "",
        video_type: "",
        common_filename: "",
        is_economy: false,
        modification_date: -1,
        creation_date: 0,
        pub_date: 0,
        last_play_date: -1,
        play_count: 0,
        time: 0,
        tags: [],
        is_deleted: false,
        thumbnail_size: "S",
    };
};

class Library {
    constructor(){
        this.nico_xml = new NicoXMLFile();
        this.nico_json = new NicoJsonFile();
    }

    async init(dir_path, in_memory_only=false) {
        const dir_db_file = "library-dir.db";
        const video_db_file = "library-video.db";

        this.dir_db = new Datastore({ 
            filename: path.join(dir_path, dir_db_file),
            autoload: true,
            inMemoryOnly: in_memory_only
        });

        this.video_db = new Datastore({ 
            filename: path.join(dir_path, video_db_file),
            autoload: true,
            inMemoryOnly: in_memory_only
        });

        await this._updateDirPathMap();
    }

    /**
     * 
     * @param {Array} dir_list
     * @param {Array} video_list
     * @param {String} mode w:over write, a:append
     */
    async setData(dir_list, video_list, mode="w") {
        const n_dir_list = this._normalizeDirData(dir_list);
        if(mode=="w"){
            await this._clear(this.video_db);
            await this._setData(this.video_db, video_list);

            await this._clear(this.dir_db);
            await this._setData(this.dir_db, n_dir_list);
        }else if(mode=="a"){
            await this._addData(this.video_db, video_list, "video_id");
            await this._addData(this.dir_db, n_dir_list, "dirpath_id");
        }else{
            throw new Error(`unkown mode: ${mode}`);
        }

        await this._updateDirPathMap();
    }

    async _updateDirPathMap(){
        const count = await new Promise(async (resolve, reject) => {
            this.dir_db.count({}, function (err, count) {
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
        const n_dirpath = FileUtils.normalizePath(dirpath);
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

        await this._setData(this.dir_db, [{ 
            dirpath_id: new_dirpath_id,
            dirpath: n_dirpath
        }]);

        await this._updateDirPathMap();

        return new_dirpath_id;
    }

    /**
     * 
     * @param {object} item 
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

        const new_item = createDBItem();
        new_item._db_type = item._db_type;
        new_item.dirpath_id = dirpath_id;
        new_item.video_id = item.video_id;
        new_item.video_name = item.video_name;
        new_item.video_type = item.video_type;
        new_item.common_filename = item.video_id,
        new_item.is_economy = item.is_economy;
        // modification_date
        new_item.creation_date = new Date().getTime();
        new_item.pub_date = item.pub_date;
        // last_play_date
        // play_count
        new_item.time = item.time;
        new_item.tags = item.tags;
        new_item.is_deleted = item.is_deleted;
        new_item.thumbnail_size = item.thumbnail_size;

        await this._updateData(this.video_db, new_item, true);
    }

    async updateItem(item){
        await this._updateData(this.video_db, item, false);
    }

    async getFieldValue(video_id, field_name){
        return new Promise(async (resolve, reject) => {
            const fields = {};
            fields[`${field_name}`] = 1;
            this.video_db.find({video_id: video_id}, fields, (err, docs) => {
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    resolve(undefined);
                    return;
                }
                resolve(docs[0][`${field_name}`]);
            });
        });
    }

    async setFieldValue(video_id, field_name, value){
        return new Promise(async (resolve, reject) => {
            const fields = {};
            fields[`${field_name}`] = value;
            this.video_db.update({video_id: video_id}, {$set: fields}, (err, numReplaced) => {
                if(err){
                    reject(err);
                    return;
                }
                if(numReplaced==0){
                    reject(new Error(`not find ${video_id} ${field_name}`));
                    return;
                }
                resolve();
            });
        });
    }

    _createLibraryItem(video_item){
        const dir_path = this.id_dirpath_map.get(video_item.dirpath_id);
        return  {
            db_type: video_item._db_type,
            thumb_img: this._getThumbImgPath(dir_path, video_item),
            id: video_item.video_id,
            name: video_item.video_name,
            creation_date: video_item.creation_date,
            pub_date: video_item.pub_date,
            last_play_date: video_item.last_play_date,
            play_count: video_item.play_count,
            play_time: video_item.time,
            tags: video_item.tags?video_item.tags.join(" "):"",
            thumbnail_size: video_item.thumbnail_size
        };
    }

    getLibraryItem(video_id){
        return new Promise(async (resolve, reject) => {
            this.video_db.find({video_id: video_id}, async (err, docs) => { 
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    resolve(null);
                    return;
                }
                const value = docs[0];
                const item = this._createLibraryItem(value);
                resolve(item);
            });
        });       
    }

    getLibraryItems(){
        return new Promise(async (resolve, reject) => {
            this.video_db.find({}, async (err, docs) => { 
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    resolve([]);
                    return;
                }
                const data = await Promise.all(docs.map(async value=>{
                    return this._createLibraryItem(value);
                }));
                resolve(data);
            });
        });
    }

    async getPlayData(video_id){
        const video_info = await this._getVideoInfo(video_id);
        const dir_path = await this._getDir(video_info.dirpath_id);
        const is_deleted = await this.getFieldValue(video_id, "is_deleted");

        const video_path = this._getVideoPath(dir_path, video_info);
        const video_type = this._getVideoType(video_info);
        const comments = this._getComments(dir_path, video_info);
        const thumb_info = this._getThumbInfo(dir_path, video_info);

        return {
            video_data: {
                src: video_path,
                type: `video/${video_type}`,
            },
            viewinfo: {
                is_deleted: is_deleted,
                is_local: true,
                thumb_info:thumb_info,
                
            },
            comments: comments
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

    async _addData(db, data_list, id_name) {
        const exist_items = await new Promise((resolve, reject) => {
            db.find({}, {_id: 0}, (err, docs) => { 
                if(err){
                    reject(err);
                    return;
                }
                resolve(docs);
            });
        });
        const exist_ids = exist_items.map(item=>{
            return item[id_name];
        });
        const new_data = data_list.filter(data=>{
            return !exist_ids.includes(data[id_name]);
        });
        return new Promise((resolve, reject) => {
            db.insert(new_data, (err, new_doc) => {
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
            const npath = FileUtils.normalizePath(value.dirpath);
            value.dirpath = npath;
            return value;
        });
    }

    _getDir(dirpath_id) {
        return new Promise((resolve, reject) => {
            this.dir_db.find({dirpath_id: dirpath_id}, (err, docs) => {
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
            this.dir_db.find({}, (err, docs) => {
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
            this.video_db.find({video_id: video_id}, {_id: 0}, (err, docs) => {   
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    reject(new Error(`not find video_info, id=${video_id}`));
                    return;
                }
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
            this.nico_xml.thumbnailSize = video_info.thumbnail_size;
            return this.nico_xml;
        }
        if(db_type=="json"){
            this.nico_json.dirPath = dir_path;
            this.nico_json.commonFilename = video_info.common_filename;
            this.nico_json.videoType = video_info.video_type;
            this.nico_json.thumbnailSize = video_info.thumbnail_size;
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
        const thumb_img_path = this._getThumbImgPath(dir_path, video_info);
        thumb_info.video.thumbnailURL = thumb_img_path;
        thumb_info.video.largeThumbnailURL = thumb_img_path;
        return thumb_info;
    }

    _getVideoType(video_info){
        return video_info.video_type;
    }
}

module.exports = {
    createDBItem,
    Library
};