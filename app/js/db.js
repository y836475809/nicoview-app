
const remote = require('electron').remote
const base_dir = remote.getGlobal('sharedObj').base_dir
const fs = require('fs')
const path = require('path')
const reader = require(`${base_dir}/app/js/reader`)

class DB {
    constructor() {

    }

    /**
     * 
     * @param {Map} dir_path 
     * @param {Map} video_info 
     */
    setData(dir_path, video_info) {
        this.dir_path = dir_path
        this.video_info = video_info
    }

    /**
     * 
     * @param {string} id 
     */
    findVideoInfo(id) {
        if(this.video_info.has(id)){
            throw Error("not find video_info")
        }

        const video_info = this.video_info.get(id)

        if(this.dir_path.has(video_info.id)){
            throw Error("not find dir_path")
        }

        const dir_path = this.dir_path.get(video_info.id)
        const src = path.join(dir_path,  `${video_info.video_name} - [${id}].${video_info.video_type}`)
        const type = `video/${video_info.video_type}`
        
        return {
            src: src,
            type: type
        }
    }

    /**
     * 
     * @param {string} id 
     */
    findComments(id) {
        if(this.video_info.has(id)){
            throw Error("not find video_info")
        }

        const video_info = this.video_info.get(id)

        if(this.dir_path.has(video_info.id)){
            throw Error("not find dir_path")
        }

        const dir_path = this.dir_path.get(video_info.id)
        const file_path = path.join(dir_path,  `${video_info.video_name} - [${id}].xml`)

        const xml = fs.readFileSync(file_path, "utf-8");
        let comments = reader.comment(xml)
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        })
        return comments
    }

    /**
     * 
     * @param {string} id 
     */
    findThumbInfo(id) {
        const xml = fs.readFileSync("./sample/sample[ThumbInfo].xml", "utf-8");
        return reader.thumb_info(xml)
    }
}

module.exports.DB = DB