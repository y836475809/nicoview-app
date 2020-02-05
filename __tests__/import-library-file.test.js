const test = require("ava");
const path = require("path");
const { NicoVideoData } = require("../app/js/nico-data-file");
const { FileUtils } = require("../app/js/file-utils");
const { toTimeSec } = require("../app/js/time-format");

class imp {
    constructor(video_filepath){
        this.dir = path.dirname(video_filepath);
        this.filename = path.basename(video_filepath);
        this.common_filename = path.basename(this.filename, path.extname(this.filename));
    }

    getThumbInfoPath(data_type){
        return path.join(this.dir, `${this.common_filename}[ThumbInfo].${data_type}`);
    }

    getThumbnailPath(is_large){
        let thumbnail_size = "";
        if(is_large===true){
            thumbnail_size = ".L";
        }
        return path.join(this.dir, `${this.common_filename}[ThumbImg]${thumbnail_size}.jpeg`);
    }

    getVideoItem(thumb_info){
        const video = thumb_info.video;
        return {
            data_type:null,
            thumbnail_size: null,

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

    async _existThumbnail(is_large){
        let thumbnail_size = "";
        if(is_large===true){
            thumbnail_size = ".L";
        }
        const file_path = path.join(this.dir, `${this.common_filename}[ThumbImg]${thumbnail_size}.jpeg`);
        return await FileUtils.exist(file_path);
    }

    async _existThumbInfo(data_type){
        const file_path = path.join(this.dir, `${this.common_filename}[ThumbInfo].${data_type}`);
        return await FileUtils.exist(file_path);
    }

    async getDataType(){
        const match1 = /(sm\d+)\.(mp4|flv|swf)/.exec(this.filename);
        const match2 = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(this.filename);
        if(match1 === null && match2 === null){
            throw new Error(`${this.filename}`);
        }

        if(match1 !== null){
            return "json";
        }

        if(match2 !== null){
            if(await FileUtils.exist(this.getThumbInfoPath("json")) === true){
                return "json";
            }
            if(await FileUtils.exist(this.getThumbInfoPath("xml")) === true){
                return "xml"; 
            }
        }
    }

    async getInfo(){
        let thumbnail_size = "S";
        if(await FileUtils.exist(this.getThumbnailPath(true)) === true){
            thumbnail_size = "L";
        }

        const data_type = this.getDataType();
        const nico_video_data = new NicoVideoData({
            data_type       : data_type,
            dirPath         : this.dir,
            common_filename : this.common_filename,
            // video_type      : video_type,
            // thumbnail_size  : thumbnail_size,
            // is_deleted      : false
        });   
        const thumb_info = nico_video_data.getThumbInfo();
        const video_item = this.getVideoItem(thumb_info);
        video_item.data_type = data_type;
        video_item.thumbnail_size = thumbnail_size;
        return video_item;
    }
}

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