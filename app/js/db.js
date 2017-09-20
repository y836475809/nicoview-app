
const remote = require('electron').remote
const base_dir = remote.getGlobal('sharedObj').base_dir
const fs = require('fs')
const reader = require(`${base_dir}/app/js/reader`)

class DB {
    constructor() {

    }

    /**
     * 
     * @param {string} id 
     */
    findVideoInfo(id) {
        return {
            src: "../mov/test.mp4",
            type: "video/mp4"
        }
    }

    /**
     * 
     * @param {string} id 
     */
    findComments(id) {
        const xml = fs.readFileSync("./sample/sample.xml", "utf-8");
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