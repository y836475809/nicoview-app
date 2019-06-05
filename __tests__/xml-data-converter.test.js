const test = require("ava");
const { Library } = require("../app/js/library");
const { NicoJsonFile } = require("../app/js/nico-data-file");
const { XMLDataConverter } = require("../app/js/xml-data-converter");

let library = null;
let nico_json = null;

const getLibraryItem = (video_id) => {
    return new Promise(async (resolve, reject) => {
        library.video_db.find({video_id: video_id}, {_id: 0}, async (err, docs) => { 
            if(err){
                reject(err);
                return;
            }
            if(docs.length==0){
                resolve([]);
                return;
            }
            resolve(docs[0]);
        });
    });
};

test.beforeEach(async t => {
    library = new Library();
    await library.init(__dirname, true);
    const dirpath_list = [
        { dirpath_id: 0, dirpath: "./data" },
    ];
    const video_list = [
        {
            _db_type: "xml",
            video_id: "sm1",
            dirpath_id: 0,
            is_economy: false,
            last_play_date: -1,
            creation_date: 1,
            modification_date: 10,
            play_count: 100,
            pub_date: 1000,
            time: 10000,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4",
            tags: ["tag1"],
        },
        {
            _db_type:"json",
            dirpath_id: 0,
            video_id: "sm2",
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_economy: true,
            last_play_date: -1,
            creation_date: 2,
            modification_date: 20,
            play_count: 20,
            pub_date: 200,
            time: 2000,
            tags: ["tag2"],
            is_deleted: false
        }
    ];

    await library.setData(dirpath_list, video_list);

    nico_json = new NicoJsonFile();
    nico_json.dirPath = "./data";
    nico_json.commonFilename =  "サンプル1 - [sm1]";
    nico_json.videoType = "mp4";
});

class TestXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){} 
    async _stat(file_path){}
}

class TestStatErrorXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){} 
    async _stat(file_path){ throw new Error(); }
}

class TestWriteErrorXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){ throw new Error(); }
    async _stat(file_path){}
}

test("need func xml", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    t.truthy(await cnv_data._need("xml", nico_json));
});

test("need func json", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    t.falsy(await cnv_data._need("json", nico_json));
});

test("need func xml, not exist src xml file", async (t) => {
    const cnv_data = new TestStatErrorXMLDataConverter();
    t.truthy(await cnv_data._need("xml", nico_json));
});

test("need func json, not exist src xml file", async (t) => {
    const cnv_data = new TestStatErrorXMLDataConverter();
    t.truthy(await cnv_data._need("json", nico_json));
});

test("need func unkown db type", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    await t.throwsAsync(cnv_data._need("dummy", nico_json));
});

test("convert xml", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    t.truthy(await cnv_data.convert(library, "sm1"));
    t.deepEqual(
        await getLibraryItem("sm1"),
        {
            _db_type: "json",
            dirpath_id: 0,
            video_id: "sm1",
            video_name: "サンプル1",
            video_type: "mp4",
            common_filename: "サンプル1 - [sm1]",
            is_economy: false,
            last_play_date: -1,
            creation_date: 1,
            modification_date: 10,
            play_count: 100,
            time: 10000,
            pub_date: 1000,
            tags: ["tag1"],
            is_deleted: false
        }
    );
});

test("convert xml, not exist src xml file", async (t) => {
    const cnv_data = new TestWriteErrorXMLDataConverter();
    await t.throwsAsync(cnv_data.convert(library, "sm1"));

    t.deepEqual(
        await getLibraryItem("sm1"),
        {
            _db_type: "xml",
            video_id: "sm1", 
            dirpath_id: 0,
            is_economy: false,
            last_play_date: -1,
            creation_date: 1,
            modification_date: 10,
            play_count: 100,
            pub_date: 1000,
            time: 10000,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4",
            tags: ["tag1"],
        }
    );
});

test("convert json", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    t.falsy(await cnv_data.convert(library, "sm2"));
    t.deepEqual(
        await getLibraryItem("sm2"),
        {
            _db_type:"json", 
            dirpath_id: 0,
            video_id: "sm2",
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_economy: true,
            last_play_date: -1,
            creation_date: 2,
            modification_date: 20,
            play_count: 20,
            pub_date: 200,
            time: 2000,
            tags: ["tag2"],
            is_deleted: false
        }
    );
});

test("convert json, not exist src xml file", async (t) => {
    const cnv_data = new TestWriteErrorXMLDataConverter();
    t.falsy(await cnv_data.convert(library, "sm2"));
    t.deepEqual(
        await getLibraryItem("sm2"),
        {
            _db_type:"json", 
            dirpath_id: 0,
            video_id: "sm2",
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_economy: true,
            last_play_date: -1,
            creation_date: 2,
            modification_date: 20,
            play_count: 20,
            pub_date: 200,
            time: 2000,
            tags: ["tag2"],
            is_deleted: false
        }
    );
});

test("convert not exist db", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    await t.throwsAsync(cnv_data.convert(library, "sm10000"));
    const items = await library.getLibraryItems();
    t.is(items.length, 2);
    t.deepEqual(
        await getLibraryItem("sm1"),
        {
            _db_type: "xml",
            video_id: "sm1", 
            dirpath_id: 0,
            is_economy: false,
            last_play_date: -1,
            creation_date: 1,
            modification_date: 10,
            play_count: 100,
            pub_date: 1000,
            time: 10000,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4",
            tags: ["tag1"],
        }
    );
    t.deepEqual(
        await getLibraryItem("sm2"),
        {
            _db_type:"json", 
            dirpath_id: 0,
            video_id: "sm2",
            video_name: "サンプル2",
            common_filename: "sm2",
            video_type: "mp4",
            is_economy: true,
            last_play_date: -1,
            creation_date: 2,
            modification_date: 20,
            play_count: 20,
            pub_date: 200,
            time: 2000,
            tags: ["tag2"],
            is_deleted: false
        }
    );
});