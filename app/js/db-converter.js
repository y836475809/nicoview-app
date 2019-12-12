const fs = require("fs");
const path = require("path");
const sql = require("sql.js");
const { createDBItem } = require("./library");
const { FileUtils } = require("./file-utils");

class DBConverter {
    /**
     * 
     * @param {string} db_file_path 
     */
    init(db_file_path) {
        const data = fs.readFileSync(db_file_path);
        const uint_8array = new Uint8Array(data);
        this.db = new sql.Database(uint_8array);
    }
    get_dirpath() {
        return this.dirpath_list;
    }

    get_video() {
        return this.video_list;
    }

    read() {
        this._read_dirpath();
        this._read_tag_string();
        this._read_tag();
        this._read_video();
    }

    _read_dirpath() {
        // this.dirpath_map = new Map();
        let res = this.db.exec("SELECT * FROM file");
        const values = res[0].values;
        this.dirpath_list = values.map(value=>{
            const dirpath_id = value[0];
            const dirpath = FileUtils.normalizePath(decodeURIComponent(value[1]));
            return { dirpath_id, dirpath };
        });
    }

    _read_tag_string() {
        this.tag_string_map = new Map();

        let res = this.db.exec("SELECT * FROM tagstring");
        const values = res[0].values;
        values.forEach((value) => {
            const id = value[0];
            const tag = value[1];
            this.tag_string_map.set(id, tag);
        });
    }

    _read_tag() {
        this.tag_map = new Map();
        let res = this.db.exec("SELECT * FROM nnddvideo_tag");
        const values = res[0].values;
        values.forEach((value) => {
            const video_id = value[1];
            const tag_id = value[2];
            if (!this.tag_map.has(video_id)) {
                this.tag_map.set(video_id, new Array());
            }
            if (this.tag_string_map.has(tag_id)) {
                const tag_string = this.tag_string_map.get(tag_id);
                this.tag_map.get(video_id).push(tag_string);
            }
        });
    }

    _read_video() {
        let res = this.db.exec("SELECT * FROM nnddvideo");
        const values = res[0].values;
        this.video_list = values.map(value=>{
            const id = value[0];
            const key = value[1];
            const uri = value[2];
            const dirpath_id = value[3];
            const video_name = value[4];
            const is_economy = value[5];
            const modification_date = value[6];
            const creation_date = value[7];
            const thumb_url = value[8];
            const play_count = value[9];
            const time = value[10];
            const last_play_date = value[11];
            const yet_reading = value[12];
            const pub_date = value[13];

            const decoded_path = decodeURIComponent(uri);
            const common_filename = path.basename(decoded_path, path.extname(decoded_path));
            const video_type = path.extname(decoded_path).slice(1);
            const tags = this.tag_map.get(id);
            
            const item = createDBItem();
            item._db_type = "xml";
            item.dirpath_id = dirpath_id;
            item.video_id = key;
            item.video_name = video_name;
            item.video_type = video_type;
            item.common_filename = common_filename;
            item.is_economy = is_economy !== 0;
            item.modification_date = modification_date; //-1の場合ある
            item.creation_date = creation_date;         //-1の場合ある
            item.pub_date = pub_date;               //-1の場合ある
            item.last_play_date = last_play_date;   //-1の場合ある
            item.play_count = play_count;
            item.time = time;
            item.tags = tags;
            item.is_deleted = false;
            
            return item;
        });
    }

    // TODO test
    _read_dirpath2() {
        let res = this.db.exec("SELECT * FROM file");
        const values = res[0].values;
        this.dirpath_list = values.map(value=>{
            const id = value[0];
            const dirpath = FileUtils.normalizePath(decodeURIComponent(value[1]));
            return { id, dirpath };
        });
    }
    
    // TODO test
    _read_video2() {
        let res = this.db.exec("SELECT * FROM nnddvideo");
        const values = res[0].values;
        this.video_list = values.map(value=>{
            const id = value[0];
            const key = value[1];
            const uri = value[2];
            const dirpath_id = value[3];
            const video_name = value[4];
            const is_economy = value[5] !== 0;
            const modification_date = value[6];
            const creation_date = value[7];
            const thumb_url = value[8];
            const play_count = value[9];
            const time = value[10];
            const last_play_date = value[11];
            const yet_reading = value[12];
            const pub_date = value[13];

            const decoded_path = decodeURIComponent(uri);
            const common_filename = path.basename(decoded_path, path.extname(decoded_path));
            const video_type = path.extname(decoded_path).slice(1);
            const tags = this.tag_map.get(id);
            
            const data_type = "xml";
            const is_deleted = false;
            const thumbnail_size = "S";

            const item = {
                data_type,
                video_name, video_type,
                dirpath_id, common_filename, thumbnail_size,
                modification_date, creation_date, pub_date, last_play_date,
                play_count, time, tags, is_economy, is_deleted
            };
            item.id = key;
            
            return item;
        });
    }
}

module.exports = DBConverter;