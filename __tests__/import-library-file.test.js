const test = require("ava");
const path = require("path");
const { NicoVideoData } = require("../app/js/nico-data-file");
const { FileUtils } = require("../app/js/file-utils");
const { toTimeSec } = require("../app/js/time-format");

class ImportData {
    constructor(video_filepath){
        this.dir = path.dirname(video_filepath);
        this.filename = path.basename(video_filepath);
        this.common_filename = path.basename(this.filename, path.extname(this.filename));
    }
    async createLibraryItem(){
        const thumbnail_size = await this._getThumbnailSize();
        const data_type = this._getDataType();
        const thumb_info = this._getThumbInfo(data_type);

        const video = thumb_info.video;
        return {
            data_type:data_type,
            thumbnail_size: thumbnail_size,
            id: video.video_id, 
            dirpath: this.dir,
            video_name: video.title,
            video_type: video.video_type,
            common_filename:this.common_filename,
            creation_date: new Date().getTime(),
            last_play_date:-1,
            modification_date: -1,
            play_count:video.viewCount,
            is_economy: false,
            play_time: toTimeSec(video.duration),
            pub_date: video.postedDateTime,
            tags: thumb_info.tags,
            is_deleted: false,       
        };
    }

    async _getThumbnailSize(){
        const filename_L = `${this.common_filename}[ThumbImg].L.jpeg`;
        const filename_S = `${this.common_filename}[ThumbImg].jpeg`;
        
        if(await FileUtils.exist(path.join(this.dir, filename_L) === true)){
            return "L";
        }

        if(await FileUtils.exist(path.join(this.dir, filename_S) === true)){
            return "S";
        }

        throw new Error(`サムネル画像${filename_S}または${filename_L}が存在しない`);
    }

    async _existThumbInfo(data_type){
        const file_path = path.join(this.dir, `${this.common_filename}[ThumbInfo].${data_type}`);
        return await FileUtils.exist(file_path);
    }

    _getThumbInfo(data_type){
        const nico_video_data = new NicoVideoData({
            data_type       : data_type,
            dirPath         : this.dir,
            common_filename : this.common_filename,
        });   
        return nico_video_data.getThumbInfo();
    }

    _matchJoin(){
        const match = /(sm\d+)\.(mp4|flv|swf)/.exec(this.filename);
        return match !== null;
    }

    _matchNNDD(){
        const match = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(this.filename);
        return match !== null;
    }

    async _getDataType(){
        const match_json = this._matchJoin(this.filename);
        const match_NNDD = this._matchNNDD(this.filename);
        if(match_json === false && match_NNDD === false){
            throw new Error(`${this.filename}`);
        }

        if(match_json === true){
            return "json";
        }

        if(match_NNDD === true){
            if(await this._existThumbInfo("json") === true){
                return "json";
            }
            if(await this._existThumbInfo("xml") === true){
                return "xml"; 
            }
        }
    }
}

test("regx param", t => {
    const im_data = new ImportData(path.join(__dirname, "sm10.mp4"));
    t.truthy(im_data._matchJoin());
    t.falsy(im_data._matchNNDD());
});

test("regx param", t => {
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.mp4"));
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.flv"));
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.swf"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].mp4"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].flv"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].swf"));

    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.mp4"));
    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.flv"));
    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.swf"));
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].mp4")); 
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].flv"));
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].swf"));  
    const fname1 = "sm10.mp4"; 
    const fname2 = "サンプル1 - [sm10].mp4";

    const m1 = /(sm\d+)\.(mp4|flv|swf)/.exec(fname1);
    console.log(m1)
    t.is(m1[1], "sm10");
    t.is(path.basename(fname1, path.extname(fname1)), "sm10");
    const m2 = /(sm\d+)\.(mp4|flv|swf)/.exec(fname2);
    t.is(m2, null);

    const m3 = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(fname1);
    t.is(m3, null);
    const m4 = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(fname2);
    console.log(m4)
    t.is(m4[1], "sm10");
    t.is(path.basename(fname2, path.extname(fname2)), "サンプル1 - [sm10]");
    // "sm10.flv";
    // "sm10.swf";
    // "サンプル1 - [sm10].mp4";
    // "サンプル1 - [sm10].flv";
    // "サンプル1 - [sm10].swf";
});

// test("file", t => {
//     const video_item = {
//         data_type:"",
//         dirpath:,
//         common_filename:,
//         video_type:,
//         thumbnail_size:,
//         is_deleted
//     };
//     const nd = new NicoVideoData();
// });