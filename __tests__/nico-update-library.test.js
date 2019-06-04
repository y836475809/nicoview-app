const test = require("ava");
const path = require("path");
const { TestData} = require("./helper/nico-mock");
const { NicoUpdate } = require("../app/js/nico-update");
const Library = require("../app/js/library");

/** @type {Library} */
let library = null;

test.beforeEach(async t => {
    library = new Library();
    await library.init(__dirname, true);
    const dirpath_list = [
        { dirpath_id: 1, dirpath: "/data/" }
    ];
    const video_list = [
        {
            _db_type:"json", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "sm1",
            video_type: "mp4",
            is_deleted: false,
            tags: []
        },
        {
            _db_type:"json", 
            video_id: "sm2",
            dirpath_id: 1,
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_deleted: true,
            tags: []
        },
        {
            _db_type:"xml", 
            video_id: "sm3",
            dirpath_id: 1,
            video_name: "サンプル3",
            common_filename: "サンプル3 - [sm3]",
            video_type: "mp4",
            is_deleted: false,
            tags: []
        },
        {
            _db_type:"xml", 
            video_id: "sm4",
            dirpath_id: 1,
            video_name: "サンプル4",
            common_filename: "サンプル4 - [sm4]",
            video_type: "mp4",
            is_deleted: true,
            tags: []
        },
        {
            _db_type:"json", 
            video_id: "sm5",
            dirpath_id: 1,
            video_name: "サンプル5",
            common_filename: "sm5",
            video_type: "mp4",
            is_deleted: false,
            tags: ["tag1"]
        },
        {
            _db_type:"json", 
            video_id: "sm6",
            dirpath_id: 1,
            video_name: "サンプル6",
            common_filename: "sm6",
            video_type: "mp4",
            is_deleted: false,
            tags: ["tag1", "tag2", "tag3"]
        },
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
        return { 
            is_deleted: this.nico_video_deleted, tags: [], 
            thumbInfo: {}, comments: [] };
    } 
    async _getCurrentComments(dir_path, video_info){
        return [];
    }
    async _writeFile(file_path, data){
        this.paths.push(file_path);
    }
}

class TestNicoUpdateTags extends NicoUpdate {
    async _getWatchData(){
        return { api_data: TestData.data_api_data };
    }
    async _getComments(api_data, cur_comments){
        return [];
    }
    async _getCurrentComments(dir_path, video_info){
        return [];
    }
    async _writeFile(file_path, data){
    }
}

test("update if video is not deleted", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.truthy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm1[ThumbInfo].json"),
        path.normalize("/data/sm1[Comment].json")
    ]);
});

test("update if video is deleted", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    t.truthy(await nico_update.update());
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm1[ThumbInfo].json"),
        path.normalize("/data/sm1[Comment].json")
    ]);
});

test("update if is_deleted of librasy is true, video is not deleted", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.truthy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm2[ThumbInfo].json"),
        path.normalize("/data/sm2[Comment].json")
    ]);
});

test("update if is_deleted of librasy is true, video is deleted", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    t.truthy(await nico_update.update());
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm2[ThumbInfo].json"),
        path.normalize("/data/sm2[Comment].json")
    ]);
});

test("not update if dbtype is xml(video is not deleted)", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.falsy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("not update if dbtype is xml(video is deleted)", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    t.falsy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("not update if dbtype is xml(is_deleted of librasy is false)", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.falsy(await nico_update.update());
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("not update if dbtype is xml(is_deleted of librasy is true)", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    
    t.falsy(await nico_update.update());
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("update tag, add tags", async t => {
    const video_id = "sm5";
    const nico_update = new TestNicoUpdateTags(video_id, library);
    
    t.truthy(await nico_update.update());
    const tags = await library.getFieldValue(video_id, "tags");
    t.deepEqual(tags, ["tag1", "tag2", "tag3"]);
});

test("update tag, same tags", async t => {
    const video_id = "sm6";
    const nico_update = new TestNicoUpdateTags(video_id, library);
    
    t.truthy(await nico_update.update());
    const tags = await library.getFieldValue(video_id, "tags");
    t.deepEqual(tags, ["tag1", "tag2", "tag3"]);
});