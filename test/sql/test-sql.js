
const sql = require('sql.js')
const fs = require('fs')

class SQLiteDB {
    /**
     * 
     * @param {string} db_file_path 
     */
    constructor(db_file_path) {
        this.db_file_path = db_file_path
    }

    get_dirpath(){
        return this.dirpath_dic
    }

    get_video(){
        return this.video_dic
    }
    
    readDB() {
        const sqlite_db = fs.readFileSync(this.db_file_path)
        const uint_8array = new Uint8Array(sqlite_db)
        this.db = new sql.Database(uint_8array)

        read_dirpath()
        read_video()
    }

    read_dirpath() {
        this.dirpath_dic = {}
        let res = this.db.exec("SELECT * FROM file")
        const values = res[0].values
        values.forEach((value) => {
            const id = value[0]
            const dirpath = decodeURI(value[1])
            this.dirpath_dic[id] = dirpath
        })
    }

    read_video() {
        let tag_string_map = new Map()
        let res = this.db.exec("SELECT * FROM tagstring")
        const values = res[0].values
        values.forEach((value) => {
            const id = value[0]
            const tag = value[1]
            tag_string_map.set(id, tag)
        })

        let tag_map = new Map()
        let res = this.db.exec("SELECT * FROM nnddvideo_tag")
        const values = res[0].values
        values.forEach((value) => {
            const video_id = value[1]
            const tag_id = value[2]
            const tag_string = tag_string_map.get(tag_id)
            if (!tag_map.has(video_id)) {
                tag_map.set(video_id, new Array())
            }
            tag_map.get(video_id).push(tag_string)
        })

        this.video_dic = {}
        let res = this.db.exec("SELECT * FROM nnddvideo")
        const values = res[0].values
        values.forEach((value) => {
            const id = value[0]
            const key = value[1]
            const uri = value[2]
            const dirpath_id = value[3]
            const video_name = value[4]
            const is_economy = value[5]
            const modification_date = value[6]
            const creation_date = value[7]
            const thumb_url = value[8]
            const play_cont = value[9]
            const time = value[10]
            const last_play_date = value[11]
            const yet_reading = value[12]
            const pub_date = value[13]

            const tags = tag_map.get(id)
            this.video_dic[key] = {
                "uri": uri,
                "dirpath_id": dirpath_id,
                "video_name": video_name,
                "is_economy": is_economy,
                "modification_date": modification_date,
                "creation_date": creation_date,
                "thumb_url": thumb_url,
                "play_cont": play_cont,
                "time": time,
                "last_play_date": last_play_date,
                "yet_reading": yet_reading,
                "pub_date": pub_date,
                "tags": tags
            }
        })
    }
}

var sqliteDb = fs.readFileSync('./test/sql/sample.db')
var uInt8Array = new Uint8Array(sqliteDb)
var db = new sql.Database(uInt8Array)

let dirpath_dic = {}
{
    let res = db.exec("SELECT * FROM file")
    const values = res[0].values
    values.forEach((value) => {
        const id = value[0]
        const dirpath = decodeURI(value[1])
        console.log(dirpath)
        dirpath_dic[id] = dirpath
    })
}

let tag_string_map = new Map()
{
    let res = db.exec("SELECT * FROM tagstring")
    const values = res[0].values
    values.forEach((value) => {
        const id = value[0]
        const tag = value[1]
        tag_string_map.set(id, tag)
    })
}

let tag_map = new Map()
{
    let res = db.exec("SELECT * FROM nnddvideo_tag")
    const values = res[0].values
    values.forEach((value) => {
        const video_id = value[1]
        const tag_id = value[2]
        const tag_string = tag_string_map.get(tag_id)
        if (!tag_map.has(video_id)) {
            tag_map.set(video_id, new Array())
        }
        tag_map.get(video_id).push(tag_string)
    })
}

let video_dic = {}
{
    let res = db.exec("SELECT * FROM nnddvideo")
    const values = res[0].values
    values.forEach((value) => {
        const id = value[0]
        const key = value[1]
        const uri = value[2]
        const dirpath_id = value[3]
        const video_name = value[4]
        const is_economy = value[5]
        const modification_date = value[6]
        const creation_date = value[7]
        const thumb_url = value[8]
        const play_cont = value[9]
        const time = value[10]
        const last_play_date = value[11]
        const yet_reading = value[12]
        const pub_date = value[13]

        const tags = tag_map.get(id)
        video_dic[key] = {
            "uri": uri,
            "dirpath_id": dirpath_id,
            "video_name": video_name,
            "is_economy": is_economy,
            "modification_date": modification_date,
            "creation_date": creation_date,
            "thumb_url": thumb_url,
            "play_cont": play_cont,
            "time": time,
            "last_play_date": last_play_date,
            "yet_reading": yet_reading,
            "pub_date": pub_date,
            "tags": tags
        }
    })

    fs.writeFileSync(
        "./test/sql/dirpath.json",
        JSON.stringify(dirpath_dic, null, "    "),
        "utf-8")
    fs.writeFileSync(
        "./test/sql/sample.json",
        JSON.stringify(video_dic, null, "    "),
        "utf-8")
}