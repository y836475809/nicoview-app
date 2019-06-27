const test = require("ava");
const path = require("path");
const { TestData} = require("./helper/nico-mock");
const { getThumbInfo, filterComments } = require("../app/js/niconico");
const { NicoUpdate } = require("../app/js/nico-update");

const cur_comment = filterComments(TestData.no_owner_comment);

class TestNicoUpdate extends NicoUpdate {
    // constructor(video_id, is_deleted, thumb_size, dbtype, is_deleted_in_db){
    constructor(video_id){
        super(video_id, {});
        this._is_deleted = false;
        this._thumb_size = "S";
        this._dbtype = "xml";
        this._is_deleted_in_db = false;
        this._exist_file = false;

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
        return this._exist_file;
    }

    async _getWatchData(){
        const watch_data = {
            api_data:{
                video:{
                    video_id: this.video_id,
                    title: "", 
                    description: "", 
                    isDeleted: this._is_deleted,
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

test.beforeEach(async t => {

});

test("updateThumbInfo, xml, not deleted", async(t) => {
    const nico_update = new TestNicoUpdate(TestData.video_id);

    t.truthy(await nico_update.updateThumbInfo());
    t.falsy(nico_update._is_deleted);
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
