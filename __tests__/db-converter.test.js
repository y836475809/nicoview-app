const test = require("ava");
const path = require("path");
const { DBConverter } = require("../app/js/import-nndd-db");

const db_file_path = `${__dirname}/data/sample.db`;

test("sqlite db dirpath", (t) => {
    const db = new DBConverter();
    db.init(db_file_path);
    db._read_dirpath();
    const dirpath_list = db.get_dirpath();
    t.deepEqual(dirpath_list, 
        [
            { id: 1, dirpath: `C:${path.sep}data${path.sep}サンプル` },
            { id: 2, dirpath: `C:${path.sep}data` }
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

    t.is(sm1.data_type, "xml");

    t.is(sm1.id, "sm1");
    t.is(sm2.id, "sm2");
    t.is(sm3.id, "sm3");
    t.is(sm4.id, "sm4");
    t.is(sm5.id, "sm5");

    t.is(sm1.video_name, "サンプル1");
    t.is(sm1.common_filename, "サンプル1 - [sm1]");
    t.is(sm1.video_type, "mp4");

    t.deepEqual(sm1.tags, ["タグ1", "タグ2"]);
    t.deepEqual(sm2.tags, ["タグ1", "タグ2", "タグ3"]);
    t.deepEqual(sm3.tags, ["タグ4"]);
    t.deepEqual(sm4.tags, ["タグ5"]);
    t.deepEqual(sm5.tags, ["タグ3", "タグ4", "タグ5"]);
});

test("sqlite db item", (t) => {
    const db = new DBConverter();
    db.init(db_file_path);
    db.read();
    const video_list = db.get_video();

    const sm1 = video_list[0];
    t.deepEqual(sm1, {
        data_type: "xml",
        dirpath_id: 1,
        id: "sm1",
        video_name: "サンプル1",
        video_type: "mp4",
        common_filename: "サンプル1 - [sm1]",
        is_economy: false,
        modification_date: 1307213799000,
        creation_date: 1332592373506,
        pub_date: 1305678645000,
        last_play_date: -1,
        play_count:10,
        play_time: 100,
        tags: ["タグ1", "タグ2"],
        is_deleted:false,
        thumbnail_size: "S",
    });
});