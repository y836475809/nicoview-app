const test = require("ava");
const path = require("path");
const { TestData } = require("./helper/nico-mock");
const { NicoAPI } = require("../src/lib/niconico");
const { NicoUpdate } = require("../src/lib/nico-update");

const test_video_id = "sm100";

class TestNicoUpdate extends NicoUpdate {
    constructor(video_item){
        super(video_item);

        this._img_data = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
        this._is_deleted_in_nico = false;
        this._large_thumb_url = "url-L";
        this._file_exist = false;
        this._comments_diff = [{}];

        this.paths = [];
        this.data = [];
        this.log = [];
    }

    _convertComment(nico_xml, nico_json){ // eslint-disable-line no-unused-vars
        this.log.push("_convertComment");
    }

    _convertThumbInfo(nico_xml, nico_json){ // eslint-disable-line no-unused-vars
        this.log.push("_convertThumbInfo");
    }

    _isDataTypeJson(){
        this.log.push("_isDataTypeJson");
        return super._isDataTypeJson();
    }

    _setDataType(data_type){
        this.log.push("_setDBtype");
        super._setDataType(data_type);
    }

    _setTags(tags){ // eslint-disable-line no-unused-vars
        this.log.push("_setTags");
    }

    _setThumbnailSize(thumbnail_size){
        this.log.push(`_setThumbnailSize:${thumbnail_size}`);
        super._setThumbnailSize(thumbnail_size);
    }

    _writeFile(file_path, data, encoding){ // eslint-disable-line no-unused-vars
        this.log.push("_writeFile");
        this.paths.push(file_path);
        this.data.push(data);
    }
    
    async _existPath(path){ // eslint-disable-line no-unused-vars
        return this._file_exist;
    }

    async _getWatchData(){
        const nico_api = new NicoAPI();
        nico_api.parse(TestData.data_api_data);
        nico_api._video.id = this.video_id;
        nico_api._video.isDeleted = this._is_deleted_in_nico;
        nico_api._video.thumbnail.largeUrl = this._large_thumb_url;
        nico_api._video.thumbnail.url = "url-S";
        const watch_data = {
            nico_api
        };

        return watch_data;
    }

    _getCurrentCommentData(){
        return {threads:[], chats:[]};
    }

    async _getComments(){
        return this._comments_diff;
    }

    async _getThumbImg(url){
        this.log.push(`_getThumbImg:${url}`);
        return this._img_data;
    }
}

test.beforeEach(t => {
    const video_item = {
        video_id : test_video_id,
        data_type : "xml",
        dirpath : "/data/",
        common_filename: test_video_id,
        thumbnail_size : "S",
        is_deleted : false
    };
    t.context.nico_update = new TestNicoUpdate(video_item);
});

test("updateThumbInfo, db=xml, not deleted in nico, not deleted in db", async (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;

    await new Promise(resolve => {
        nico_update.updateThumbInfo().then((result)=>{
            t.falsy(nico_update.video_item.is_deleted);
            t.deepEqual(nico_update.paths, [
                path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`)
            ]);
            t.not(result, undefined);
            t.deepEqual(nico_update.log, [
                "_setTags",
                "_writeFile",
                "_isDataTypeJson",
                "_convertComment",
                "_setDBtype",
            ]);
            resolve();
        });
    });
});

test("updateThumbInfo, db=xml, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update._is_deleted_in_nico = true;

    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=xml, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update._is_deleted_in_nico = true;
    
    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=json, not deleted in nico, not deleted in db", async (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    await new Promise(resolve => {
        nico_update.updateThumbInfo().then((result)=>{
            t.falsy(nico_update.video_item.is_deleted);
            t.deepEqual(nico_update.paths, [
                path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`)
            ]);
            t.not(result, undefined);
            t.deepEqual(nico_update.log, [
                "_setTags",
                "_writeFile",
                "_isDataTypeJson",
                "_convertComment",
            ]);
            resolve();
        });
    });
});

test("updateThumbInfo, db=json, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._is_deleted_in_nico = true;

    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=json, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._is_deleted_in_nico = true;
    
    await t.throwsAsync(nico_update.updateThumbInfo());
});


test("updateComment, db=xml, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;

    const result = await nico_update.updateComment();
    t.falsy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype",
    ]);
});

test("updateComment, db=xml, comments_diff is empty, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update._comments_diff = [];

    const result = await nico_update.updateComment();
    t.is(result, undefined);
    t.deepEqual(nico_update.log, []);
});

test("updateComment, db=xml, deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update._is_deleted_in_nico = true;

    const result = await nico_update.updateComment();
    t.truthy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype",
    ]);
});


test("updateComment, db=xml, not deleted in nico, deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.is_deleted = true;

    const result = await nico_update.updateComment();
    t.falsy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype",
    ]);
});

test("updateComment, db=json, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    const result = await nico_update.updateComment();
    t.falsy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
    ]);
});

test("updateComment, db=json, comments_diff is empty, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._comments_diff = [];

    const result = await nico_update.updateComment();
    t.is(result, undefined);
    t.deepEqual(nico_update.log, []);
});

test("updateComment, db=json, deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._is_deleted_in_nico = true;

    const result = await nico_update.updateComment();
    t.truthy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
    ]);
});

test("updateComment, db=json, not deleted in nico, deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.is_deleted = true;

    const result = await nico_update.updateComment();
    t.falsy(nico_update.video_item.is_deleted);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
    ]);
});


test("updateThumbnail, db=xml, thumb_size=S, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;

    const result = await nico_update.updateThumbnail();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "S");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].jpeg`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_isDataTypeJson",
        "_getThumbImg:url-S",   
        "_writeFile",
        "_setThumbnailSize:S",
    ]);
});

test("updateThumbnail, db=json, thumb_size=S, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    const result = await nico_update.updateThumbnail();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_isDataTypeJson",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
    ]);
});

test("updateThumbnail, db=json, thumb_size=L, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.thumbnail_size = "L";

    const result = await nico_update.updateThumbnail();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_isDataTypeJson",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
    ]);                             
});

test("updateThumbnail, db=json, thumb_size=L, large_thumb_url=null, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.thumbnail_size = "L";
    nico_update._large_thumb_url = null;

    const result = await nico_update.updateThumbnail();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, []);
    t.is(result, undefined);
    t.deepEqual(nico_update.log, [
        "_isDataTypeJson",
    ]);
});

test("updateThumbnail, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update._is_deleted_in_nico = true;

    await t.throwsAsync(nico_update.updateThumbnail());
});

test("updateThumbnail, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.is_deleted =true;

    await t.throwsAsync(nico_update.updateThumbnail());
});


test("update, db=xml, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;

    const result = await nico_update.update();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`),
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`),
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_writeFile",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
        "_isDataTypeJson",
        "_setDBtype",
    ]);
});

test("update, db=json, not deleted in nico, not deleted in db", async (t) => {
    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    const result = await nico_update.update();
    t.falsy(nico_update.video_item.is_deleted);
    t.is(nico_update.video_item.thumbnail_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`),
        path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`),
        path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
    ]);
    t.not(result, undefined);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_writeFile",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
        "_isDataTypeJson",
    ]);
});