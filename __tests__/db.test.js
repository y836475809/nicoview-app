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
        this.autonum = autonum;
        this.memory_only = memory_only;
        this.db_path = filename;
        this.log_path = path.join(dir, 
            `${path.basename(this.db_path, path.extname(this.db_path))}.log`);
        this.init();
    }

    init(){
        this.p_map = new Map();
        this.v_map = new Map();
        this.cmd_logs = [];
    }

    setPathData(data_list){
        this.p_map = rr("path_id", data_list);
    }

    setVideoData(data_list){
        this.v_map = rr("video_id", data_list);
    }

    async load(){
        if(await this.existfile(this.db_path)===true){ 
            const jsonString = await fs.readFile(this.db_path, "utf-8");
            const obj = JSON.parse(jsonString);
            const r_map = new Map(obj);            
            this.setPathData(r_map.get("path"));
            this.setVideoData(r_map.get("library"));
        }
        
        if(await this.existfile(this.log_path)===true){
            const logstr = await fs.readFile(this.log_path, "utf-8");
            this.cmd_logs = JSON.parse(logstr);
            this._applyCmdLog();
            await this.save();
        }
    }

    async existfile(file_path){
        try {
            await fs.stat(file_path);
            return true;
        } catch (error) {
            return false;
        }  
    }

    async addPath(path){
        for (let [k, v] of this.p_map) {
            if (v == path) { 
                return k; 
            }
        }  

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            if(!this.p_map.has(index)){
                this.p_map.set(index, path);
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
        return this.v_map.has(video_id);
    }

    find(video_id){
        if(video_id===undefined){
            return Array.from(this.v_map.values()); 
        }
        
        if(!this.v_map.has(video_id)){
            return [];
        }   
        return [this.v_map.get(video_id)];
    }

    async insert(path, data){
        const path_id = await this.addPath(path);
        data.path_id = path_id;
        this.v_map.set(data.video_id, data);

        await this._log({
            "target":"library",
            "type":"insert",
            "value":{"id":data.video_id,"data":data}
        });
    }

    async update(video_id, props){
        if(!this.v_map.has(video_id)){
            throw new Error(`not has ${video_id}`);
        }

        this.v_map.set(video_id, 
            Object.assign(this.v_map.get(video_id), props));

        await this._log({
            "target":"library",
            "type":"update",
            "value":{"id":video_id,"data":props}
        });
    }

    async save(){
        const lmap = new Map();
        lmap.set("path", Array.from( this.p_map.values() ));
        lmap.set("library", Array.from( this.v_map.values() ));

        const o_items = [];
        lmap.forEach((value, key)=>{
            o_items.push(pp(key, value));
        });

        const jsonString = `[${o_items.join(",\n")}]`;
        await this._writeFile(this.db_path , jsonString);
        await this._deletelog();
    }

    async _writeFile(file_path, data){
        if(this.memory_only){
            return;
        }

        const tmp_path = path.join(path.dirname(file_path), `~${path.basename(file_path)}`);
        await fs.writeFile(tmp_path, data, "utf-8");    
        await fs.rename(tmp_path, file_path);
    }

    async _log(cmd){
        this.cmd_logs.push(cmd); 
        if(this.cmd_logs.length >= this.autonum){
            await this.save();
            this.cmd_logs = [];
        }
        await this._writelog();
    }

    async _deletelog(){
        if(this.memory_only){
            return;
        }
        await fs.unlink(this.log_path);
    } 

    async _writelog(){
        if(this.memory_only){
            return;
        }
        const uu_str = pp_ary(this.cmd_logs);
        await fs.writeFile(this.log_path, uu_str);
    }

    _applyCmdLog(){
        this.cmd_logs.forEach(item=>{
            if(item.target=="path"){
                const value = item.value;
                if(item.type=="insert"){
                    this.p_map.set(value.id, value);
                }
            }
            if(item.target=="library"){
                const value = item.value;
                if(item.type=="insert"){
                    this.v_map.set(value.id, value);
                }
                if(item.type=="update"){
                    if(!this.v_map.has(value.id)){
                        return;
                    }
                    this.v_map.set(value.id, 
                        Object.assign(this.v_map.get(value.id), value.data));
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
        {"video_id":"sm1","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});
    await db.insert("c:/data", 
        {"video_id":"sm2","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});
    await db.insert("c:/data/test", 
        {"video_id":"sm3","path_id":-1,"is_economy":false,"time":100,"tags":["タグ1"]});

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