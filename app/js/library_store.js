
const DB = require("./db");

class LibraryStore{
    constructor(file_path){
        this.file_path = file_path;
        this.db = new DB();
        this.library_items = [];
    }

    load(){ 
        this.db.load(this.file_path);

        this.library_items = [];
        const video = this.db.video_info;
        video.forEach((value, key) => {
            this.library_items.push({
                image: this.db.getThumbPath(key),
                id: key,
                name: value["video_name"],
                creation_date: value["creation_date"],
                pub_date: value["pub_date"],
                play_count: value["play_count"],
                time: value["time"],
                tags: value["tags"]?value["tags"].join(" "):""
            });
        });
    }

    getItems(){
        return this.library_items;
    }

    getPlayData(video_id){
        const video_file_path = this.db.getVideoPath(video_id);
        const video_type = this.db.getVideoType(video_id);
        const commnets = this.db.findComments(video_id);
        const thumb_info = this.db.findThumbInfo(video_id);
        const thumb_url = this.db.getThumbPath(video_id);
        thumb_info.thumbnail_url = thumb_url;

        return {
            video_data: {
                src: video_file_path,
                type: video_type,
                commnets: commnets
            },
            viweinfo: {
                thumb_info:thumb_info,
                commnets: commnets
            }
        };
    }
}

module.exports = LibraryStore;