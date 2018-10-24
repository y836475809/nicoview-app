const SQLiteDB = require("../app/js/sqlite_db");

const db_file_path = `${__dirname}/data/sample.db`;

test("sqlite db dirpath", function () {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read_dirpath();
        const dirpath_map = db.get_dirpath();
        expect(dirpath_map).toEqual(
            new Map()
                .set(1, "file:///C:/data/サンプル")
                .set(2, "file:///C:/data")
        );
    });
});

test("sqlite db tag", function () {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read_tag_string();
        db.read_tag();
        const tag_map = db.tag_map;
        expect(tag_map).toEqual(
            new Map()
                .set(1, ["タグ1", "タグ2"])
                .set(2, ["タグ1", "タグ2", "タグ3"])
                .set(3, ["タグ4"])
                .set(4, ["タグ5"])
                .set(5, ["タグ3", "タグ4", "タグ5"])
        );
    });
});

test("sqlite db video", function () {
    let db = new SQLiteDB();
    db.init(db_file_path, (err)=>{
        db.read();
        const video_map = db.get_video();
    
        expect(video_map.has("sm1")).toBeTruthy();
        expect(video_map.has("sm2")).toBeTruthy();
        expect(video_map.has("sm3")).toBeTruthy();
        expect(video_map.has("sm4")).toBeTruthy();
        expect(video_map.has("sm5")).toBeTruthy();
    
        const sm1 = video_map.get("sm1");
        const sm2 = video_map.get("sm2");
        const sm3 = video_map.get("sm3");
        const sm4 = video_map.get("sm4");
        const sm5 = video_map.get("sm5");
    
        expect(sm1.video_name).toEqual("サンプル1");
        expect(sm1.video_filename).toEqual("サンプル1 - [sm1].mp4");
        expect(sm1.video_type).toEqual("video/mp4");
    
        expect(sm1.tags).toEqual(["タグ1", "タグ2"]);
        expect(sm2.tags).toEqual(["タグ1", "タグ2", "タグ3"]);
        expect(sm3.tags).toEqual(["タグ4"]);
        expect(sm4.tags).toEqual(["タグ5"]);
        expect(sm5.tags).toEqual(["タグ3", "タグ4", "タグ5"]);
    });
});