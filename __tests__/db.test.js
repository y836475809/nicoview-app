const test = require("ava");
const fs = require("fs").promises;
const path = require("path");

const pp = (key, ary) => {
    const output = ary.map(value=>{
        return JSON.stringify(value, null, 0);
    }).join(",\n");

    return `["${key}", [\n${output}\n]]`;
};

/**
 * 
 * @param {String} name 
 * @param {Array} ary 
 */
const rr = (name, ary) =>{
    const map = new Map();
    ary.forEach(value=>{
        map.set(value[name], value);
    });
    return map;
};

class testDB {
    constructor({filename="./db.json", memory_only=false, autonum=10}={}){  
        this.autonum = autonum<10?10:autonum;
        this.memory_only = memory_only;

        const fullpath = path.resolve(filename);
        this.db_path = fullpath;
        this.log_path = this._getLogFilePath(fullpath);

        // this.init();
        this.db_map = new Map();
        this.cmd_log_count = 0;
    }

    // init(){
    //     // this.db_map = new Map();
    //     // ["path", "video"].forEach(name => {
    //     //     this.db_map.set(name, new Map());
    //     // });
    //     this.cmd_log_count = 0;
    // }

    createTable(names){
        this.db_map.clear();
        names.forEach(name => {
            this.db_map.set(name, new Map());
        });
    }

    _getLogFilePath(db_file_path){
        const dir = path.dirname(db_file_path);
        const ext = path.extname(db_file_path);
        return path.join(dir, `${path.basename(db_file_path, ext)}.log`);
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

    exist(name, id){
        if(!this.db_map.has(name)){
            return false;
        }
        return this.db_map.get(name).has(id);
    }

    find(name, id){
        if(!this.db_map.has(name)){
            return null;
        }
        const map = this.db_map.get(name);
        if(!map.has(id)){
            return null;
        }   
        return map.get(id);
    }

    findAll(name){
        if(!this.db_map.has(name)){
            return [];
        }
        const map = this.db_map.get(name);
        return Array.from(map.values()); 
    }

    async insert(name, data){
        const map = this.db_map.get(name);
        map.set(data.id, data);
        
        await this._log({
            target:name,
            type:"insert",
            value:{id:data.id,data:data}
        });
    }

    async update(name, id, props){
        const map = this.db_map.get(name);
        if(!map.has(id)){
            throw new Error(`${name} not has ${id}`);
        }

        map.set(id, 
            Object.assign(map.get(id), props));

        await this._log({
            target:name,
            type:"update",
            value:{id:id, data:props}
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
        await this._appendFile(this.log_path, `${data}\n`);
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
            const target = item.target;
            if(!this.db_map.has(target)){
                return;
            }

            const data_map = this.db_map.get(target);
            const value = item.value;
            if(item.type=="insert"){
                data_map.set(value.id, value);
            }

            if(item.type=="update"){
                if(!data_map.has(value.id)){
                    return;
                }
                data_map.set(value.id, 
                    Object.assign(data_map.get(value.id), value.data));
            }
        }); 
    }
}

class kk {
    constructor({db_file_path="./db.json", memory_only=false, autonum=10}={}){
        this._db = new testDB(db_file_path, {memory_only:memory_only, autonum:autonum});
        this._db.createTable(["path, video"]);
    }

    async load(){
        await this._db.load();
    }

    exist(video_id){
        return this._db.exist("vieo", video_id);
    }

    find(video_id){ 
        const video_items = this._db.find("video", video_id);
        const path = this._db.find("path", video_items.path_id);
        video_items.path = path;
        // Object.assign(vieo_item, {path: path});
        return video_items;
    }

    findAll(){
        const video_items = this._db.findAll("video");
        video_items.forEach(item=>{
            const path = this._db.find("path", item.path_id);
            video_items.path = path;
        });
        return video_items;
        // return this._db.findAll("video");
    }

    async insert(path, video_data){
        const path_id = this._getPathID(path);
        video_data.path_id = path_id;

        await this._db.insert("path", {"id":path_id,"data":path});
        await this._db.insert("video", video_data);
    }

