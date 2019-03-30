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
        this.video_id = video_info.video_id;
        this.video_name = video_info.video_name;
        this.video_filename = video_info.video_filename;
    }

    get videoFilename(){
        return this.video_filename;
    }

    get commentFilename(){
        return `${this.video_name} - [${this.video_id}].xml`;
    }

    get thumbInfoFilename(){
        return `${this.video_name} - [${this.video_id}][ThumbInfo].xml`;
    }

    get thumbImgFilename(){
        return `${this.video_name} - [${this.video_id}][ThumbImg].jpeg`;
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
        this.video_id = video_id;
    }

    set videoType(video_type){
        this.video_type = video_type;
    }

    get videoFilename(){
        return `${this.video_id}.${this.video_type}`;
    }

    get commentFilename(){
        return `${this.video_id}[Comment].json`;
    }

    get thumbInfoFilename(){
        return `${this.video_id}[ThumbInfo].json`;
    }

    get thumbImgFilename(){
        return `${this.video_id}[ThumbImg].jpeg`;
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
        return JSON.parse(text);
    }
}

module.exports = {
    NicoXMLFile: NicoXMLFile,
    NicoJsonFile: NicoJsonFile
};