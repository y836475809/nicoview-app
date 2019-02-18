const test = require("ava");
const SQLiteDB = require("../app/js/sqlite_db");

const db_file_path = `${__dirname}/data/sample.db`;

test.cb("sqlite db dirpath", (t) => {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read_dirpath();
        const dirpath_map = db.get_dirpath();

        t.deepEqual(dirpath_map, 
            new Map()
                .set(1, "file:///C:/data/サンプル")
                .set(2, "file:///C:/data")
        );

        t.end();
    });
});

test.cb("sqlite db tag", (t) => {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read_tag_string();
        db.read_tag();
        const tag_map = db.tag_map;

        t.deepEqual(tag_map,
            new Map()
                .set(1, ["タグ1", "タグ2"])
                .set(2, ["タグ1", "タグ2", "タグ3"])
                .set(3, ["タグ4"])
                .set(4, ["タグ5"])
                .set(5, ["タグ3", "タグ4", "タグ5"])
        );

        t.end();
    });
});

test.cb("sqlite db video", (t) => {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read();
        const video_map = db.get_video();
    
        t.truthy(video_map.has("sm1"));
        t.truthy(video_map.has("sm2"));
        t.truthy(video_map.has("sm3"));
        t.truthy(video_map.has("sm4"));
        t.truthy(video_map.has("sm5"));
    
        const sm1 = video_map.get("sm1");
        const sm2 = video_map.get("sm2");
        const sm3 = video_map.get("sm3");
        const sm4 = video_map.get("sm4");
        const sm5 = video_map.get("sm5");
    
        t.is(sm1.video_name, "サンプル1");
        t.is(sm1.video_filename, "サンプル1 - [sm1].mp4");
        t.is(sm1.video_type, "video/mp4");
    
        t.deepEqual(sm1.tags, ["タグ1", "タグ2"]);
        t.deepEqual(sm2.tags, ["タグ1", "タグ2", "タグ3"]);
        t.deepEqual(sm3.tags, ["タグ4"]);
        t.deepEqual(sm4.tags, ["タグ5"]);
        t.deepEqual(sm5.tags, ["タグ3", "タグ4", "タグ5"]);

        t.end();
    });
});