    async update(video_id, props){
        await this._db.update("video", video_id, props);
    }

    async _getPathID(path){
        const path_map = this._db.db_map.get("path");

        for (let [k, v] of path_map) {
            if (v.path == path) { 
                return k; 
            }
        }  

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            if(!path_map.has(index)){
                return index;
            } 
        }

        throw new Error("maximum id value has been exceeded");
    }

}

class testDB2 extends testDB {
    constructor(){
        super();
        this.test_log = [];
    }

    async _readFile(file_path){
        if(file_path.match(/db\.json/)){
            const data = 
                `[["path", [
                {"id":0,"data":"c:/data"}
                ]],
                ["video", [
                {"id":"sm1","data":{"id":"sm1","path_id":0,"tags":["tag1"]}},
                ]]]`;
            return data;
        }
    }

    async _existFile(file_path){
        if(file_path.match(/db\.json/)){
            return true;
        }
        return false; 
    }

    async _appendFile(file_path, data){
        const fname = path.basename(file_path);
        this.test_log[`append ${fname}`];
    }
    async _unlink(file_path){
        const fname = path.basename(file_path);
        this.test_log[`unlink ${fname}`];
        // await fs.unlink(file_path);
    }
    async _writeFile(file_path, data){
        const fname = path.basename(file_path);
        this.test_log[`writeFile ${fname}`];
        // await fs.writeFile(file_path, data, "utf-8");    
    }
    async _rename(old_path, new_path){
        const old_fname = path.basename(old_path);
        const new_fname = path.basename(new_path);
        this.test_log[`writeFile ${old_fname} ${new_fname}`];
        // await fs.rename(old_path, new_path);
    }
} 


test("db non", async t => {
    const db = new testDB({memory_only:true});

    t.falsy(db.exist("sm1"));
    t.is(db.find("sm1"), null);
    t.deepEqual(db.findAll(), []);
});

test("db1", async t => {
    const db = new testDB({memory_only:true});
    db.createTable(["p", "v"]);

    const p_list = [
        {id:"1", data: "n1-data1"},
        {id:"2", data: "n1-data2"}
    ];
    const v_list = [
        {id:"sm1", num:1, bool:false, ary:["tag1"]},
        {id:"sm2", num:2, bool:true, ary:["tag1","tag2"]}
    ];   

    await db.insert("p", p_list[0]);
    await db.insert("p", p_list[1]);

    await db.insert("v", v_list[0]);
    await db.insert("v", v_list[1]);

    t.truthy(db.exist("p", "1"));
    t.truthy(db.exist("p", "2"));
    t.falsy(db.exist("p", "3"));

    t.truthy(db.exist("v", "sm1"));
    t.truthy(db.exist("v", "sm2"));
    t.falsy(db.exist("v", "sm3"));

    t.falsy(db.exist("non", "1"));

    t.deepEqual(db.find("p", "1"), p_list[0]);
    t.deepEqual(db.find("p", "2"), p_list[1]);
    t.deepEqual(db.findAll("p"), p_list);

    t.deepEqual(db.find("v", "sm1"), v_list[0]);
    t.deepEqual(db.find("v", "sm2"), v_list[1]);
    t.deepEqual(db.findAll("v"), v_list);

    await db.update("v", "sm1", {bool:true, ary:["tag1", "tag2", "tag3"]});
    t.deepEqual(db.find("v", "sm1"), {id:"sm1", num:1, bool:true, ary:["tag1", "tag2", "tag3"]});

    t.deepEqual(db.findAll("v"), 
        [
            {id:"sm1", num:1, bool:true, ary:["tag1", "tag2", "tag3"]},
            v_list[1]
        ]);
    
});

test("db2", async t => {
    const filename = path.join(__dirname, "test.join");
    const db = new testDB({filename:filename});

    t.is(db.db_path, filename);
    t.is(db.log_path, path.join(__dirname, "test.log"));
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