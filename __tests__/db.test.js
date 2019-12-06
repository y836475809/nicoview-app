const test = require("ava");
const fs = require("fs").promises;
const path = require("path");

const pp = (key, ary) => {
    const output = ary.map(value=>{
        return JSON.stringify(value, null, 0);
    }).join(",\n");

    return `["${key}", [\n${output}\n]]`;
};

const pp_ary = (ary) => {
    const output = ary.map(value=>{
        return JSON.stringify(value, null, 0);
    }).join(",\n");

    return `[\n${output}\n]`;
};

/**
 * 
 * @param {String} id_name 
 * @param {Array} ary 
 */
const rr = (id_name, ary) =>{
    const map = new Map();
    ary.forEach(value=>{
        map.set(value[id_name], value);
    });
    return map;
};

class testDB {
    constructor({filename=path.resolve("./db.json"), autonum=10, memory_only=false} = {}){
        const dir = path.dirname(filename);
        this.autonum = autonum<10?10:autonum;
        this.memory_only = memory_only;
        this.db_path = filename;
        this.log_path = path.join(dir, 
            `${path.basename(this.db_path, path.extname(this.db_path))}.log`);
        this.init();
    }

    init(){
        this.tables(["path", "video"]);
        this.cmd_log_count = 0;
    }

    /**
     * 
     * @param {Array<String>} names 
     */
    tables(names){
        this.db_map = new Map();
        names.forEach(name => {
            this.db_map.set(name, new Map());
        });
    }

    async load(){
        if(await this._existFile(this.db_path)){ 
            const jsonString = await this._readFile(this.db_path);
            const obj = JSON.parse(jsonString);
            const r_map = new Map(obj);  
            r_map.forEach((value, key)=>{
                this.db_map.set(key, rr("id", value));
            }); 
        }
        
        if(await this._existFile(this.log_path)){
            const cmd_logs = await this._readlog(this.log_path);
            this._applyCmdLog(cmd_logs);
            await this.save();
        }
    }

    async _existFile(file_path){
        try {
            await fs.stat(file_path);
            return true;
        } catch (error) {
            return false;
        }  
    }

    async addPath(path){
        const path_map = this.db_map.get("path");

        for (let [k, v] of path_map) {
            if (v.path == path) { 
                return k; 
            }
        }  

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            if(!path_map.has(index)){
                path_map.set(index, {"id":index, "path": path});
                await this._log({
                    "target":"path",
                    "type":"insert",
                    "value":{"id":index,"data":path}
                });
                return index;
            } 
        }

        throw new Error("maximum id value has been exceeded");
    }

    exist(video_id){
        const video_map = this.db_map.get("video");
        return video_map.has(video_id);
    }

    find(video_id){
        const video_map = this.db_map.get("video");
        if(!video_map.has(video_id)){
            return null;
        }   
        return video_map.get(video_id);
    }

    findAll(){
        const video_map = this.db_map.get("video");
        return Array.from(video_map.values()); 
    }

    async insert(path, video_data){
        const path_id = await this.addPath(path);
        video_data.path_id = path_id;

        const video_map = this.db_map.get("video");
        video_map.set(video_data.id, video_data);
        
        await this._log({
            "target":"video",
            "type":"insert",
            "value":{"id":video_data.id,"data":video_data}
        });
    }

    async update(video_id, props){
        const video_map = this.db_map.get("video");
        if(!video_map.has(video_id)){
            throw new Error(`not has ${video_id}`);
        }

        video_map.set(video_id, 
            Object.assign(video_map.get(video_id), props));

        await this._log({
            "target":"video",
            "type":"update",
            "value":{"id":video_id,"data":props}
        });
    }

    async save(){
        const items = [];
        this.db_map.forEach((value, key)=>{
            const ary = Array.from(value.values());
            items.push(pp(key, ary));
        }); 

        const jsonString = `[${items.join(",\n")}]`;
        await this._safeWriteFile(this.db_path , jsonString);
        await this._deletelog();
    }

    async _safeWriteFile(file_path, data){
        if(this.memory_only){
            return;
        }

        const tmp_path = path.join(path.dirname(file_path), `~${path.basename(file_path)}`);
        await this._writeFile(tmp_path, data, "utf-8");    
        await this._rename(tmp_path, file_path);
    }

    async _log(cmd){
        this.cmd_log_count++;

        if(this.cmd_log_count >= this.autonum){
            await this.save();
            this.cmd_log_count = 0;
            return;
        }

        await this._writelog(cmd);
    }

    async _deletelog(){
        if(this.memory_only){
            return;
        }
        await this._unlink(this.log_path);
    } 

    async _writelog(cmd){
        if(this.memory_only){
            return;
        }
        const data = JSON.stringify(cmd, null, 0);
        await this._appendFile(this.log_path, `${data}\n`, "utf-8");
    }

    async _readlog(log_path){
        if(!await this._existFile(log_path)){
            return [];
        }

        const str = await this._readFile(log_path);
        const lines = str.split(/\r\n|\n/);
        const cmds = lines.filter(line=>{
            return line.length > 0;
        }).map(line=>{
            return JSON.parse(line);
        });
        return cmds;
    }

    async _readFile(file_path){
        return await fs.readFile(file_path, "utf-8");
    }
    async _appendFile(file_path, data){
        await fs.appendFile(file_path, data, "utf-8");
    }
    async _unlink(file_path){
        return await fs.unlink(file_path);
    }
    async _writeFile(file_path, data){
        await fs.writeFile(file_path, data, "utf-8");    
    }
    async _rename(old_path, new_path){
        await fs.rename(old_path, new_path);
    }

    /**
     * 
     * @param {Array} cmd_logs 
     */
    _applyCmdLog(cmd_logs){
        cmd_logs.forEach(item=>{
            if(item.target=="path"){
                const path_map = this.db_map.get("path");
                const value = item.value;
                if(item.type=="insert"){
                    path_map.set(value.id, value);
                }
            }
            if(item.target=="video"){
                const video_map = this.db_map.get("video");
                const value = item.value;
                if(item.type=="insert"){
                    video_map.set(value.id, value);
                }
                if(item.type=="update"){
                    if(!video_map.has(value.id)){
                        return;
                    }
                    video_map.set(value.id, 
                        Object.assign(video_map.get(value.id), value.data));
                }
            }
        }); 
    }
}

