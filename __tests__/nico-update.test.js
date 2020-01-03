const test = require("ava");
const nock = require("nock");
const path = require("path");
const { NicoDownLoadMocks, TestData} = require("./helper/nico-mock");
const { getThumbInfo, cnvJsonComments } = require("../app/js/niconico");
const { NicoUpdate } = require("../app/js/nico-update");

const cur_comment = cnvJsonComments(TestData.no_owner_comment);
const nico_mocks = new NicoDownLoadMocks();

class TestNicoUpdate extends NicoUpdate {
    constructor(video_item){
        super(video_item);
        this.paths = [];
        this.data = [];
    }
    _getCurrentComments(){
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

test.beforeEach(async t => {
    nock.disableNetConnect();

    const video_item = {
        data_type:"json", 
        id: TestData.video_id,
        dirpath_id: 1,
        dirpath: "/data/",
        video_name: "サンプル12345678",
        common_filename: TestData.video_id,
        video_type: "mp4",
        is_deleted: false,
        tags:[]
    };
    t.context.nico_update = new TestNicoUpdate(video_item);
});

test("update", async(t) => {
    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.thumbnail();

    const nico_update = t.context.nico_update;
    await nico_update.update();

    const video_item = nico_update.video_item;
    t.falsy(video_item.is_deleted);
    t.is(video_item.data_type, "json");
    t.is(video_item.thumbnail_size, "L");
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

    const nico_update = t.context.nico_update;

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
        
    const nico_update = t.context.nico_update;
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

    const nico_update = t.context.nico_update;
    try {
        await nico_update.update();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);

        const video_item = nico_update.video_item;
        t.truthy(video_item.is_deleted);
        t.deepEqual(nico_update.paths, []);
    }
});