var assert = require("power-assert")
var SQLiteDB = require("../../app/js/sqlite_db")

const db_file_path = "./test/sql/sample.db"

it("sqlite db dirpath", function () {
    let db = new SQLiteDB()
    db.init(db_file_path)
    db.read_dirpath()
    const dirpath_map = db.get_dirpath()
    assert.deepStrictEqual(dirpath_map,
        new Map()
            .set(1, "file:///C:/data/サンプル")
            .set(2, "file:///C:/data")
    )

    // let mm = new Map()
    // mm.set(0, {t:[1,2], k:9})
    // mm.set(1, {t:[1,2, 3], k:29})
    // let ss = JSON.stringify([...mm], null, "    ")
    // console.log("JSON.stringify = ", ss)
    // let remap = new Map(JSON.parse(ss))
    // console.log("remap = ", remap)
    // console.log("remap 1 k= ", remap.get(1).k)
})

it("sqlite db tag", function () {
    let db = new SQLiteDB()
    db.init(db_file_path)
    db.read_tag_string()
    db.read_tag()
    const tag_map = db.tag_map
    assert.deepStrictEqual(tag_map,
        new Map()
            .set(1, ["タグ1", "タグ2"])
            .set(2, ["タグ1", "タグ2", "タグ3"])
            .set(3, ["タグ4"])
            .set(4, ["タグ5"])
            .set(5, ["タグ3", "タグ4", "タグ5"])
    )
})

it("sqlite db video", function () {
    let db = new SQLiteDB()
    db.init(db_file_path)
    db.read()
    const video_map = db.get_video()

    assert.ok(video_map.has("sm1"))
    assert.ok(video_map.has("sm2"))
    assert.ok(video_map.has("sm3"))
    assert.ok(video_map.has("sm4"))
    assert.ok(video_map.has("sm5"))

    const sm1 = video_map.get("sm1")
    const sm2 = video_map.get("sm2")
    const sm3 = video_map.get("sm3")
    const sm4 = video_map.get("sm4")
    const sm5 = video_map.get("sm5")

    assert.deepStrictEqual(sm1.tags, ["タグ1", "タグ2"])
    assert.deepStrictEqual(sm2.tags, ["タグ1", "タグ2", "タグ3"])
    assert.deepStrictEqual(sm3.tags, ["タグ4"])
    assert.deepStrictEqual(sm4.tags, ["タグ5"])
    assert.deepStrictEqual(sm5.tags, ["タグ3", "タグ4", "タグ5"])
})