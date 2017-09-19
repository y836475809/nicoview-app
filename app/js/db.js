const fs = require('fs')
const reader = require("./reader")

class DB {
    /**
     * 
     * @param {string} id 
     */
    findVideoInfo(id) {
        return {
            src: "../mov/test.mp4",
            type: "video/mp4",
            commnets: commnets
        }
    }    

    /**
     * 
     * @param {string} id 
     */
    findComments(id) {
        const xml = fs.readFileSync("../sample/sample.xml", "utf-8");
        return reader.comment(xml)
    }

    /**
     * 
     * @param {string} id 
     */
    findThumbInfo(id) {
        const xml = fs.readFileSync("../sample/sample[ThumbInfo].xml", "utf-8");
        return reader.thumb_info(xml)
    }
}

module.exports.DB = DB