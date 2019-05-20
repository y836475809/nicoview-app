const test = require("ava");
const path = require("path");
const { NicoUpdate } = require("../app/js/nico-update");
const Library = require("../app/js/library");

/** @type {Library} */
let library = null;

test.beforeEach(async t => {
    library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "/data/" }
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "sm1",
            video_type: "mp4",
            is_deleted: false
        },
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm2",
            dirpath_id: 1,
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_deleted: true
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm3",
            dirpath_id: 1,
            video_name: "サンプル3",
            common_filename: "サンプル3 - [sm3]",
            video_type: "mp4",
            is_deleted: false
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm4",
            dirpath_id: 1,
            video_name: "サンプル4",
            common_filename: "サンプル4 - [sm4]",
            video_type: "mp4",
            is_deleted: true
        }
    ];
    await library.setData(dirpath_list, video_list);
});

class TestNicoUpdate extends NicoUpdate {
    constructor(video_id, library, nico_video_deleted){
        super(video_id, library);
        this.nico_video_deleted = nico_video_deleted;
        this.paths = [];
    }
    async _get(cur_comments){
        return { is_deleted: this.nico_video_deleted, thumbInfo: {}, comments: [] };
    }
    async _writeFile(file_path, data){
        this.paths.push(file_path);
    }
}

test("update1", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, false);
    const { is_deleted, thumbInfo, comments } = await nico_update.update([]);
    t.falsy(is_deleted);
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));

    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm1[ThumbInfo].json"),
        path.normalize("/data/sm1[Comment].json")
    ]);
});

test("update2", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    const { is_deleted, thumbInfo, comments } = await nico_update.update([]);
    t.truthy(is_deleted);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));

    t.deepEqual(nico_update.paths, []);
});

test("update3", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, false);
    const { is_deleted, thumbInfo, comments } = await nico_update.update([]);
    t.truthy(is_deleted);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));

    t.deepEqual(nico_update.paths, []);
});

test("update4", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    const { is_deleted, thumbInfo, comments } = await nico_update.update([]);
    t.truthy(is_deleted);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));

    t.deepEqual(nico_update.paths, []);
});

test("update xml1", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, false);
    await t.throwsAsync(nico_update.update([]));
});

test("update xml2", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    await t.throwsAsync(nico_update.update([]));
});

test("update xml3", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, false);
    await t.throwsAsync(nico_update.update([]));
});

test("update xml4", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    await t.throwsAsync(nico_update.update([]));
});


