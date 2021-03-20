const test = require("ava");
const path = require("path");
const { TestData} = require("./helper/nico-mock");
const { NicoAPI } = require("../app/js/niconico");
const { NicoUpdate } = require("../app/js/nico-update");

test.beforeEach(async t => {
    const video_item_map = {};
    [1, 2, 3, 4, 5, 6].map(value => {
        return {
            data_type: "json", 
            id: `sm${value}`,
            dirpath_id: 1,
            dirpath: "/data/",
            title: `サンプル${value}`,
            common_filename: `sm${value}`,
            video_type: "mp4",
            is_deleted: false,
            tags: [],
            thumbnail_size: "L"
        };
    }).forEach(video_item => {
        video_item_map[video_item.id] = video_item;
    });

    Object.assign(video_item_map["sm2"], {
        is_deleted: true
    });
    Object.assign(video_item_map["sm3"], {
        data_type :"xml",
        common_filename : "サンプル3",
        thumbnail_size: "S"
    });
    Object.assign(video_item_map["sm4"], {
        data_type :"xml",
        common_filename : "サンプル4",
        is_deleted: true,
        thumbnail_size: "S"
    });
    Object.assign(video_item_map["sm5"], {
        tags: ["tag1"]
    });
    Object.assign(video_item_map["sm6"], {
        tags: ["tag1", "tag2", "tag3"],
    });
    t.context.video_item_map = video_item_map;
});

class TestNicoUpdate extends NicoUpdate {
    constructor(video_item, nico_video_deleted){
        super(video_item);
        this.nico_video_deleted = nico_video_deleted;
        this.paths = [];

        const data_api_data = JSON.parse(JSON.stringify(TestData.data_api_data));
        this.nico_api = new NicoAPI();
        this.nico_api.parse(data_api_data);
        this.nico_api._video.isDeleted = nico_video_deleted;
    } 
    async _getWatchData(){
        return { cookie_jar: null, nico_api: this.nico_api };
    }
    _getCurrentCommentData(){
        return [];
    }
    async _getComments(nico_api, cur_comments){
        return [{}];
    }
    async _getThumbImg(url){
        return "jpeg";
    }
    _writeFile(file_path, data){
        this.paths.push(file_path);
    }
    _validateThumbnail(bytes){
        return true;
    }
}

class TestNicoUpdateTags extends NicoUpdate {
    constructor(video_item){
        super(video_item);

        const data_api_data = JSON.parse(JSON.stringify(TestData.data_api_data));
        this.nico_api = new NicoAPI();
        this.nico_api.parse(data_api_data);
    }
    async _getWatchData(){
        return { cookie_jar: null, nico_api: this.nico_api };
    }
    async _getComments(nico_api, cur_comments){
        return [{}];
    }
    _getCurrentCommentData(){
        return [];
    }
    async _getThumbImg(url){
        return "jpeg";
    }
    _writeFile(file_path, data){
    }
    _validateThumbnail(bytes){
        return true;
    }
}

test("update thumbinfo, comment if dbtype is json", async t => {
    
    const video_id = "sm1";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, false);

    await nico_update.update();
    const updated_video_item = nico_update.video_item;
    t.falsy(updated_video_item.is_deleted);
    t.is(updated_video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/sm1 - [sm1][ThumbInfo].json"),
        path.normalize("/data/sm1 - [sm1][Comment].json"),
        path.normalize("/data/sm1 - [sm1][ThumbImg].L.jpeg")
    ]);
});

test("throw error if video is deleted", async t => {
    const video_id = "sm1";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, true);

    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.is(updated_video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, []);
});

test("throw error if is_deleted of librasy is true, video is not deleted", async t => {
    const video_id = "sm2";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, false);

    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.deepEqual(nico_update.paths, []);
});

test("throw error if is_deleted of librasy is true, video is deleted", async t => {
    const video_id = "sm2";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, true);

    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.deepEqual(nico_update.paths, []);
});

test("update thumbinfo, comment, thumnail if dbtype is xml", async t => {
    const video_id = "sm3";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, false);

    await nico_update.update();
    const updated_video_item = nico_update.video_item;
    t.falsy(updated_video_item.is_deleted);
    t.is(updated_video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize("/data/サンプル3 - [sm3][ThumbInfo].json"),
        path.normalize("/data/サンプル3 - [sm3][Comment].json"),
        path.normalize("/data/サンプル3 - [sm3][ThumbImg].L.jpeg")
    ]);
});

test("throw error if dbtype is xml, video is deleted", async t => {
    const video_id = "sm3";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, true);

    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.deepEqual(nico_update.paths, []);
});

test("throw error if dbtype is xml, is_deleted of librasy is true", async t => {
    const video_id = "sm4";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, false);

    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.deepEqual(nico_update.paths, []);
});

test("throw error if dbtype is xml, is_deleted of librasy is true, video is deleted)", async t => {
    const video_id = "sm4";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdate(video_item, true);
    
    const error = await t.throwsAsync(nico_update.update());
    const updated_video_item = nico_update.video_item;
    t.is(error.message, `${video_id}は削除されています`);
    t.truthy(updated_video_item.is_deleted);
    t.deepEqual(nico_update.paths, []);
});

test("update tag, add tags", async t => {
    const video_id = "sm5";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdateTags(video_item);
    
    await nico_update.update();
    const updated_video_item = nico_update.video_item;
    t.deepEqual(updated_video_item.tags, ["tag1", "tag2", "tag3"]);
});

test("update tag, same tags", async t => {
    const video_id = "sm6";
    const video_item = t.context.video_item_map[video_id];
    const nico_update = new TestNicoUpdateTags(video_item);
    
    await nico_update.update();
    const updated_video_item = nico_update.video_item;
    t.deepEqual(updated_video_item.tags, ["tag1", "tag2", "tag3"]);
});