test("db1", async t => {
    const db = new testDB();
    db.init();
    await db.load();
    await db.insert("c:/data", 
        {"id":"sm1","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});
    await db.insert("c:/data", 
        {"id":"sm2","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});
    await db.insert("c:/data/test", 
        {"id":"sm3","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});

    console.log( db.find("sm2"));
    console.log( db.find("sm3"));
    await db.update("sm3", {"is_economy":true,"time":200,"tags":["タグ1","tag2"]});
    console.log("update=", db.find("sm3"));

    await db.save();
});

test.skip("db", t => {
    const map = new Map();
    map.set("path", [
        {"path_id":1,"path":"C:\\dev\\test\\data1"},
        {"path_id":0,"path":"C:/dev/test/data2"}
    ]);
    map.set("library", [
        {"video_id":"sm1","path_id":0,"is_economy":false,"time":100,"tags":["タグ1"]},
        {"video_id":"sm2","path_id":1,"is_economy":false,"time":200,"tags":["タグ1","タグ2"]}
    ]);


    const o_items = [];
    map.forEach((value, key)=>{
        o_items.push(pp(key, value));
    });
    const jsonString = `[${o_items.join(",\n")}]`;
    // const jsonString = JSON.stringify([...map]);
    console.log(jsonString);


    const items = JSON.parse(jsonString);
    const r_map = new Map(items);
    const p_map = rr("path_id", r_map.get("path"));
    const v_map = rr("video_id", r_map.get("library"));
    console.log("p_map=", p_map);
    console.log("v_map=", v_map);
    console.log("[0].tags=", r_map.get("library")[0].tags);
    console.log("[1].tags=", r_map.get("library")[1].tags);

    const lmap = new Map();
    lmap.set("path", Array.from( p_map.values() ));
    lmap.set("library", Array.from( v_map.values() ));
    console.log("lmap=", lmap);

    const uu = [
        {
            "target":"path",
            "type":"add",
            "value":{"path_id":2,"path":"C:\\dev\\test\\data3"}
        },
        {
            "target":"library",
            "type":"add",
            "value":{
                "video_id":"sm3","path_id":0,"is_economy":false,"time":300,"tags":["タグ3"],
            }
        }, 
        {
            "target":"library",
            "type":"update",
            "value":{
                "video_id":"sm1","is_economy":true,"time":300,"tags":[],
            }
        },  
    ];
    const uu_str = pp_ary(uu);
    console.log("uu_str=", uu_str);
    const uu_res = JSON.parse(uu_str);
    console.log("uu_res=", uu_res);

    uu.forEach(item=>{
        if(item.target=="path"){
            const value = item.value;
            if(item.type=="add"){
                p_map.set(value.path_id, value);
            }
        }
        if(item.target=="library"){
            const value = item.value;
            if(item.type=="add"){
                v_map.set(value.video_id, value);
            }
            if(item.type=="update"){
                // Object.assign(target, source);
                v_map.set(value.video_id, 
                    Object.assign(v_map.get(value.video_id), value));
            }
        }
    });
    console.log("p_map2=", p_map);
    console.log("v_map2=", v_map);
});