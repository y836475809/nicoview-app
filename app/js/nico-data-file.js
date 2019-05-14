const path = require("path");
const fs = require("fs");
const reader = require("./reader");

class NicoDataFile {
    set dirPath(dir_path){
        this.dir_path = dir_path;
    }

    get videoPath(){
        return path.join(this.dir_path, this.videoFilename);
    }

    get commentPath(){
        return path.join(this.dir_path, this.commentFilename);
    }

    get thumbInfoPath(){
        return path.join(this.dir_path, this.thumbInfoFilename);
    }

    get thumbImgPath(){
        return path.join(this.dir_path, this.thumbImgFilename);
    }
}

class NicoXMLFile extends NicoDataFile {
    set videoInfo(video_info){
        this.common_filename = video_info.common_filename;
        this.video_type = video_info.video_type;
    }

    get videoFilename(){
        return `${this.common_filename}.${this.video_type}`;
    }

    get commentFilename(){
        return `${this.common_filename}.xml`;
    }

    get ownerCommentPath(){
        return path.join(this.dir_path, `${this.common_filename}[Owner].xml`);
    }

    get thumbInfoFilename(){
        return `${this.common_filename}[ThumbInfo].xml`;
    }

    get thumbImgFilename(){
        return `${this.common_filename}[ThumbImg].jpeg`;
    }

    /**
     * 
     * @returns {Array} comments 
     */
    getComments() {
        const file_path = this.commentPath;
        const xml = fs.readFileSync(file_path, "utf-8");
        let comments = reader.comment(xml);
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
        return comments;
    }

    getThumbInfo() {
        const file_path = this.thumbInfoPath;
        const xml = fs.readFileSync(file_path, "utf-8");
        return reader.thumb_info(xml);
    }
}

class NicoJsonFile extends NicoDataFile {   
    set videoID(video_id){
        this.common_filename = video_id;
    }

    set videoType(video_type){
        this.video_type = video_type;
    }

    get videoFilename(){
        return `${this.common_filename}.${this.video_type}`;
    }

    get commentFilename(){
        return `${this.common_filename}[Comment].json`;
    }

    get thumbInfoFilename(){
        return `${this.common_filename}[ThumbInfo].json`;
    }

    get thumbImgFilename(){
        return `${this.common_filename}[ThumbImg].jpeg`;
    }

    getComments() {
        const file_path = this.commentPath;
        const text = fs.readFileSync(file_path, "utf-8");
        const comments = JSON.parse(text);
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
        return comments;
    }

    getThumbInfo() {
        const file_path = this.thumbInfoPath;
        const text = fs.readFileSync(file_path, "utf-8");
        const json_data = JSON.parse(text);

        const video = json_data.video;
        const owner = json_data.owner;
        const thread = json_data.thread;
        const tags = json_data.tags.map((value) => {
            return {
                text: value.name,
                lock: value.isLocked
            };
        });
        return {
            video_id: video.id,
            title: video.title,
            description: video.description,
            thumbnail_url: video.largeThumbnailURL,
            first_retrieve: video.postedDateTime,
            length: video.duration,
            view_counter: video.viewCount,
            mylist_counter: video.mylistCount,
            comment_counter: thread.commentCount,
            tags: tags,
            user_nickname: owner.nickname,
            user_icon_url: owner.iconURL
        };
    }
}

module.exports = {
    NicoXMLFile: NicoXMLFile,
    NicoJsonFile: NicoJsonFile
};