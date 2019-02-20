const test = require("ava");
const Library = require("../app/js/library");

test("library get path, info", async (t) => {
    let library = new Library("test.db", true);
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
        await library._getVideoInfo("sm1"),
        {
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            video_filename: "サンプル1 - [sm1].mp4",
            video_type: "video/mp4"
        }
    );
    t.deepEqual(
        await library._getVideoInfo("sm2"),
        {
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            video_filename: "サンプル2 - [sm2].mp4",
            video_type: "video/mp4"
        }
    );

    t.is(await library._getDir(1), "C:/data/サンプル");
    t.is(await library._getDir(2), "C:/data");

    const dir = "C:/data";
    const video_info1 = video_list[0];
    t.is(library._getThumbInfoPath(dir, video_info1), "C:/data/サンプル1 - [sm1][ThumbInfo].xml");
    t.is(library._getVideoPath(dir, video_info1), "C:/data/サンプル1 - [sm1].mp4");
    t.is(library._getCommentPath(dir, video_info1), "C:/data/サンプル1 - [sm1].xml");
    t.is(library._getThumbPath(dir, video_info1), "C:/data/サンプル1 - [sm1][ThumbImg].jpeg");
    t.is(library._getVideoType(video_info1), "video/mp4");

    await t.throwsAsync(library._getDir(100));
    await t.throwsAsync(library._getVideoInfo("sm000"));
});

test("library get data", async (t) => {
    let library = new Library("test.db", true);
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
            video_type: "video/mp4",
            creation_date: 1,
            pub_date: 2,
            play_count: 3,
            time: 4,
            tags: ["tag1 tag2"]
        },
        {
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            video_filename: "サンプル2 - [sm2].mp4",
            video_type: "video/mp4",
            creation_date: 10,
            pub_date: 20,
            play_count: 30,
            time: 40,
            tags: ["tag10 tag20"]
        }
    ];

    await library.setData(dirpath_list, video_list);
    const library_data = await library.getLibraryData();
    library_data.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
    });

    t.deepEqual(
        library_data,[
            {
                thumb_img: "C:/data/サンプル/サンプル1 - [sm1][ThumbImg].jpeg",
                id: "sm1",
                name: "サンプル1",
                creation_date: 1,
                pub_date: 2,
                play_count: 3,
                play_time: 4,
                tags: "tag1 tag2" 
            },
            {
                thumb_img: "C:/data/サンプル2 - [sm2][ThumbImg].jpeg",
                id: "sm2",
                name: "サンプル2",
                creation_date: 10,
                pub_date: 20,
                play_count: 30,
                play_time: 40,
                tags: "tag10 tag20" 
            }
        ]
    );
});