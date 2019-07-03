const test = require("ava");
const path = require("path");
const { NicoUpdate } = require("../app/js/nico-update");

const test_video_id = "sm100";

class TestNicoUpdate extends NicoUpdate {
    constructor(video_id){
        super(video_id, {});
        this.setupTestParams();

        this.library._getVideoInfo = (video_id) => {
            return {
                common_filename: video_id,
                thumbnail_size: this._thumb_size,
                is_deleted: this._is_deleted_in_db,
            };
        };
        this.library._getDir = (dirpath_id) => {
            return "/data/";
        };

        this._img_data = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
        this.paths = [];
        this.data = [];
        this.log = [];
    }

    setupTestParams({
        is_deleted_in_nico=false,
        thumb_size="S",
        large_thumb_url="url-L",
        dbtype="xml",
        is_deleted_in_db=false,
        file_exist=false,
        comments_diff=[{}]}={}){
        this._is_deleted_in_nico = is_deleted_in_nico;
        this._thumb_size = thumb_size;
        this._large_thumb_url = large_thumb_url;
        this._dbtype = dbtype;
        this._is_deleted_in_db = is_deleted_in_db;
        this._file_exist = file_exist;
        this._comments_diff = comments_diff;
    }

    _convertComment(nico_xml, nico_json){
        this.log.push("_convertComment");
    }

    _convertThumbInfo(nico_xml, nico_json){
        this.log.push("_convertThumbInfo");
    }

    async _isDBTypeJson(){
        this.log.push("_isDBTypeJson");
        return this._dbtype=="json";
    }
    async _setDBtype(db_type){
        this.log.push("_setDBtype");
        this._dbtype = db_type;
    }
    async _isDeleted(){
        return this._is_deleted_in_db;
    }
    async _setTags(tags){
        this.log.push("_setTags");
    }
    async _setDeleted(is_deleted){
        this._is_deleted_in_db = is_deleted;
    }

    async _setThumbnailSize(thumbnail_size){
        this.log.push(`_setThumbnailSize:${thumbnail_size}`);
        this._thumb_size = thumbnail_size;
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

    async _getCurrentComments(dir_path, video_info){
        return [];
    }

    async _getComments(api_data, cur_comments){
        return this._comments_diff;
    }

    async _getThumbImg(url){
        this.log.push(`_getThumbImg:${url}`);
        return this._img_data;
    }
}

test.beforeEach(t => {
    t.context.nico_update = new TestNicoUpdate(test_video_id);
});

test("updateThumbInfo, db=xml, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;

    t.truthy(await nico_update.updateThumbInfo());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbInfo].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_isDBTypeJson",
        "_convertComment",
        "_setDBtype"
    ]);
});

test("updateThumbInfo, db=xml, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_nico:true});

    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=xml, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_db:true});
    
    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=json, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json"});

    t.truthy(await nico_update.updateThumbInfo());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbInfo].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_isDBTypeJson",
        "_convertComment"
    ]);
});

test("updateThumbInfo, db=json, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", is_deleted_in_nico:true});

    await t.throwsAsync(nico_update.updateThumbInfo());
});

test("updateThumbInfo, db=json, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", is_deleted_in_db:true});
    
    await t.throwsAsync(nico_update.updateThumbInfo());
});


test("updateComment, db=xml, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;

    t.truthy(await nico_update.updateComment());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype"
    ]);
});

test("updateComment, db=xml, comments_diff is empty, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({comments_diff:[]});

    t.falsy(await nico_update.updateComment());
    t.deepEqual(nico_update.log, []);
});

test("updateComment, db=xml, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_nico:true});

    t.truthy(await nico_update.updateComment());
    t.truthy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype"
    ]);
});


test("updateComment, db=xml, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_db:true});

    t.truthy(await nico_update.updateComment());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDBtype"
    ]);
});

test("updateComment, db=json, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json"});

    t.truthy(await nico_update.updateComment());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo"
    ]);
});

test("updateComment, db=json, comments_diff is empty, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", comments_diff:[]});

    t.falsy(await nico_update.updateComment());
    t.deepEqual(nico_update.log, []);
});

test("updateComment, db=json, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", is_deleted_in_nico:true});

    t.truthy(await nico_update.updateComment());
    t.truthy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo"
    ]);
});

test("updateComment, db=json, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", is_deleted_in_db:true});

    t.truthy(await nico_update.updateComment());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[Comment].json`)
    ]);
    t.deepEqual(nico_update.log, [
        "_writeFile",
        "_isDBTypeJson",
        "_convertThumbInfo"
    ]);
});


test("updateThumbnail, db=xml, thumb_size=S, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;

    t.truthy(await nico_update.updateThumbnail());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "S");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbImg].jpeg`)
    ]);
    t.deepEqual(nico_update.log, [
        "_isDBTypeJson",
        "_getThumbImg:url-S",   
        "_writeFile",
        "_setThumbnailSize:S"
    ]);
});

test("updateThumbnail, db=json, thumb_size=S, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json"});

    t.truthy(await nico_update.updateThumbnail());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbImg].L.jpeg`)
    ]);
    t.deepEqual(nico_update.log, [
        "_isDBTypeJson",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L"
    ]);
});

test("updateThumbnail, db=json, thumb_size=L, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", thumb_size:"L"});

    t.truthy(await nico_update.updateThumbnail());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbImg].L.jpeg`)
    ]);
    t.deepEqual(nico_update.log, [
        "_isDBTypeJson",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L"
    ]);
});

test("updateThumbnail, db=json, thumb_size=L, large_thumb_url=null, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json", thumb_size:"L", large_thumb_url:null});

    t.falsy(await nico_update.updateThumbnail());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "L");
    t.deepEqual(nico_update.paths, []);
    t.deepEqual(nico_update.log, [
        "_isDBTypeJson"
    ]);
});

test("updateThumbnail, deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_nico:true});

    await t.throwsAsync(nico_update.updateThumbnail());
});

test("updateThumbnail, not deleted in nico, deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({is_deleted_in_db:true});

    await t.throwsAsync(nico_update.updateThumbnail());
});


test("update, db=xml, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;

    t.truthy(await nico_update.update());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbInfo].json`),
        path.normalize(`/data/${test_video_id}[Comment].json`),
        path.normalize(`/data/${test_video_id}[ThumbImg].L.jpeg`)
    ]);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_writeFile",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
        "_isDBTypeJson",
        "_setDBtype"
    ]);
});

test("update, db=json, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({dbtype:"json"});

    t.truthy(await nico_update.update());
    t.falsy(nico_update._is_deleted_in_db);
    t.is(nico_update._thumb_size, "L");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${test_video_id}[ThumbInfo].json`),
        path.normalize(`/data/${test_video_id}[Comment].json`),
        path.normalize(`/data/${test_video_id}[ThumbImg].L.jpeg`)
    ]);
    t.deepEqual(nico_update.log, [
        "_setTags",
        "_writeFile",
        "_writeFile",
        "_getThumbImg:url-L",
        "_writeFile",
        "_setThumbnailSize:L",
        "_isDBTypeJson"
    ]);
});