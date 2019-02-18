const test = require("ava");
const Library = require("../app/js/library");

test("library file path", async (t) => {
    let library = new Library("video.db", "dir.db", true);
    const dirpath_list = [
        { dirpath_id: 1, dirpath: "file:///C:/data/サンプル" },
        { dirpath_id: 2, dirpath: "file:///C:/data"},
    ];
    const video_list = [
        {
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            video_filename: "サンプル1 - [sm1].mp4",
            video_type: "video/mp4"
        },
        {
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            video_filename: "サンプル2 - [sm2].mp4",
            video_type: "video/mp4"
        }
    ];

    await library.setData(dirpath_list, video_list);
    t.deepEqual(
        await library.getVideoInfo("sm1"),
        {
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            video_filename: "サンプル1 - [sm1].mp4",
            video_type: "video/mp4"
        }
    );
    t.deepEqual(
        await library.getVideoInfo("sm2"),
        {
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            video_filename: "サンプル2 - [sm2].mp4",
            video_type: "video/mp4"
        }
    );

    t.is(await library.getThumbInfoPath("sm1"), "C:/data/サンプル/サンプル1 - [sm1][ThumbInfo].xml");
    t.is(await library.getThumbInfoPath("sm2"), "C:/data/サンプル2 - [sm2][ThumbInfo].xml");

    t.is(await library.getVideoPath("sm2"), "C:/data/サンプル2 - [sm2].mp4");
    t.is(await library.getCommentPath("sm2"), "C:/data/サンプル2 - [sm2].xml");
    t.is(await library.getThumbPath("sm2"), "C:/data/サンプル2 - [sm2][ThumbImg].jpeg");
    t.is(await library.getVideoType("sm2"), "video/mp4");

    // t.throws(await library.getPath(100));
    // t.throws(await library.getVideoInfo("sm000"));
});