const fs = require("fs");
const path = require("path");
const { deepCopy } = require("./deepcopy");
const logger = require("./logger");

class MapDB {
    constructor({ filename = "./db.json", autonum = 10, use_log = true } = {}) {
        this.autonum = autonum;
        this.use_log = use_log;
        const fullpath = path.resolve(filename);
        this.db_path = fullpath;
        this.log_path = this._getLogFilePath(fullpath);
        this.db_map = new Map();
        this.cmd_log_count = 0;
    }

    _getLogFilePath(db_file_path) {
        const dir = path.dirname(db_file_path);
        const ext = path.extname(db_file_path);
        return path.join(dir, `${path.basename(db_file_path, ext)}.log`);
    }

    createTable(names) {
        this.db_map.clear();
        names.forEach(name => {
            this.db_map.set(name, new Map());
        });
    }

    setData(name, data_list){
        this.db_map.set(name, this._convertMap("id", data_list));
    }

    async load() {
        if (await this._existFile(this.db_path)) {
            const jsonString = await this._readFile(this.db_path);
            const obj = JSON.parse(jsonString);
            const r_map = new Map(obj);
            r_map.forEach((value, key) => {
                this.db_map.set(key, this._convertMap("id", value));
            });
        }

        if (await this._existFile(this.log_path)) {
            const cmd_logs = await this._readlog(this.log_path);
            this._applyCmdLog(cmd_logs);
            await this.save();
        }
    }

    /**
     * 
     * @param {String} name 
     * @param {Array} ary 
     */
    _convertMap(name, ary) {
        const map = new Map();
        ary.forEach(value => {
            map.set(value[name], value);
        });
        return map;
    }

    exist(name, id) {
        if (!this.db_map.has(name)) {
            return false;
        }
        return this.db_map.get(name).has(id);
    }

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

    findAll(name) {
        if (!this.db_map.has(name)) {
            return [];
        }
        const map = this.db_map.get(name);
        return deepCopy(Array.from(map.values()));
    }

    async insert(name, data) {
        const map = this.db_map.get(name);
        map.set(data.id, data);

        await this._log({
            target: name,
            type: "insert",
            value: { id: data.id, data: data }
        });
    }

    async delete(name, id) {
        const map = this.db_map.get(name);
        map.delete(id);  
        
        await this._log({
            target: name,
            type: "delete",
            value: { id: id, data: {} }
        });
    }

    async update(name, id, props) {
        const map = this.db_map.get(name);
        if (!map.has(id)) {
            throw new Error(`${name} not has ${id}`);
        }

        map.set(id,
            Object.assign(map.get(id), props));

        await this._log({
            target: name,
            type: "update",
            value: { id: id, data: props }
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

    _convertString(key, ary) {
        const output = ary.map(value => {
            return JSON.stringify(value, null, 0);
        }).join(",\n");

        return `["${key}", [\n${output}\n]]`;
    }

    async _existFile(file_path) {
        try {
            await fs.promises.stat(file_path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async _safeWriteFile(file_path, data) {
        const tmp_path = path.join(path.dirname(file_path), `~${path.basename(file_path)}`);
        this._writeFile(tmp_path, data, "utf-8");
        this._rename(tmp_path, file_path);
    }

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

    async _deletelog() {
        await this._unlink(this.log_path);
    }

    async _writelog(cmd) {
        const data = JSON.stringify(cmd, null, 0);
        await this._appendFile(this.log_path, `${data}\n`);
    }

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
     * 
     * @param {Array} cmd_logs 
     */
    _applyCmdLog(cmd_logs) {
        cmd_logs.forEach(item => {
            const target = item.target;
            if (!this.db_map.has(target)) {
                return;
            }

            const data_map = this.db_map.get(target);
            const value = item.value;
            if (item.type == "insert") {
                data_map.set(value.id, value.data);
            }

            if (item.type == "delete") {
                data_map.delete(value.id);
            }

            if (item.type == "update") {
                if (!data_map.has(value.id)) {
                    return;
                }
                data_map.set(value.id,
                    Object.assign(data_map.get(value.id), value.data));
            }
        });
    }
}

class LibraryDB {
    constructor({ filename = "./db.json", autonum = 10 } = {}) {
        this.params = { filename: filename, autonum: autonum };
        this._db = this._createDB(this.params);
    }

    _createDB(params) {
        return new MapDB(params);
    }

    async load() {
        this._db = this._createDB(this.params);
        this._db.createTable(["path", "video"]);
        await this._db.load();
    }

    async save(force=true){
        if(force===false && this._db.cmd_log_count==0){
            logger.debug("no save library");
            return;
        }

        logger.debug("save library cmd_log_count=", this._db.cmd_log_count);
        await this._db.save(); 
    }

    setPathData(data_list){
        this._db.setData("path", data_list);
    }
    setVideoData(data_list){
        this._db.setData("video", data_list);
    }

    exist(video_id) {
        return this._db.exist("video", video_id);
    }

    find(video_id) {
        const video_item = this._db.find("video", video_id);
        if(video_item===null){
            return null;
        }
        const path_item = this._db.find("path", video_item.dirpath_id);
        video_item.dirpath = path_item.dirpath;
        return video_item;
    }

    findAll() {
        const video_items = this._db.findAll("video");
        video_items.forEach(item => {
            const path_item = this._db.find("path", item.dirpath_id);
            item.dirpath = path_item.dirpath;
        });
        return video_items;
    }

    async insert(dirpath, video_data) {
        const cp_video_data = { ...video_data };
        const dirpath_id = await this._getPathID(dirpath);
        cp_video_data.dirpath_id = dirpath_id;
        this._deleteNoUseProp(cp_video_data);
        await this._db.insert("path", { "id": dirpath_id, "dirpath": dirpath });
        await this._db.insert("video", cp_video_data);
    }

    async delete(video_id) {
        await this._db.delete("video", video_id);
    }

    async update(video_id, props) {
        this._deleteNoUseProp(props);
        await this._db.update("video", video_id, props);
    }

    _deleteNoUseProp(props){
        delete props.dirpath; 
    }

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