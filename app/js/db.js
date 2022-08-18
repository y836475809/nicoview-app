const fs = require("fs");
const path = require("path");
const { deepCopy } = require("./deepcopy");
const { logger } = require("./logger");

class MapDB {
    constructor({ filename = "./db.json", autonum = 10, use_log = true } = {}) {
        /** @type {number} */
        this.autonum = autonum;

        /** @type {boolean} */
        this.use_log = use_log;

        /** @type {string} */
        const fullpath = path.resolve(filename);

        /** @type {string} */
        this.db_path = fullpath;

        /** @type {string} */
        this.log_path = this._getLogFilePath(fullpath);

        /** @type {Map<string, string>} */
        this.id_map = new Map();

        /** @type {Map<string, Map<any, any>>} */
        this.db_map = new Map();

        /** @type {number} */
        this.cmd_log_count = 0;
    }

    /**
     * 
     * @param {string} db_file_path 
     * @returns {string} ログファイルのフルパス
     */
    _getLogFilePath(db_file_path) {
        const dir = path.dirname(db_file_path);
        const ext = path.extname(db_file_path);
        return path.join(dir, `${path.basename(db_file_path, ext)}.log`);
    }
    
    /**
     * テーブル生成
     * @param {{name:string,id:string}[]} name_id_pairs 生成するテーブル名とidにする項目名のペアのリスト
     */
    createTable(name_id_pairs) {
        this.id_map.clear();
        this.db_map.clear();

        name_id_pairs.forEach(name_id_pair => {
            const { name, id } = name_id_pair;
            this.id_map.set(name, id);
            this.db_map.set(name, new Map());
        });
    }

    /**
     * 
     * @param {string} name テーブル名
     * @param {any[]} data_list 
     */
    setData(name, data_list){
        const id = this.id_map.get(name);
        this.db_map.set(name, this._convertMap(id, data_list));
    }

    async load() {
        if (await this._existFile(this.db_path)) {
            const jsonString = await this._readFile(this.db_path);
            const obj = JSON.parse(jsonString);
            const r_map = new Map(obj);
            r_map.forEach((value, key) => {
                const id = this.id_map.get(key);
                this.db_map.set(key, this._convertMap(id, value));
            });
        }

        if (await this._existFile(this.log_path)) {
            const cmd_logs = await this._readlog(this.log_path);
            this._applyCmdLog(cmd_logs);
            await this.save();
        }
    }

    /**
     * データリストをmapに変換する
     * @param {string} id テーブルのidにするid
     * @param {Array} ary データリスト
     * @returns {Map<any, any>}
     */
    _convertMap(id, ary) {
        /** @type {Map<any, any>} */
        const map = new Map();
        ary.forEach(value => {
            map.set(value[id], value);
        });
        return map;
    }

    /**
     * テーブルにidが存在するかを判定
     * @param {string} name テーブル名
     * @param {string} id 
     * @returns {boolean} true:idが存在する
     */
    exist(name, id) {
        if (!this.db_map.has(name)) {
            return false;
        }
        return this.db_map.get(name).has(id);
    }

    /**
     * テーブルのidのデータを検索して最初に見つけたデータを返す
     * @param {string} name テーブル名
     * @param {string} id 
     * @returns {any|null} データ
     */
    find(name, id) {
        if (!this.db_map.has(name)) {
            return null;
        }
        const map = this.db_map.get(name);
        if (!map.has(id)) {
            return null;
        }
        return deepCopy(map.get(id));
    }

    /**
     * テーブルのidの全データを返す
     * @param {string} name テーブル名
     * @returns {any[]}
     */
    findAll(name) {
        if (!this.db_map.has(name)) {
            return [];
        }
        const map = this.db_map.get(name);
        return deepCopy(Array.from(map.values()));
    }

    /**
     * テーブル名のテーブルにデータを挿入する
     * @param {string} name テーブル名
     * @param {any} data 
     * @returns {Promise<void>}
     */
    async insert(name, data) {
        const id = this.id_map.get(name);
        const map = this.db_map.get(name);
        map.set(data[id], data);

        const value = {};
        value[id] = id;
        value["data"] = data;
        await this._log({
            target: name,
            type: "insert",
            value: value
        });
    }

