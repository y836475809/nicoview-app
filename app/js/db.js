
const fs = require("fs");
const reader = require("./reader");
const serializer = require("./serializer");

class DB {
    constructor() {

    }

    /**
     * 
     * @param {Map} dir_path 
     * @param {Map} video_info 
     */
    setData(dir_path, video_info) {
        this.dir_path = dir_path;
        this.video_info = video_info;
        this.normalizePath();
    }

    load(file_path){
        const datas = serializer.load(file_path);
        if (!datas.has("dirpath")) {
            throw Error("not find id=dirpath");
        }
        if (!datas.has("video")) {
            throw Error("not find id=video");
        }
        this.dir_path = new Map(datas.get("dirpath"));
        this.video_info = new Map(datas.get("video"));
        this.normalizePath();
    }

    normalizePath(){
        this.dir_path.forEach((value, key) => {
            const path = value.replace(/^(file:\/\/\/)|^(file:\/\/)/i, "");
            this.dir_path.set(key, path);
        });
    }

    /**
     * 
     * @param {string} id 
     */
    // findVideoInfo(id) {
    //     if(this.video_info.has(id)){
    //         throw Error("not find video_info")
    //     }

    //     const video_info = this.video_info.get(id)

    //     if(this.dir_path.has(video_info.id)){
    //         throw Error("not find dir_path")
    //     }

    //     const dir_path = this.dir_path.get(video_info.id)
    //     const src = path.join(dir_path,  `${video_info.video_name} - [${id}].${video_info.video_type}`)
    //     const type = `video/${video_info.video_type}`

    //     return {
    //         src: src,
    //         type: type
    //     }
    //}

    /**
     * 
     * @param {string} id 
     */
    findComments(id) {
        // if (this.video_info.has(id)) {
        //     throw Error("not find video_info")
        // }

        // const video_info = this.video_info.get(id)

        // if (this.dir_path.has(video_info.id)) {
        //     throw Error("not find dir_path")
        // }

        // const dir_path = this.dir_path.get(video_info.id)
        // const file_path = path.join(dir_path, `${video_info.video_name} - [${id}].xml`)
        
        const file_path = this.getCommentPath(id);
        const xml = fs.readFileSync(file_path, "utf-8");
        let comments = reader.comment(xml);
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
        return comments;
    }

    /**
     * 
     * @param {string} id 
     */
    findThumbInfo(id) {
        const xml = fs.readFileSync("./sample/sample[ThumbInfo].xml", "utf-8");
        return reader.thumb_info(xml);
    }

    // findLibrary(){
    //     let ret = []
    //     this.video_info.forEach((value, key) => {
    //         let copyObj = {}
    //         Object.assign(copyObj , value)
    //         copyObj.id = key
    //         const video_fname = this.getVideoFileName(key, value.video_name)
    //         copyObj.video_fname = video_fname
    //         copyObj.video_url = this.getPath(key, video_fname)
    //         copyObj.thumb_url = this.getPath(key, this.getThumbFileName(key, value.video_name))
    //         ret.push(copyObj)
    //     })
    //     return ret
    // }


    // getPath(id, filename){
    //     const dir_path = this.dir_path.get(id)
    //     return path.join(dir_path,  filename)       
    // }
    getVideoType(id){
        if (!this.video_info.has(id)) {
            throw Error(`not find video_info, id=${id}`);
        }
        const video_info = this.getVideoInfo(id);
        return video_info.video_type;
    }

    getVideoTags(id){
        if (!this.video_info.has(id)) {
            throw Error(`not find video_info, id=${id}`);
        }
        const video_info = this.getVideoInfo(id);
        return video_info.tags;
    }

    /**
     * 
     * @param {string} dirpath_id 
     * @param {string} filename 
     */
    getPath(dirpath_id, filename) {
        if (!this.dir_path.has(dirpath_id)) {
            throw Error(`not find dir_path, dirpath_id=${dirpath_id}`);
        }
        const dir_path = this.dir_path.get(dirpath_id);
        return `${dir_path}/${filename}`;
    }

    getVideoInfo(id) {
        if (!this.video_info.has(id)) {
            throw Error(`not find video_info, id=${id}`);
        }
        return this.video_info.get(id);
    }

    /**
     * 
     * @param {string} id 
     */
    getVideoPath(id) {
        const video_info = this.getVideoInfo(id);
        return this.getPath(
            video_info.dirpath_id, 
            video_info.video_filename);
    }
    /**
     * 
     * @param {string} id 
     */
    getCommentPath(id) {
        const video_info = this.getVideoInfo(id);
        return this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}].xml`);
    }

    getThumbInfoPath(id) {
        const video_info = this.getVideoInfo(id);
        return this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}][ThumbInfo].xml`);
    }

    /**
     * 
     * @param {string} id 
     */
    getThumbPath(id) {
        const video_info = this.getVideoInfo(id);
        return this.getPath(
            video_info.dirpath_id, 
            `${video_info.video_name} - [${id}][ThumbImg].jpeg`);
    }



    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     * @param {string} video_type 
     */
    getVideoFileName(id, video_name, video_type) {
        return `${video_name} - [${id}].${video_type}`;
    }
    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     */
    getCommentFileName(id, video_name) {
        return `${video_name} - [${id}].xml`;
    }

    getThumbInfoFileName(id, video_name) {
        return `${video_name} - [${id}][ThumbInfo].xml`;
    }

    /**
     * 
     * @param {string} id 
     * @param {string} video_name 
     */
    getThumbFileName(id, video_name) {
        return `${video_name} - [${id}][ThumbImg].jpeg`;
    }
}

module.exports.DB = DB;