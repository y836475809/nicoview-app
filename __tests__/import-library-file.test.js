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
            pub_date: new Date(video.postedDateTime).getTime(),
            tags: thumb_info.tags,
            is_deleted: false,       
        };
    }

    async _getThumbnailSize(){
        const filename_L = `${this.common_filename}[ThumbImg].L.jpeg`;
        // const filename_S = `${this.common_filename}[ThumbImg].jpeg`;
        
        if(await FileUtils.exist(path.join(this.dir, filename_L) === true)){
            return "L";
        }

        // if(await FileUtils.exist(path.join(this.dir, filename_S) === true)){
        //     return "S";
        // }

        // throw new Error(`サムネル画像${filename_S}または${filename_L}が存在しない`);
        return "S";
    }

    async _existThumbInfo(data_type){
        const file_path = path.join(this.dir, `${this.common_filename}[ThumbInfo].${data_type}`);
        return await FileUtils.exist(file_path);
    }

    _getThumbInfo(data_type){
        const nico_video_data = new NicoVideoData({
            data_type       : data_type,
            dirpath         : this.dir,
            common_filename : this.common_filename
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

test("match", t => {
    {
        const im_data = new ImportData(path.join(__dirname, "sm100.mp4"));
        t.truthy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "sm100.flv"));
        t.truthy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "sm100.swf"));
        t.truthy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "sm100.jpeg"));
        t.falsy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }

    {
        const im_data = new ImportData(path.join(__dirname, "サンプル1 - [sm100].mp4"));
        t.falsy(im_data._matchJoin());
        t.truthy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "サンプル1 - [sm100].flv"));
        t.falsy(im_data._matchJoin());
        t.truthy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "サンプル1 - [sm100].swf"));
        t.falsy(im_data._matchJoin());
        t.truthy(im_data._matchNNDD());
    }
    {
        const im_data = new ImportData(path.join(__dirname, "サンプル1 - [sm100].jpeg"));
        t.falsy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }

    {
        const im_data = new ImportData(path.join(__dirname, "サンプル1.mp4"));
        t.falsy(im_data._matchJoin());
        t.falsy(im_data._matchNNDD());
    }
});

test("_getThumbInfo ", t => {

    const dir = path.join(__dirname, "data", "import");
    {
        const im_data = new ImportData(path.join(dir, "sm100.mp4"));
        const thumb_info = im_data._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_data = new ImportData(path.join(dir, "import - [sm100].mp4"));
        const thumb_info = im_data._getThumbInfo("xml");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_data = new ImportData(path.join(dir, "import - [sm100].mp4"));
        const thumb_info = im_data._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }

    {
        const im_data = new ImportData(path.join(dir, "sm1000.mp4"));
        t.throws(() => { im_data._getThumbInfo("json"); });
    }

    {
        const im_data = new ImportData(path.join(dir, "sm1000.mp4"));
        t.throws(() => { im_data._getThumbInfo("xml"); });
    }
});
