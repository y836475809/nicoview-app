const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");
// const { LibraryDB } = require("./db");


const pc = (obj) => {
    const props = Object.keys(obj);
    const lib = [
        "id", "data_type", 
        "thumb_img", "video_name", "video_type",
        "creation_date", "pub_date", "last_play_date", 
        "play_count", "play_time", "tags", "thumbnail_size"];
    
    for (const prop in lib) {
        if (!props.includes(prop)) {
            return false;
        }
    }
    return true;
};

class VideoInfo {
    constructor(video_item){
        this.nico_data = this._getData(video_item);
    }

    _getData(video_item){
        let nico_data = null;

        const data_type = video_item.data_type;
        if(data_type=="xml"){
            nico_data = new NicoXMLFile();
        } else if(data_type=="json"){
            nico_data = new NicoJsonFile();
        }else{
            throw new Error(`${data_type} is unkown`);
        }

        nico_data.dirPath = video_item.dirpath;
        nico_data.commonFilename = video_item.common_filename;
        nico_data.videoType = video_item.video_type;
        nico_data.thumbnailSize = video_item.thumbnail_size;
        nico_data.is_deleted = video_item.is_deleted;
        return nico_data;
    }

    getVideoPath() {
        return this.nico_data.videoPath;
    }

    getVideoType(){
        return this.nico_data.videoType;
    }

    getThumbImgPath(){
        return this.nico_data.thumbImgPath;
    }

    getComments() {
        return this.nico_data.getComments();
    }

    getThumbInfo() {
        const thumb_info = this.nico_data.getThumbInfo();
        const thumb_img_path = this.getThumbImgPath();
        thumb_info.video.thumbnailURL = thumb_img_path;
        thumb_info.video.largeThumbnailURL = thumb_img_path;
        return thumb_info;
    }

    getIsDeleted() {
        return this.nico_data.is_deleted;
    }
}

module.exports = {
    VideoInfo,
};