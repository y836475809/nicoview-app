const test = require("ava");
const fsPromises = require("fs").promises;
const { NicoUpdate } = require("../app/js/nico-update");

const test_watch_data = {
    api_data:{
        cookie_jar: {},
        video:{
            video_id: "",
            title: "", 
            description: "", 
            isDeleted: false,
            thumbnailURL:"url-S",
            largeThumbnailURL:"url-L",
            postedDateTime: 0, 
            movieType:"mp4",
            viewCount: 0, 
            mylistCount: 0 
        },
        thread: {
            commentCount: 0
        },
        tags:[],
        owner: {
            id: "", 
            nickname: "",
            iconURL: "",
        }
    }
};

const test_comments = [
    {
        "ping": {
            "content": "rs:0"
        }
    },
    {
        "ping": {
            "content": "ps:0"
        }
    },
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "fork": 1,
            "server_time": 1546694359,
            "last_res": 2,
            "ticket": "1234567890",
            "revision": 1
        }
    },
    {
        "global_num_res": {
            "thread": "1234567890",
            "num_res": 5
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "fork": 1,
            "no": 1,
            "vpos": 100,
            "date": 1360996778,
            "premium": 1,
            "mail": "shita green small",
            "content": "owner comment1"
        }
    },
    {
        "ping": {
            "content": "pf:0"
        }
    },
    {
        "ping": {
            "content": "ps:1"
        }
    },   
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "server_time": 1546694359,
            "last_res": 3336,
            "ticket": "0x83d23581",
            "revision": 2
        }
    },
    {
        "leaf": {
            "thread": "1234567890",
            "count": 303
        }
    },
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "server_time": 1546694359,
            "last_res": 5,
            "ticket": "0x83d23581",
            "revision": 2
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "no": 16,
            "vpos": 300,
            "leaf": 7,
            "date": 1359607148,
            "premium": 1,
            "anonymity": 1,
            "user_id": "abcdefg",
            "mail": "184",
            "content": "comment3"
        }
    },
    {
        "ping": {
            "content": "pf:2"
        }
    },
    {
        "ping": {
            "content": "rf:0"
        }
    }
];

class TestNicoUpdate extends NicoUpdate {
    constructor(){
        const video_item = {
            data_type: "xml", 
            id: "sm100",
            dirpath: "/data/",
            common_filename: "sm100",
            is_deleted: false,
            thumbnail_size: "S"
        };
        super(video_item);
        this.setupTestParams();
        this.log = [];
    }

    setupTestParams({
        watch_data=test_watch_data,
        comments_diff=test_comments,
        img_data=new Uint8Array([0xff, 0xd8, 0xff, 0xd9])}={}){
        this._watch_data = watch_data;
        this._img_data = img_data;
        this._comments_diff = comments_diff;
    }

    _convertComment(nico_xml, nico_json){
        this.log.push("_convertComment");
    }
    _convertThumbInfo(nico_xml, nico_json){
        this.log.push("_convertThumbInfo");
    }
    _isDataTypeJson(){
        this.log.push("_isDataTypeJson");
        return false;
    }
    _setDataType(data_type){
        this.log.push("_setDataType");
    }
    _setTags(tags){
        this.log.push("_setTags");
    }
    _setDeleted(is_deleted){}
    _setThumbnailSize(thumbnail_size){
        this.log.push("_setThumbnailSize");
    }
    async _writeFile(file_path, data, encoding){
        this.log.push("_writeFile");
    }
    async _existPath(path){
        return false;
    }
    async _getWatchData(){
        this.log.push("_getWatchData");
        return this._watch_data;
    }
    async _getComments(api_data, cur_comments){
        this.log.push("_getComments");
        return this._comments_diff;
    }
    async _getThumbImg(url){
        this.log.push("_getThumbImg");
        return this._img_data;
    }
    _getCurrentCommentData(){
        return [];
    }
}

test.beforeEach(t => {
    t.context.nico_update = new TestNicoUpdate();
});

test.before(async t => {
    t.context.image ={
        jpeg:await fsPromises.readFile(`${__dirname}/data/sample1.jpeg`),
        png:await fsPromises.readFile(`${__dirname}/data/sample2.png`)
    };
});