    /**
     * テーブル名のテーブルのidのデータを削除する
     * @param {string} name テーブル名
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async delete(name, id) {
        const map = this.db_map.get(name);
        map.delete(id);  
        
        const value = {};
        value[id] = id;
        value["data"] = {};
        await this._log({
            target: name,
            type: "delete",
            value: value
        });
    }

    /**
     * テーブル名のテーブルのidのデータをpropsで更新する
     * @param {string} name テーブル名
     * @param {string} id 
     * @param {{}} props 
     * @returns {Promise<void>}
     */
    async update(name, id, props) {
        const map = this.db_map.get(name);
        if (!map.has(id)) {
            throw new Error(`${name} not has ${id}`);
        }

        map.set(id,
            Object.assign(map.get(id), props));

        const value = {};
        value[id] = id;
        value["data"] = props;
        await this._log({
            target: name,
            type: "update",
            value: value
        });
    }

    async save() {
        const items = [];
        this.db_map.forEach((value, key) => {
            const ary = Array.from(value.values());
            items.push(this._convertString(key, ary));
        });

        const jsonString = `[${items.join(",\n")}]`;
        await this._safeWriteFile(this.db_path, jsonString);
        await this._deletelog();
        this.cmd_log_count = 0;
    }

    /**
     * テーブルのデータを下のようなデータ毎の一行形式のjson文字列に変換する
     * [ テーブル名,[
     *      {data1},
     *      {data2},
     *      ...
     *    ]
     * ]
     * @param {string} key テーブル名
     * @param {any[]} ary データのリスト
     * @returns {string} json文字列
     */
    _convertString(key, ary) {
        const output = ary.map(value => {
            return JSON.stringify(value, null, 0);
        }).join(",\n");

        return `["${key}", [\n${output}\n]]`;
    }

