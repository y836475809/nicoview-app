const path = require("path");
const { NicoVideoData, 
    getIDFromFilename, getCommonNameFromFilename } = require("./nico-data-file");
const { FileUtils } = require("./file-utils");
const { toTimeSec } = require("./time-format");

class ImportLibrary {
    constructor(video_filepath){
        this.dir = path.dirname(video_filepath);
        this.filename = path.basename(video_filepath);
        this.id = getIDFromFilename(this.filename);
        this.common_filename = getCommonNameFromFilename(this.filename);
    }
    async createLibraryItem(){        
        const thumbnail_size = await this._getThumbnailSize();
        const data_type = await this._getDataType();
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
            play_count: 0,     // TODO とりあえず再生回数0にする
            is_economy: false, // TODO とりあえず高画質にする
            play_time: toTimeSec(video.duration),
            pub_date: new Date(video.postedDateTime).getTime(),
            tags: thumb_info.tags,
            is_deleted: false,       
        };
    }

    async _getThumbnailSize(){
        const nico_vieo_data = new NicoVideoData({
            id              : this.id,
            data_type       : "json",
            dirpath         : this.dir,
            common_filename : this.common_filename,
            thumbnail_size  : "L"
        });
        const file_path = nico_vieo_data.getThumbImgPath();
        if(await this._existFile(file_path) === true){
            return "L";
        }

        return "S";
    }

    async _existThumbInfo(data_type){
        const nico_vieo_data = new NicoVideoData({
            id              : this.id,
            data_type       : data_type,
            dirpath         : this.dir,
            common_filename : this.common_filename,
        });
        const file_path = nico_vieo_data.getThumbInfoPath();
        return await this._existFile(file_path);
    }

    _getThumbInfo(data_type){
        const nico_video_data = new NicoVideoData({
            id              : this.id,
            data_type       : data_type,
            dirpath         : this.dir,
            common_filename : this.common_filename
        });   
        return nico_video_data.getThumbInfo();
    }

    async _getDataType(){
        if(await this._existThumbInfo("json") === true){
            return "json";
        }
        if(await this._existThumbInfo("xml") === true){
            return "xml"; 
        }
    }
    
    async _existFile(file_path){
        return await FileUtils.exist(file_path);
    }
}

module.exports = {
    ImportLibrary,
};