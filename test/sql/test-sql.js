
const sql = require('sql.js')
const fs = require('fs')


var sqliteDb = fs.readFileSync('./test/sql/sample.db')
var uInt8Array = new Uint8Array(sqliteDb)
// let db = sql.DB.open("./sample.db")
var db = new sql.Database(uInt8Array)

{
    let res = db.exec("SELECT * FROM file")
    // console.log(res[0].columns)
    // console.log(res[0].values[0])

    const values = res[0].values
    values.forEach((value) => {
        const id = value[0]
        const path = decodeURI(value[1])
        console.log(path)
    })
    // decodeURI()
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

{
    let tag_map = new Map()
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
    console.log(tag_map)
}

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
        const last_play_data = value[11]
        const yet_reading = value[12]
        const pub_date = value[13]

        const tags = tag_map.get(id)
        
    })
}