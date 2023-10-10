const test = require("ava");
const path = require("path");

const { MapDB, LibraryDB } = require("../src/lib/db");


class testMapDB extends MapDB {
    constructor(exist_log=false){
        super({autonum:2});
        this.test_log = [];
        this.exist_log = exist_log;
        this.createTable([{name:"path", id:"id"}, {name:"video", id:"video_id"}]);
    }

    async _readFile(file_path){
        if(file_path.match(/db\.json/)){
            const data = 
                `[["path", [
                {"id":"0","dirpath":"c:/data"}
                ]],
                ["video", [
                {"video_id":"sm1","dirpath_id":"0","tags":["tag1"]}
                ]]]`;
            return data;
        }

        if(file_path.match(/db\.log/)){
            return `
            {"target":"path","type":"insert","value":{"id":"1","data":{"id":"1","dirpath":"c:/data1"}}}
            {"target":"video","type":"insert","value":{"video_id":"sm2","data":{"video_id":"sm2","dirpath_id":"1","tags":["tag2"]}}}
            {"target":"video","type":"update","value":{"video_id":"sm1","data":{"tags":["tag1","tag2","tag3"]}}}
            `;
        }
    }

    async _existFile(file_path){
        if(file_path.match(/db\.json/)){
            return true;
        }
        if(file_path.match(/db\.log/)){
            return this.exist_log;
        }
        return false;
    }

    async _appendFile(file_path, data){ // eslint-disable-line no-unused-vars
        const fname = path.basename(file_path);
        this.test_log.push(`append ${fname}`);
    }
    async _unlink(file_path){
        const fname = path.basename(file_path);
        this.test_log.push(`unlink ${fname}`);
    }
    _writeFile(file_path, data){ // eslint-disable-line no-unused-vars
        const fname = path.basename(file_path);
        this.test_log.push(`writeFile ${fname}`);   
    }
    _rename(old_path, new_path){
        const old_fname = path.basename(old_path);
        const new_fname = path.basename(new_path);
        this.test_log.push(`rename ${old_fname} ${new_fname}`);
    }
} 

class testLibraryDB extends LibraryDB {
    constructor(exist_log=false){
        super({autonum:2});
        this.exist_log = exist_log;
    }

    _createDB(params){ // eslint-disable-line no-unused-vars
        return new testMapDB(this.exist_log);
    }
} 


test("db non", async t => {
    const db = new MapDB({use_log:false});

    t.falsy(db.exist("sm1"));
    t.is(db.find("sm1"), null);
    t.deepEqual(db.findAll(), []);
});

test("db1", async t => {
    const db = new MapDB({use_log:false});
    db.createTable([{name:"p", id:"id"}, {name:"v", id:"id"}]);

    const p_list = [
        {id:"1", dirpath: "n1-data1"},
        {id:"2", dirpath: "n1-data2"}
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

test("db delete", async t => {
    const db = new testMapDB();
    await db.load();

    t.deepEqual(db.find("video", "sm1"), {video_id:"sm1",dirpath_id:"0", tags:["tag1"]});
    db.delete("video", "sm1");
    t.is(db.find("video", "sm1"), null);
});


test("db2", async t => {
    const filename = path.join(__dirname, "test.join");
    const db = new MapDB({filename:filename});

    t.is(db.db_path, filename);
    t.is(db.log_path, path.join(__dirname, "test.log"));
});

test("db3", async t => {
    const db_fname = "db.json";
    const db_tmp_fname = "~db.json";
    const log_fname = "db.log";

    const db = new testMapDB();
    await db.load();

    await db.insert("path", {id:1, dirpath:1});
    await db.insert("path", {id:1, dirpath:1});
    await db.update("video", "sm1", {dirpath_id:1});
    await db.save();
    await db.delete("video", "sm1", {dirpath_id:1});

    t.deepEqual(db.test_log, [
        `append ${log_fname}`,
        `append ${log_fname}`,

        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,

        `append ${log_fname}`,

        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,

        `append ${log_fname}`,
    ]);
});

test("db4", async t => {
    const db_fname = "db.json";
    const db_tmp_fname = "~db.json";
    const log_fname = "db.log";

    const exist_log = true;
    const db = new testMapDB(exist_log);
    await db.load();

    t.deepEqual(db.findAll("path"), [
        {id:"0",dirpath:"c:/data"},
        {id:"1",dirpath:"c:/data1"}
    ]);

    t.deepEqual(db.findAll("video"), [
        {video_id:"sm1",dirpath_id:"0",tags:["tag1","tag2","tag3"]},
        {video_id:"sm2",dirpath_id:"1",tags:["tag2"]},
    ]);

    t.deepEqual(db.test_log, [
        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,
    ]);
});

test("db path", async t => {
    const db = new testLibraryDB();
    await db.load();

    await db.insert("c:/data", {video_id:"sm2"});
    t.deepEqual(db.find("sm2"), {video_id:"sm2",dirpath_id:"0", dirpath:"c:/data"});

    await db.insert("c:/data1", {video_id:"sm3"});
    t.deepEqual(db.find("sm3"), {video_id:"sm3",dirpath_id:"1", dirpath:"c:/data1"});

    await db.insert("c:/data1", {video_id:"sm4"});
    t.deepEqual(db.find("sm4"), {video_id:"sm4",dirpath_id:"1", dirpath:"c:/data1"});
});

test("db log", async t => {
    const exist_log = true;
    const db = new testLibraryDB(exist_log);
    await db.load();

    t.deepEqual(db.findAll(), [
        {video_id:"sm1", dirpath_id:"0", dirpath:"c:/data", tags:["tag1","tag2","tag3"]},
        {video_id:"sm2", dirpath_id:"1", dirpath:"c:/data1", tags:["tag2"]},
    ]);
});

test("db setdata", async t => {
    const db = new testLibraryDB();
    db.setPathData([        
        {id:"0",dirpath:"c:/data"},
        {id:"1",dirpath:"c:/data1"}
    ]);
    db.setVideoData([
        {video_id:"sm1",dirpath_id:"0",tags:["tag1"]},
        {video_id:"sm2",dirpath_id:"1",tags:["tag2"]}
    ]);
    t.deepEqual(db.findAll(), [
        {video_id:"sm1", dirpath_id:"0", dirpath:"c:/data", tags:["tag1"]},
        {video_id:"sm2", dirpath_id:"1", dirpath:"c:/data1", tags:["tag2"]},
    ]);
});

test("db deepcopy", async t => {
    const db = new LibraryDB();

    db.setPathData([        
        {id:"0",dirpath:"c:/data"},
        {id:"1",dirpath:"c:/data1"}
    ]);
    db.setVideoData([
        {video_id:"sm1",dirpath_id:"0",tags:["tag1"]},
        {video_id:"sm2",dirpath_id:"1",tags:["tag2"]}
    ]);
    t.deepEqual(db.findAll(), [
        {video_id:"sm1", dirpath_id:"0", dirpath:"c:/data", tags:["tag1"]},
        {video_id:"sm2", dirpath_id:"1", dirpath:"c:/data1", tags:["tag2"]},
    ]);

    const path_map = db._db.db_map.get("path");
    t.deepEqual(path_map.get("0"), {id:"0",dirpath:"c:/data"});
    t.deepEqual(path_map.get("1"), {id:"1",dirpath:"c:/data1"});

    const video_map = db._db.db_map.get("video");
    t.deepEqual(video_map.get("sm1"), {video_id:"sm1", dirpath_id:"0", tags:["tag1"]});
    t.deepEqual(video_map.get("sm2"), {video_id:"sm2", dirpath_id:"1", tags:["tag2"]});
});