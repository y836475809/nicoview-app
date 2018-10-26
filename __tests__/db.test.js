const DB = require("../app/js/db");

test("db file path", function () {
    let db = new DB.DB();
    const dirpath_map = new Map()
        .set(1, "file:///C:/data/サンプル")
        .set(2, "file:///C:/data");

    const video_map = new Map()
        .set("sm1",{
            dirpath_id: 1,
            video_name: "サンプル1",
            video_filename: "サンプル1 - [sm1].mp4",
            video_type: "video/mp4"
        })
        .set("sm2",{
            dirpath_id: 2,
            video_name: "サンプル2",
            video_filename: "サンプル2 - [sm2].mp4",
            video_type: "video/mp4"
        });

    db.setData(dirpath_map, video_map);
    expect(db.getThumbInfoPath("sm1")).toEqual("C:/data/サンプル/サンプル1 - [sm1][ThumbInfo].xml");
    expect(db.getThumbInfoPath("sm2")).toEqual("C:/data/サンプル2 - [sm2][ThumbInfo].xml");
});