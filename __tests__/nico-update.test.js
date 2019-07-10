const test = require("ava");
const nock = require("nock");
const path = require("path");
const { NicoDownLoadMocks, TestData} = require("./helper/nico-mock");
const { getThumbInfo, filterComments } = require("../app/js/niconico");
const { NicoUpdate } = require("../app/js/nico-update");
const { Library } = require("../app/js/library");

/** @type {Library} */
let library = null;
const cur_comment = filterComments(TestData.no_owner_comment);
const nico_mocks = new NicoDownLoadMocks();

test.beforeEach(async t => {
    nock.disableNetConnect();
    
    library = new Library();
    await library.init(__dirname, true);
    const dirpath_list = [
        { dirpath_id: 1, dirpath: "/data/" }
    ];
    const video_list = [
        {
            _db_type:"json", 
            video_id: TestData.video_id,
            dirpath_id: 1,
            video_name: "サンプル12345678",
            common_filename: TestData.video_id,
            video_type: "mp4",
            is_deleted: false,
            tags:[]
        }
    ];
    await library.setData(dirpath_list, video_list);
});

class TestNicoUpdate extends NicoUpdate {
    constructor(video_id, library){
        super(video_id, library);
        this.paths = [];
        this.data = [];
    }
    async _getCurrentComments(dir_path, video_info){
        return cur_comment;
    }
    async _writeFile(file_path, data){
        this.paths.push(file_path);
        this.data.push(data);
    }

    _validateThumbnail(bytes){
        return true;
    }
}

const byteToString = (byte) => {
    return String.fromCharCode.apply("", new Uint16Array(byte));
};

test("update", async(t) => {
    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.thumbnail();

    const nico_update = new TestNicoUpdate(TestData.video_id, library);

    t.truthy(await nico_update.update());
    t.falsy(await library.getFieldValue(TestData.video_id, "is_deleted"));
    t.is(await library.getFieldValue(TestData.video_id, "_db_type"), "json");
    t.is(await library.getFieldValue(TestData.video_id, "thumbnail_size"), "L");
    t.deepEqual(nico_update.data[0], getThumbInfo(TestData.data_api_data));
    t.is(nico_update.data[1].length,2);
    t.is(byteToString(nico_update.data[2]), "thumbnail");
    t.deepEqual(nico_update.paths, [
        path.normalize(`/data/${TestData.video_id}[ThumbInfo].json`),
        path.normalize(`/data/${TestData.video_id}[Comment].json`),
        path.normalize(`/data/${TestData.video_id}[ThumbImg].L.jpeg`)
    ]);
});

test("update cancel", async(t) => {
    t.plan(2);

    nico_mocks.watch({delay:3000});
    nico_mocks.comment();
    nico_mocks.thumbnail();

    const nico_update = new TestNicoUpdate(TestData.video_id, library);

    setTimeout(()=>{
        nico_update.cancel();
    }, 1000);
    try {
        await nico_update.update();
    } catch (error) {
        t.truthy(error.cancel);
        t.deepEqual(nico_update.paths, []);
    }
});

test("update timetout", async (t) => {
    t.plan(4);

    nico_mocks.watch({delay:6000});
    nico_mocks.comment();
    nico_mocks.thumbnail();
        
    const nico_update = new TestNicoUpdate(TestData.video_id, library);
    try {
        await nico_update.update();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /time/i);
        t.deepEqual(nico_update.paths, []);
    }
});

test("update 404", async t => {
    t.plan(5);

    nico_mocks.watch({code:404});
    nico_mocks.comment();
    nico_mocks.thumbnail();

    const nico_update = new TestNicoUpdate(TestData.video_id, library);
    try {
        await nico_update.update();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);

        t.truthy(await library.getFieldValue(TestData.video_id, "is_deleted"));
        t.deepEqual(nico_update.paths, []);
    }
});