const test = require("ava");
const path = require("path");
const Library = require("../app/js/library");

test("library get path, info", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data/サンプル" },
        { _data_type:"dir", dirpath_id: 2, dirpath: "file:///C:/data"},
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            common_filename: "サンプル2 - [sm2]",
            video_type: "mp4"
        },
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm3",
            dirpath_id: 2,
            video_name: "サンプル3",
            common_filename: "sm3",
            video_type: "mp4"
        }
    ];

    await library.setData(dirpath_list, video_list);
    t.deepEqual(
        await library._getVideoInfo("sm1"),
        {
            _db_type: "xml",
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        }
    );
    t.deepEqual(
        await library._getVideoInfo("sm2"),
        {
            _db_type: "xml",
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            common_filename: "サンプル2 - [sm2]",
            video_type: "mp4"
        }
    );
    t.deepEqual(
        await library._getVideoInfo("sm3"),
        {
            _db_type: "json",
            video_id: "sm3",
            dirpath_id: 2,
            video_name: "サンプル3",
            common_filename: "sm3",
            video_type: "mp4"
        }
    );

    t.is(await library._getDir(1), "C:/data/サンプル");
    t.is(await library._getDir(2), "C:/data");

    const dir = "C:/data";
    {
        const video_info = video_list[0];
        const datafile = library._getDataFileInst(dir, video_info);
        t.is(datafile.thumbInfoPath, path.resolve("C:/data/サンプル1 - [sm1][ThumbInfo].xml"));
        t.is(datafile.videoPath, path.resolve("C:/data/サンプル1 - [sm1].mp4"));
        t.is(datafile.commentPath, path.resolve("C:/data/サンプル1 - [sm1].xml"));
        t.is(datafile.thumbImgPath, path.resolve("C:/data/サンプル1 - [sm1][ThumbImg].jpeg"));
        t.is(library._getVideoType(video_info), "mp4");
    }
    {
        const video_info = video_list[2];
        const datafile = library._getDataFileInst(dir, video_info);
        t.is(datafile.thumbInfoPath, path.resolve("C:/data/sm3[ThumbInfo].json"));
        t.is(datafile.videoPath, path.resolve("C:/data/sm3.mp4"));
        t.is(datafile.commentPath, path.resolve("C:/data/sm3[Comment].json"));
        t.is(datafile.thumbImgPath, path.resolve("C:/data/sm3[ThumbImg].jpeg"));
        t.is(library._getVideoType(video_info), "mp4");
    }

    await t.throwsAsync(library._getDir(100));
    await t.throwsAsync(library._getVideoInfo("sm000"));
});

test("library get data", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        {  _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data/サンプル" },
        {  _data_type:"dir", dirpath_id: 2, dirpath: "file:///C:/data"},
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4",
            creation_date: 1,
            pub_date: 2,
            play_count: 3,
            time: 4,
            tags: ["tag1 tag2"]
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            common_filename: "サンプル2 - [sm2]",
            video_type: "mp4",
            creation_date: 10,
            pub_date: 20,
            play_count: 30,
            time: 40,
            tags: ["tag10 tag20"]
        },
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm3",
            dirpath_id: 2,
            video_name: "サンプル3",
            common_filename: "sm3",
            video_type: "mp4",
            creation_date: 100,
            pub_date: 200,
            play_count: 300,
            time: 400,
            tags: ["tag100 tag200"]
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
                thumb_img: path.resolve("C:/data/サンプル/サンプル1 - [sm1][ThumbImg].jpeg"),
                id: "sm1",
                name: "サンプル1",
                creation_date: 1,
                pub_date: 2,
                play_count: 3,
                play_time: 4,
                tags: "tag1 tag2" 
            },
            {
                thumb_img: path.resolve("C:/data/サンプル2 - [sm2][ThumbImg].jpeg"),
                id: "sm2",
                name: "サンプル2",
                creation_date: 10,
                pub_date: 20,
                play_count: 30,
                play_time: 40,
                tags: "tag10 tag20" 
            },
            {
                thumb_img: path.resolve("C:/data/sm3[ThumbImg].jpeg"),
                id: "sm3",
                name: "サンプル3",
                creation_date: 100,
                pub_date: 200,
                play_count: 300,
                play_time: 400,
                tags: "tag100 tag200" 
            }
        ]
    );
});