    /**
     * ファイルの存在確認
     * @param {string} file_path ファイルパス
     * @returns {Promise<boolean>} true:存在している
     */
    async _existFile(file_path) {
        try {
            await fs.promises.stat(file_path);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * ファイル書き込み
     * 一度別ファイル名で書き込んで問題なければファイル名にリネームする
     * @param {string} file_path ファイル名
     * @param {any} data
     * @returns {Promise<void>}  
     */
    async _safeWriteFile(file_path, data) {
        const tmp_path = path.join(path.dirname(file_path), `~${path.basename(file_path)}`);
        this._writeFile(tmp_path, data);
        this._rename(tmp_path, file_path);
    }

    /**
     * データ操作のログをログファイルに追記して
     * ログ数が閾値以上の場合DBファイルにログのデータを反映してログを削除する
     * @param {any} cmd データ操作
     * @returns {Promise<void>} 
     */
    async _log(cmd) {
        if (!this.use_log) {
            return;
        }

        this.cmd_log_count++;
        await this._writelog(cmd);

        if (this.cmd_log_count >= this.autonum) {
            await this.save();
            return;
        }
    }

    /**
     * データ操作ログを削除する
     * @returns {Promise<void>} 
     */
    async _deletelog() {
        await this._unlink(this.log_path);
    }

    /**
     * データ操作をログファイルに追記する
     * @param {any} cmd データ操作
     * @returns {Promise<void>} 
     */
    async _writelog(cmd) {
        const data = JSON.stringify(cmd, null, 0);
        await this._appendFile(this.log_path, `${data}\n`);
    }

    /**
     * データ操作のログファイルを読み込む
     * @param {string} log_path 
     * @returns {Promise<any[]>} データ操作リスト
     */
    async _readlog(log_path) {
        if (!await this._existFile(log_path)) {
            return [];
        }

        const str = await this._readFile(log_path);
        const lines = str.split(/\r\n|\n/);
        const cmds = lines.filter(line => {
            return line.trim().length > 0;
        }).map(line => {
            return JSON.parse(line.trim());
        });
        return cmds;
    }

    async _readFile(file_path) {
        return await fs.promises.readFile(file_path, "utf-8");
    }
    async _appendFile(file_path, data) {
        await fs.promises.appendFile(file_path, data, "utf-8");
    }
    async _unlink(file_path) {
        if (await this._existFile(this.log_path)) {
            fs.unlinkSync(file_path);
        }
    }
    _writeFile(file_path, data) {
        fs.writeFileSync(file_path, data, "utf-8");
    }
    _rename(old_path, new_path) {
        fs.renameSync(old_path, new_path);
    }

    /**
     * データ操作ログをDBに反映させる
     * @param {any[]} cmd_logs 
     */
    _applyCmdLog(cmd_logs) {
        cmd_logs.forEach(item => {
            const target = item.target;
            if (!this.db_map.has(target)) {
                return;
            }
            const id = this.id_map.get(target);
            const data_map = this.db_map.get(target);
            const value = item.value;
            if (item.type == "insert") {
                data_map.set(value[id], value.data);
            }

            if (item.type == "delete") {
                data_map.delete(value[id]);
            }

            if (item.type == "update") {
                if (!data_map.has(value[id])) {
                    return;
                }
                data_map.set(value[id],
                    Object.assign(data_map.get(value[id]), value.data));
            }
        });
    }
}

/**
 * ライブラリ用DB
 */
class LibraryDB {
    constructor({ filename = "./db.json", autonum = 10 } = {}) {
        // autonum データ操作ログ保存数閾値
        /** @type {{filename:string,autonum:number}} */
        this.params = { filename: filename, autonum: autonum };
        this._db = this._createDB(this.params);

        this.name_id_paies = [{name:"path",id:"id"}, {name:"video", id:"video_id"}];
        this._db.createTable(this.name_id_paies);
    }

    /**
     * 
     * @param {{filename:string,autonum:number}} params 
     * @returns {MapDB}
     */
    _createDB(params) {
        return new MapDB(params);
    }

    async load() {
        this._db = this._createDB(this.params);
        this._db.createTable(this.name_id_paies);
        await this._db.load();
    }

    /**
     * ライブラリDB保存
     * @param {boolean} force true:データ操作ログがない(DBに変更がない)場合でも書き込む
     * @returns {Promise<void>} 
     */
    async save(force=true){
        if(force===false && this._db.cmd_log_count==0){
            logger.debug("no library writing");
            return;
        }

        logger.debug("library writing, cmd_log_count=", this._db.cmd_log_count);
        await this._db.save(); 
    }

    /**
     * ディレクトリデータ(動画データ保存先)のリストをpathテーブルに設定する
     * @param {{id:string,dirpath:string}[]} data_list 
     */
    setPathData(data_list){
        this._db.setData("path", data_list);
    }
    /**
     * ライブラリデータ(動画データ)のリストをvideoテーブルに設定する
     * @param {LibraryItem[]} data_list 
     */
    setVideoData(data_list){
        this._db.setData("video", data_list);
    }

    /**
     * ライブラリにvideo_idのデータが存在するかの判定
     * @param {string} video_id 動画id
     * @returns {boolean} true:データが存在する
     */
    exist(video_id) {
        return this._db.exist("video", video_id);
    }

    /**
     * ライブラリDBから最初に見つかった動画idのデータを返す
     * @param {string} video_id 動画id
     * @returns {LibraryItem} ライブラリデータ
     */
    find(video_id) {
        const video_item = this._db.find("video", video_id);
        if(video_item===null){
            return null;
        }
        const path_item = this._db.find("path", video_item.dirpath_id);
        video_item.dirpath = path_item.dirpath;
        return video_item;
    }

    /**
     * ライブラリDBから全データを返す
     * @returns {LibraryItem[]} ライブラリデータ
     */
    findAll() {
        const video_items = this._db.findAll("video");
        video_items.forEach(item => {
            const path_item = this._db.find("path", item.dirpath_id);
            item.dirpath = path_item.dirpath;
        });
        return video_items;
    }

    /**
     * ライブラリDBにデータを挿入する
     * @param {string} dirpath 
     * @param {LibraryItem} video_data
     * @returns {Promise<void>} 
     */
    async insert(dirpath, video_data) {
        const cp_video_data = { ...video_data };
        const dirpath_id = await this._getPathID(dirpath);
        cp_video_data.dirpath_id = dirpath_id;
        this._deleteNoUseProp(cp_video_data);
        await this._db.insert("path", { "id": dirpath_id, "dirpath": dirpath });
        await this._db.insert("video", cp_video_data);
    }

    /**
     * ライブラリDBの動画idのデータを削除する
     * @param {string} video_id 動画id
     * @returns {Promise<void>} 
     */
    async delete(video_id) {
        await this._db.delete("video", video_id);
    }

    /**
     * ライブラリDBの動画idのデータにpropsを反映する
     * @param {string} video_id 動画id
     * @param {{}} props プロパティ
     * @returns {Promise<void>} 
     */
    async update(video_id, props) {
        this._deleteNoUseProp(props);
        await this._db.update("video", video_id, props);
    }

    /**
     * DBに不要なデータをpropsから削除する
     * @param {{dirpath?:string}} props 
     */
    _deleteNoUseProp(props){
        delete props.dirpath; 
    }

    /**
     * path DBで未使用のidを返す
     * @param {string} dirpath 
     * @returns {Promise<string>} id
     */
    async _getPathID(dirpath) {
        const path_map = this._db.db_map.get("path");
        for (let [k, v] of path_map) {
            if (v.dirpath == dirpath) {
                return k;
            }
        }

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            const id = String(index);
            if (!path_map.has(id)) {
                return id;
            }
        }

        throw new Error("maximum id value has been exceeded");
    }
}

module.exports = {
    MapDB,
    LibraryDB
};