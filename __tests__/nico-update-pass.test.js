const test = require("ava");
const path = require("path");
const { NicoUpdate } = require("../app/js/nico-update");

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

    _convertComment(nico_xml, nico_json){
        this.log.push("_convertComment");
    }

    _convertThumbInfo(nico_xml, nico_json){
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

    _setTags(tags){
        this.log.push("_setTags");
    }

    _setThumbnailSize(thumbnail_size){
        this.log.push(`_setThumbnailSize:${thumbnail_size}`);
        super._setThumbnailSize(thumbnail_size);
    }

    async _writeFile(file_path, data, encoding){
        this.log.push("_writeFile");
        this.paths.push(file_path);
        this.data.push(data);
    }
    
    async _existPath(path){
        return this._file_exist;
    }

    async _getWatchData(){
        const watch_data = {
            api_data:{
                video:{
                    video_id: this.video_id,
                    title: "", 
                    description: "", 
                    isDeleted: this._is_deleted_in_nico,
                    thumbnailURL:"url-S",
                    largeThumbnailURL:this._large_thumb_url,
                    postedDateTime: 0, 
                    movieType:"mp4",
                    viewCount: 0, 
                    mylistCount: 0 
                },
                thread: {
                    commentCount: 0
                },
                tags:[],
                owner: {
                    id: "", 
                    nickname: "",
                    iconURL: "",
                }
            }
        };

        return watch_data;
    }

    _getCurrentCommentData(){
        return [];
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
        id : test_video_id,
        data_type : "xml",
        dirpath : "/data/",
        common_filename: test_video_id,
        thumbnail_size : "S",
        is_deleted : false
    };
    t.context.nico_update = new TestNicoUpdate(video_item);
});

test.cb("updateThumbInfo, db=xml, not deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbInfo().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_setTags",
            "_writeFile",
            "_isDataTypeJson",
            "_convertComment",
            "_setDBtype",
            "updated"
        ]);
        t.end();
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

test.cb("updateThumbInfo, db=json, not deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbInfo().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_setTags",
            "_writeFile",
            "_isDataTypeJson",
            "_convertComment",
            "updated"
        ]);
        t.end();
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


test.cb("updateComment, db=xml, not deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "_setTags",
            "_setDBtype",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateComment, db=xml, comments_diff is empty, not deleted in nico, not deleted in db", (t) => {
    t.plan(1);

    const nico_update = t.context.nico_update;
    nico_update._comments_diff= [];
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.deepEqual(nico_update.log, []);
        t.end();
    });
});

test.cb("updateComment, db=xml, deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update._is_deleted_in_nico = true;
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.truthy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "_setTags",
            "_setDBtype",
            "updated"
        ]);
        t.end();
    });
});


test.cb("updateComment, db=xml, not deleted in nico, deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update.video_item.is_deleted = true;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "_setTags",
            "_setDBtype",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateComment, db=json, not deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateComment, db=json, comments_diff is empty, not deleted in nico, not deleted in db", (t) => {
    t.plan(1);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._comments_diff = [];
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.deepEqual(nico_update.log, []);
        t.end();
    });
});

test.cb("updateComment, db=json, deleted in nico, not deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update._is_deleted_in_nico = true;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.truthy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateComment, db=json, not deleted in nico, deleted in db", (t) => {
    t.plan(3);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.is_deleted = true;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateComment().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`)
        ]);
        t.deepEqual(nico_update.log, [
            "_writeFile",
            "_isDataTypeJson",
            "_convertThumbInfo",
            "updated"
        ]);
        t.end();
    });
});


test.cb("updateThumbnail, db=xml, thumb_size=S, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbnail().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "S");
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].jpeg`)
        ]);
        t.deepEqual(nico_update.log, [
            "_isDataTypeJson",
            "_getThumbImg:url-S",   
            "_writeFile",
            "_setThumbnailSize:S",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateThumbnail, db=json, thumb_size=S, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbnail().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "L");
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
        ]);
        t.deepEqual(nico_update.log, [
            "_isDataTypeJson",
            "_getThumbImg:url-L",
            "_writeFile",
            "_setThumbnailSize:L",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateThumbnail, db=json, thumb_size=L, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.thumbnail_size = "L";
    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbnail().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "L");
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
        ]);
        t.deepEqual(nico_update.log, [
            "_isDataTypeJson",
            "_getThumbImg:url-L",
            "_writeFile",
            "_setThumbnailSize:L",
            "updated"
        ]);
        t.end();
    });
});

test.cb("updateThumbnail, db=json, thumb_size=L, large_thumb_url=null, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";
    nico_update.video_item.thumbnail_size = "L";
    nico_update._large_thumb_url = null;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.updateThumbnail().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "L");
        t.deepEqual(nico_update.paths, []);
        t.deepEqual(nico_update.log, [
            "_isDataTypeJson"
        ]);
        t.end();
    });
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


test.cb("update, db=xml, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.update().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "L");
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`),
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`),
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
        ]);
        t.deepEqual(nico_update.log, [
            "_setTags",
            "_writeFile",
            "_writeFile",
            "_getThumbImg:url-L",
            "_writeFile",
            "_setThumbnailSize:L",
            "_isDataTypeJson",
            "_setDBtype",
            "updated"
        ]);
        t.end();
    });
});

test.cb("update, db=json, not deleted in nico, not deleted in db", (t) => {
    t.plan(4);

    const nico_update = t.context.nico_update;
    nico_update.video_item.data_type = "json";

    nico_update.on("updated", ()=>{
        nico_update.log.push("updated");
    });
    nico_update.update().then(()=>{
        t.falsy(nico_update.video_item.is_deleted);
        t.is(nico_update.video_item.thumbnail_size, "L");
        t.deepEqual(nico_update.paths, [
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbInfo].json`),
            path.normalize(`/data/${test_video_id} - [${test_video_id}][Comment].json`),
            path.normalize(`/data/${test_video_id} - [${test_video_id}][ThumbImg].L.jpeg`)
        ]);
        t.deepEqual(nico_update.log, [
            "_setTags",
            "_writeFile",
            "_writeFile",
            "_getThumbImg:url-L",
            "_writeFile",
            "_setThumbnailSize:L",
            "_isDataTypeJson",
            "updated"
        ]);
        t.end();
    });
});