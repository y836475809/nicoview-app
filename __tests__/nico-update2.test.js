const test = require("ava");
const path = require("path");
const { TestData} = require("./helper/nico-mock");
const { getThumbInfo, filterComments } = require("../app/js/niconico");
const { NicoUpdate } = require("../app/js/nico-update");

const cur_comment = filterComments(TestData.no_owner_comment);

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

        this._img_data = "image";
        this.paths = [];
        this.data = [];
        this.log = [];
    }

    setupTestParams({
        is_deleted_in_nico=false,
        thumb_size="S",
        dbtype="xml",
        is_deleted_in_db=false,
        file_exist=false}={}){
        this._is_deleted_in_nico = is_deleted_in_nico;
        this._thumb_size = thumb_size;
        this._dbtype = dbtype;
        this._is_deleted_in_db = is_deleted_in_db;
        this._file_exist = file_exist;
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
                    thumbnailURL:"",
                    largeThumbnailURL:"",
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
        return [];
    }

    async _getThumbImg(url){
        return this._img_data;
    }
}

test.beforeEach(t => {
    t.context.nico_update = new TestNicoUpdate(TestData.video_id);
});

test("updateThumbInfo, db=xml, not deleted in nico, not deleted in db", async(t) => {
    const nico_update = t.context.nico_update;

    t.truthy(await nico_update.updateThumbInfo());
    t.falsy(nico_update._is_deleted_in_db);
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${TestData.video_id}[ThumbInfo].json`)
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
        path.normalize(`/data/${TestData.video_id}[ThumbInfo].json`)
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