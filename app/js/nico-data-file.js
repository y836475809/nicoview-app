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
    set commonFilename(name){
        this.common_filename = name;
    }

    set videoType(video_type){
        this.video_type = video_type;
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
        const owner_xml = fs.readFileSync(this.ownerCommentPath, "utf-8");
        const owner_comments = reader.comment(owner_xml).map(comment=>{
            return Object.assign(comment, {user_id: "owner"});
        });

        const user_xml = fs.readFileSync(this.commentPath, "utf-8");
        const user_comments = reader.comment(user_xml);

        const comments = owner_comments.concat(user_comments);
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
        const thumb_info = reader.thumb_info(xml);
        const tags = thumb_info.tags.map((value, index) => {
            return {
                id: index+1,
                name: value.text,
                isLocked: value.lock,
            };
        });
        return {
            video: {
                video_id: thumb_info.video_id,
                title: thumb_info.title, 
                description: thumb_info.description, 
                thumbnailURL: thumb_info.thumbnail_url, 
                largeThumbnailURL: thumb_info.thumbnail_url, 
                postedDateTime: thumb_info.first_retrieve, 
                duration: thumb_info.length, 
                viewCount: thumb_info.view_counter, 
                mylistCount: thumb_info.mylist_counter, 
                video_type: thumb_info.video_type
            },
            thread: {
                commentCount: thumb_info.comment_counter
            },
            tags: tags,
            owner: {
                id: thumb_info.user_id, 
                nickname: thumb_info.user_nickname,
                iconURL: thumb_info.user_icon_url,
            }
        };
    }
}

class NicoJsonFile extends NicoDataFile {   
    set commonFilename(name){
        this.common_filename = name;
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
        const thumb_info = JSON.parse(text);
        return thumb_info;
    }
}

module.exports = {
    NicoXMLFile: NicoXMLFile,
    NicoJsonFile: NicoJsonFile
};