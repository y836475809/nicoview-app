const test = require("ava");
const nock = require("nock");
const path = require("path");
const { TestData} = require("./helper/nico-mock");
const { NicoUpdate } = require("../app/js/nico-update");
const { Library } = require("../app/js/library");

/** @type {Library} */
let library = null;

test.beforeEach(async t => {
    nock.disableNetConnect();

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
            tags: [],
            thumbnail_size: "L"
        },
        {
            _db_type:"json", 
            video_id: "sm2",
            dirpath_id: 1,
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_deleted: true,
            tags: [],
            thumbnail_size: "L"
        },
        {
            _db_type:"xml", 
            video_id: "sm3",
            dirpath_id: 1,
            video_name: "サンプル3",
            common_filename: "サンプル3 - [sm3]",
            video_type: "mp4",
            is_deleted: false,
            tags: [],
            thumbnail_size: "S"
        },
        {
            _db_type:"xml", 
            video_id: "sm4",
            dirpath_id: 1,
            video_name: "サンプル4",
            common_filename: "サンプル4 - [sm4]",
            video_type: "mp4",
            is_deleted: true,
            tags: [],
            thumbnail_size: "S"
        },
        {
            _db_type:"json", 
            video_id: "sm5",
            dirpath_id: 1,
            video_name: "サンプル5",
            common_filename: "sm5",
            video_type: "mp4",
            is_deleted: false,
            tags: ["tag1"],
            thumbnail_size: "L"
        },
        {
            _db_type:"json", 
            video_id: "sm6",
            dirpath_id: 1,
            video_name: "サンプル6",
            common_filename: "sm6",
            video_type: "mp4",
            is_deleted: false,
            tags: ["tag1", "tag2", "tag3"],
            thumbnail_size: "L"
        },
    ];
    await library.setData(dirpath_list, video_list);
});

class TestNicoUpdate extends NicoUpdate {
    constructor(video_id, library, nico_video_deleted){
        super(video_id, library);
        this.nico_video_deleted = nico_video_deleted;
        this.paths = [];
        this.data_api_data = JSON.parse(JSON.stringify(TestData.data_api_data));
        this.data_api_data.video.isDeleted = nico_video_deleted;
    } 
    async _getWatchData(){
        return { cookie_jar: null, api_data: this.data_api_data };
    }
    async _getCurrentComments(dir_path, video_info){
        return [];
    }
    async _getComments(api_data, cur_comments){
        return [{}];
    }
    async _getThumbImg(url){
        return "jpeg";
    }
    async _writeFile(file_path, data){
        this.paths.push(file_path);
    }

    _validateThumbnail(bytes){
        return true;
    }
}

class TestNicoUpdateTags extends NicoUpdate {
    constructor(video_id, library){
        super(video_id, library);
        this.data_api_data = JSON.parse(JSON.stringify(TestData.data_api_data));
    }
    async _getWatchData(){
        return { cookie_jar: null, api_data: this.data_api_data };
    }
    async _getComments(api_data, cur_comments){
        return [{}];
    }
    async _getCurrentComments(dir_path, video_info){
        return [];
    }
    async _getThumbImg(url){
        return "jpeg";
    }
    async _writeFile(file_path, data){
    }

    _validateThumbnail(bytes){
        return true;
    }
}

test("update thumbinfo, comment if dbtype is json", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.truthy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.is(await library.getFieldValue(video_id, "thumbnail_size"), "L");
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm1[ThumbInfo].json"),
        path.normalize("/data/sm1[Comment].json"),
        path.normalize("/data/sm1[ThumbImg].L.jpeg")
    ]);
});

test("throw error if video is deleted", async t => {
    const video_id = "sm1";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.is(await library.getFieldValue(video_id, "thumbnail_size"), "L");
    t.deepEqual(nico_update.paths, []);
});

test("throw error if is_deleted of librasy is true, video is not deleted", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("throw error if is_deleted of librasy is true, video is deleted", async t => {
    const video_id = "sm2";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("update thumbinfo, comment, thumnail if dbtype is xml", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    t.truthy(await nico_update.update());
    t.falsy(await library.getFieldValue(video_id, "is_deleted"));
    t.is(await library.getFieldValue(video_id, "thumbnail_size"), "L");
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/サンプル3 - [sm3][ThumbInfo].json"),
        path.normalize("/data/サンプル3 - [sm3][Comment].json"),
        path.normalize("/data/サンプル3 - [sm3][ThumbImg].L.jpeg")
    ]);
});

test("throw error if dbtype is xml, video is deleted", async t => {
    const video_id = "sm3";
    const nico_update = new TestNicoUpdate(video_id, library, true);

    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("throw error if dbtype is xml, is_deleted of librasy is true", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, false);

    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(await library.getFieldValue(video_id, "is_deleted"));
    t.deepEqual(nico_update.paths, []);
});

test("throw error if dbtype is xml, is_deleted of librasy is true, video is deleted)", async t => {
    const video_id = "sm4";
    const nico_update = new TestNicoUpdate(video_id, library, true);
    
    const error = await t.throwsAsync(nico_update.update());
    t.is(error.message, `${video_id}は削除されています`);
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