const test = require("ava");
const path = require("path");
const stream = require("stream");
const { NicoNicoDownloader } = require("../app/js/niconico-downloader");

const api_data = require("./data/sm12345678_data_api_data.json");
const dmc_session_max = require("./data/sm12345678_dmc_session_max_quality.json");
const dmc_session_low = require("./data/sm12345678_dmc_session_low_quality.json");
const { NicoDownLoadMocks, TestData } = require("./helper/nico_mock");

class writeBufStream extends stream.Writable {
    constructor() {
        super();
        this.buf = "";
    }

    _write(chunk, enc, next) {
        this.buf += chunk.toString();
        next();
    }

    end() {
        this.writable = false;
        this.emit.apply(this, ["close"]);
    }
}

const nico_download_mocks = new NicoDownLoadMocks();

test.before(t => {
    // prof_time.clear();
});

test.after(t => {
    // prof_time.log(t);

    nico_download_mocks.clean();
});

test.beforeEach(t => {
    // prof_time.start(t);

    nico_download_mocks.clean();
    // state_log = "";
});

test.afterEach(t => {
    // prof_time.end(t);
    nico_download_mocks.clean();
});

test("downloader quality check", (t) => {
    const nico_down = new NicoNicoDownloader();
    t.truthy(nico_down._isDMCMaxQuality(api_data, dmc_session_max));
    t.falsy(nico_down._isDMCMaxQuality(api_data, dmc_session_low));
});

class TestNicoDownloader extends NicoNicoDownloader {
    constructor(video_id, dist_dir){
        super(video_id, dist_dir);
        this.map = new Map();
    }

    _createStream(dist_path){
        const writer = new writeBufStream();
        this.map.set(dist_path, writer);
        return writer;
    }
    _writeJson(file_path, data){
        this.map.set(file_path, data);
    }
    _writeBinary(file_path, data){
        const text_decoder = new TextDecoder("utf-8");
        const str = text_decoder.decode(Uint8Array.from(data).buffer);
        this.map.set(file_path, str);
    }
}

test("downloader dmc", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc" , "finish"]);
    t.deepEqual(result, { state: "ok", reason: "" });

    const dd = nico_down.getdd();
    t.deepEqual(dd, { 
        video_id: "sm12345678", 
        video_name: "test",
        video_filename: "sm12345678.mp4",
        video_type: "mp4",
        max_quality: true,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"]
    });

    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678.jpeg"));
        t.is(data, "thumbnail");
    }
    {
        const writer = nico_down.map.get(path.join(dist_dir, "sm12345678.mp4"));
        t.is(writer.buf, "video dmc");
    }
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[Comment].json"));
        t.is(data[0].text, "comment1");  
        t.is(data[1].text, "comment2");  
    } 
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbInfo].json"));
        t.is(data.video.id, "sm12345678"); 
        t.is(data.video.title, "test"); 
        t.not(data.video.description, undefined); 
        t.is(data.video.thumbnailURL, "https://tn.smilevideo.jp/smile?i=12345678"); 
        t.is(data.video.largeThumbnailURL, "https://tn.smilevideo.jp/smile?i=12345678.L"); 
        t.is(data.video.postedDateTime, "2018/01/01 01:00:00"); 
        t.is(data.video.duration, 100); 
        t.is(data.video.viewCount, 200); 
        t.is(data.video.mylistCount, 300); 
        t.is(data.video.movieType, "mp4"); 
        
        t.is(data.tags[0].id, "1");  
        t.is(data.tags[0].name, "tag1");  
        t.is(data.tags[0].isLocked, true);  
        t.is(data.tags[1].id, "2");  
        t.is(data.tags[1].name, "tag2");  
        t.is(data.tags[1].isLocked, true);  
        t.is(data.tags[2].id, "3");  
        t.is(data.tags[2].name, "tag3");  
        t.is(data.tags[2].isLocked, false);  

        t.is(data.owner.id, "123345677");  
        t.is(data.owner.nickname, "aaaaさん");  
        t.regex(data.owner.iconURL, /https:\/\/secure-dcdn\.cdn\.nimg\.jp\/nicoaccount\/usericon\/.+/);
    }      
});

