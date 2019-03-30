const test = require("ava");
const DBConverter = require("../app/js/db-converter");

const db_file_path = `${__dirname}/data/sample.db`;

test("sqlite db dirpath", (t) => {
    const db = new DBConverter();
    db.init(db_file_path);
    db._read_dirpath();
    const dirpath_list = db.get_dirpath();
    t.deepEqual(dirpath_list, 
        [
            { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data/サンプル" },
            { _data_type:"dir", dirpath_id: 2, dirpath: "file:///C:/data" }
        ]
    );    
});

test("sqlite db tag", (t) => {
    const db = new DBConverter();
    db.init(db_file_path);
    db._read_tag_string();
    db._read_tag();
    const tag_map = db.tag_map;

    t.deepEqual(tag_map,
        new Map()
            .set(1, ["タグ1", "タグ2"])
            .set(2, ["タグ1", "タグ2", "タグ3"])
            .set(3, ["タグ4"])
            .set(4, ["タグ5"])
            .set(5, ["タグ3", "タグ4", "タグ5"])
    ); 
});

test("sqlite db video", (t) => {
    const db = new DBConverter();
    db.init(db_file_path);
    db.read();
    const video_list = db.get_video();

    const sm1 = video_list[0];
    const sm2 = video_list[1];
    const sm3 = video_list[2];
    const sm4 = video_list[3];
    const sm5 = video_list[4];

    t.is(sm1._data_type, "video");
    t.is(sm1._db_type, "xml");

    t.is(sm1.video_id, "sm1");
    t.is(sm2.video_id, "sm2");
    t.is(sm3.video_id, "sm3");
    t.is(sm4.video_id, "sm4");
    t.is(sm5.video_id, "sm5");

    t.is(sm1.video_name, "サンプル1");
    t.is(sm1.video_filename, "サンプル1 - [sm1].mp4");
    t.is(sm1.video_type, "mp4");

    t.deepEqual(sm1.tags, ["タグ1", "タグ2"]);
    t.deepEqual(sm2.tags, ["タグ1", "タグ2", "タグ3"]);
    t.deepEqual(sm3.tags, ["タグ4"]);
    t.deepEqual(sm4.tags, ["タグ5"]);
    t.deepEqual(sm5.tags, ["タグ3", "タグ4", "タグ5"]);
});