test("library add item", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data" },
    ];
    await library.setData(dirpath_list, []);

    const item1 ={
        _data_type:"video", 
        _db_type:"json", 
        dirpath: "C:/data",
        video_id: "sm1",      
        video_name: "サンプル1",
        common_filename: "sm1",
        video_type: "mp4",
        max_quality: true,
        time: 0,
        pub_date: 0,
        tags: []
    };
    await library.addItem(item1);
    await library.addItem(item1);
    {
        const data = await library.getLibraryData();
        t.is(1, data.length);
    }

    const item2 ={
        _data_type:"video", 
        _db_type:"json", 
        dirpath: "C:/data",
        video_id: "sm1",      
        video_name: "サンプル1 update",
        common_filename: "sm1",
        video_type: "mp4",
        max_quality: true,
        time: 0,
        pub_date: 0,
        tags: ["tag1"]
    };
    await library.addItem(item2);
    {
        const data = await library.getLibraryData();
        t.is(1, data.length);
    }
    {
        const data = await library._getVideoInfo("sm1");
        t.is(data.video_id, "sm1");
        t.is(data.dirpath_id, 1);
        t.is(data.video_name, "サンプル1 update");
        t.is(data.common_filename, "sm1");
        t.is(data.video_type, "mp4");
        t.is(data.dirpath_id, 1);
        t.is(data.is_economy, false);
        t.is(data.time, 0);
        t.is(data.pub_date, 0);
        t.deepEqual(data.tags, ["tag1"]);
    }
});

test("library update item", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data/サンプル" },
        { _data_type:"dir", dirpath_id: 2, dirpath: "file:///C:/data"},
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "サンプル2",
            common_filename: "サンプル2 - [sm2]",
            video_type: "mp4"
        }
    ];

    await library.setData(dirpath_list, video_list);
    library.updateItem({
        _data_type:"video", 
        _db_type:"json", 
        video_id: "sm2",
        dirpath_id: 2,
        video_name: "update サンプル2",
        common_filename: "update サンプル2 - [sm2]",
        video_type: "mp4"
    });

    t.deepEqual(
        await library._getVideoInfo("sm1"),
        {
            _db_type: "xml",
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        }
    );
    t.deepEqual(
        await library._getVideoInfo("sm2"),
        {
            _db_type: "json",
            video_id: "sm2",
            dirpath_id: 2,
            video_name: "update サンプル2",
            common_filename: "update サンプル2 - [sm2]",
            video_type: "mp4"
        }
    );
});

test("library update item error", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data" },
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        }
    ];

    await library.setData(dirpath_list, video_list);

    const uitem = {
        _data_type:"video", 
        _db_type:"json", 
        video_id: "sm100",
        dirpath_id: 2,
        video_name: "update サンプル1",
        common_filename: "update サンプル1 - [sm1]",
        video_type: "mp4"
    };
    await library.updateItem(uitem);

    const library_data = await library.getLibraryData();
    t.is(library_data.length, 1);
    const data = library_data[0];
    t.is(data.id, "sm1");
    t.is(data.name, "サンプル1");
});

test("library getFieldValue", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data" },
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            is_deleted: false
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm2",
            dirpath_id: 1,
            is_deleted: true
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm3",
            dirpath_id: 1,
        }
    ];

    await library.setData(dirpath_list, video_list);

    const field_name = "is_deleted";
    t.falsy(await library.getFieldValue("sm1", field_name));
    t.truthy(await library.getFieldValue("sm2", field_name));
    t.is(await library.getFieldValue("sm3", field_name), undefined);
    t.is(await library.getFieldValue("sm4", field_name), undefined);
});

test("library setFieldValue", async (t) => {
    const library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: "file:///C:/data" },
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            is_deleted: false
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm2",
            dirpath_id: 1,
            is_deleted: true
        },
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm3",
            dirpath_id: 1,
        }
    ];

    await library.setData(dirpath_list, video_list);

    const field_name = "is_deleted";
    await library.setFieldValue("sm1", field_name, true);
    await library.setFieldValue("sm3", field_name, true);

    t.is(await library.getFieldValue("sm1", field_name), true);
    t.is(await library.getFieldValue("sm2", field_name), true);
    t.is(await library.getFieldValue("sm3", field_name), true);
});