//TODO
test("downloader smile", async (t) => {
    nico_download_mocks.watch({ kind:"smile max" });
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.smile_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting smile" , "finish"]);
    t.deepEqual(result, { state: "ok", reason: "" });

    const dd = nico_down.getdd();
    t.deepEqual(dd, { 
        video_id: "sm12345678", 
        video_name: "test",
        video_filename: "sm12345678.mp4",
        video_type: "mp4",
        max_quality: true,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"]
    });

    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678.jpeg"));
        t.is(data, "thumbnail");
    }
    {
        const writer = nico_down.map.get(path.join(dist_dir, "sm12345678.mp4"));
        t.is(writer.buf, "video smile");
    }
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[Comment].json"));
        t.is(data[0].text, "comment1");  
        t.is(data[1].text, "comment2");  
    } 
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbInfo].json"));
        t.is(data.video.id, "sm12345678"); 
        t.is(data.video.title, "test"); 
        t.not(data.video.description, undefined); 
        t.is(data.video.thumbnailURL, "https://tn.smilevideo.jp/smile?i=12345678"); 
        t.is(data.video.largeThumbnailURL, "https://tn.smilevideo.jp/smile?i=12345678.L"); 
        t.is(data.video.postedDateTime, "2018/01/01 01:00:00"); 
        t.is(data.video.duration, 100); 
        t.is(data.video.viewCount, 200); 
        t.is(data.video.mylistCount, 300); 
        t.is(data.video.movieType, "mp4"); 
        
        t.is(data.tags[0].id, "1");  
        t.is(data.tags[0].name, "tag1");  
        t.is(data.tags[0].isLocked, true);  
        t.is(data.tags[1].id, "2");  
        t.is(data.tags[1].name, "tag2");  
        t.is(data.tags[1].isLocked, true);  
        t.is(data.tags[2].id, "3");  
        t.is(data.tags[2].name, "tag3");  
        t.is(data.tags[2].isLocked, false);  

        t.is(data.owner.id, "123345677");  
        t.is(data.owner.nickname, "aaaaさん");  
        t.regex(data.owner.iconURL, /https:\/\/secure-dcdn\.cdn\.nimg\.jp\/nicoaccount\/usericon\/.+/);
    }  
});

// test("downloader dmc low quality", async (t) => {
// });

// test("downloader smile low quality", async (t) => {
// });

test("downloader cancel dmc low quality", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session({quality:"low"});
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, ["start getting watch"]);
    t.deepEqual(result, { state: "cancel", reason: "low quality" });
});

test("downloader cancel smile low quality", async (t) => {
    nico_download_mocks.watch({ kind:"smile low" });
    // nico_download_mocks.dmc_session("low");
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    // nico_download_mocks.dmc_hb();
    // nico_download_mocks.dmc_video();
    nico_download_mocks.smile_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, ["start getting watch"]);
    t.deepEqual(result, { state: "cancel", reason: "low quality" });
});

test("downloader cancel watch", async (t) => {
    nico_download_mocks.watch({ delay: 2000 });
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, ["start getting watch"]);
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel dmc_session", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session({delay:2000});
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, ["start getting watch"]);
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel comment", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment({ delay: 2000 });
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet"]);
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel thumbnail", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail({ delay: 2000 });
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg"]);
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel dmc_hb options", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb({ options_delay: 2000 });
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]);
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel dmc_video", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video({ delay: 2000 });

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader cancel smile_video", async (t) => {
    nico_download_mocks.watch({ kind:"smile max" });
    // nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    // nico_download_mocks.dmc_hb();
    nico_download_mocks.smile_video({ delay: 2000 });

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting smile"]); 
    t.deepEqual(result, { state: "cancel", reason: "cancel" });
});

test("downloader timeout watch", async (t) => {
    nico_download_mocks.watch({ delay:6000 });
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout dmc_session", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session({delay: 6000});
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout comment", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment({ delay: 6000 });
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout thumbnail", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail({ delay: 6000 });
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout dmc_hb", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb({ options_delay: 6000 });
    nico_download_mocks.dmc_video();

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout dmc_video", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video({ delay: 6000 });

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout smile_video", async (t) => {
    nico_download_mocks.watch({kine:"smile max"});
    // nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    // nico_download_mocks.dmc_hb();
    nico_download_mocks.smile_video({ delay: 6000 });

    const log = [];
    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbtnfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

// test("downloader network error", async (t) => {
// });

// test("downloader file save error", async (t) => {
// });