test("validate watch_data", t => {
    const nico_update = new NicoUpdate({data_type:"json"});
    
    t.truthy(nico_update._validateWatchData(test_watch_data));

    t.falsy(nico_update._validateWatchData({}));
    t.falsy(nico_update._validateWatchData(null));
    t.falsy(nico_update._validateWatchData("not find 404"));
});

test("validate comments", t => {
    const nico_update = new NicoUpdate({data_type:"json"});
    
    t.truthy(nico_update._validateComment(test_comments));
    t.truthy(nico_update._validateComment([]));
    t.truthy(nico_update._validateComment([{},{}]));
    
    t.falsy(nico_update._validateComment(["error"]));
    t.falsy(nico_update._validateComment({}));
    t.falsy(nico_update._validateComment(null));
    t.falsy(nico_update._validateComment("not find 404"));
});

test("validate thumbnail", t => {
    const nico_update = new NicoUpdate({data_type:"json"});
    
    const { jpeg, png } = t.context.image;
    t.truthy(nico_update._validateThumbnail(jpeg));
    t.truthy(nico_update._validateThumbnail(png));

    t.falsy(nico_update._validateThumbnail(null));
    t.falsy(nico_update._validateThumbnail("not find 404"));
    t.falsy(nico_update._validateThumbnail([]));
    t.falsy(nico_update._validateThumbnail([0xff]));
});


test("updateThumbInfo correct watch_data", async(t) => {
    const nico_update = t.context.nico_update;

    await nico_update.updateThumbInfo();
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_setTags",
        "_writeFile",
        "_isDataTypeJson",
        "_convertComment",
        "_setDataType"
    ]);
});

test("updateThumbInfo invalid watch_data", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({watch_data:"not find"});

    await t.throwsAsync(nico_update.updateThumbInfo());
    t.deepEqual(nico_update.log, [
        "_getWatchData"
    ]);
});


test("updateComment correct watch_data", async(t) => {
    const nico_update = t.context.nico_update;

    await nico_update.updateComment();
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_getComments",
        "_writeFile",
        "_isDataTypeJson",
        "_convertThumbInfo",
        "_setTags",
        "_setDataType"
    ]);
});

test("updateComment invalid watch_data", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({watch_data:"not find"});

    await t.throwsAsync(nico_update.updateComment());
    t.deepEqual(nico_update.log, [
        "_getWatchData"
    ]);
});

test("updateComment invalid comment diff", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({comments_diff:"not find"});

    await t.throwsAsync(nico_update.updateComment());
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_getComments",
    ]);
});


test("updateThumbnail correct watch_data", async(t) => {
    const nico_update = t.context.nico_update;

    await nico_update.updateThumbnail();
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_isDataTypeJson",
        "_getThumbImg",
        "_writeFile",
        "_setThumbnailSize"
    ]);
});

test("updateThumbnail invalid watch_data", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({watch_data:"not find"});

    await t.throwsAsync(nico_update.updateThumbnail());
    t.deepEqual(nico_update.log, [
        "_getWatchData"
    ]);
});

test("updateThumbnail invalid image", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({img_data:"not find"});

    await t.throwsAsync(nico_update.updateThumbnail());
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_isDataTypeJson",
        "_getThumbImg",
    ]);
});


test("update correct data", async(t) => {
    const nico_update = t.context.nico_update;

    await nico_update.update();
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_setTags",
        "_writeFile",

        "_getComments",
        "_writeFile",

        "_getThumbImg",
        "_writeFile",
        "_setThumbnailSize",
        
        "_isDataTypeJson",
        "_setDataType"
    ]);
});

test("update invalid watch_data", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({watch_data:"not find"});

    await t.throwsAsync(nico_update.update());
    t.deepEqual(nico_update.log, [
        "_getWatchData"
    ]);
});

test("update invalid comment diff", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({comments_diff:"not find"});

    await t.throwsAsync(nico_update.update());
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_setTags",
        "_writeFile",

        "_getComments",
    ]);
});

test("update invalid image", async(t) => {
    const nico_update = t.context.nico_update;
    nico_update.setupTestParams({img_data:"not find"});

    await t.throwsAsync(nico_update.update());
    t.deepEqual(nico_update.log, [
        "_getWatchData",
        "_setTags",
        "_writeFile",

        "_getComments",
        "_writeFile",

        "_getThumbImg",
    ]);
});