// const electron = require('electron')
// // アプリケーションを操作するモジュール
// const { app } = electron
// // const remote = require('electron').remote
// // // const remote = require('remote');
// // const app = remote.require('app');
// var basepath = app.getAppPath();
console.log(__dirname)
// var app = require('remote').require('app');
// console.log(app.getAppPath())
//sharedObj = {base_dir: __dirname};

var assert = require("power-assert")
var DB = require("../app/js/db")

const db_file_path = "./test/sql/sample.db"

it("db file path", function () {
    let db = new DB.DB()
    const dirpath_map = new Map()
    .set(1, "file:///C:/data/サンプル")
    .set(2, "file:///C:/data")

    const video_map = new Map()
    .set("sm1",
    {
        dirpath_id: 1,
        video_name: "サンプル1",
        video_filename: "サンプル1 - [sm1].mp4",
        video_type: "video/mp4"
    })
    .set("sm2",
    {
        dirpath_id: 2,
        video_name: "サンプル2",
        video_filename: "サンプル2 - [sm2].mp4",
        video_type: "video/mp4"
    })

    db.setData(dirpath_map, video_map)
    assert.equal(db.getThumbInfoPath("sm1"), "file:///C:/data/サンプル/サンプル1 - [sm1][ThumbInfo].xml")
})