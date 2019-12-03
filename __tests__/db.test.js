const test = require("ava");

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
    constructor(){

    }

    setData(path_list, video_list){
        this.p_map = rr("path_id", path_list);
        this.v_map = rr("video_id", video_list);
        this.uu = [];
    }

    addPath(path){
        const normalized_path = FileUtils.normalizePath(path);
        for (let [k, v] of this.p_map) {
            if (v === normalized_path) { 
                return k; 
            }
        }  

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            if(!this.p_map.has(index)){
                this.p_map.set(index, normalized_path);
                this.uu.push({
                    "target":"path",
                    "type":"add",
                    "value":{"path_id":index,"value":normalized_path}
                });
                return index;
            } 
        }

        throw new Error("maximum id value has been exceeded");
    }

    getItem(video_id){
        if(!this.v_map.has(video_id)){
            return null;
        }   
        
        return this.v_map.get(video_id);
    }

    getItems(){        
        return Array.from(this.v_map.values());
    }

    addItem(path, item){
        const path_id = this.addPath(path);
        item.path_id = path_id;
        this.v_map.set(item.video_id, item);
        this.uu.push({
            "target":"library",
            "type":"add",
            "value":{"video_id":item.video_id,"value":item}
        });
    }

    updateItem(video_id, items){
        if(!this.v_map.has(video_id)){
            throw new Error(`not has ${video_id}`);
        }

        this.v_map.set(video_id, 
            Object.assign(this.v_map.get(video_id), items));
    }
}

test("db", t => {
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