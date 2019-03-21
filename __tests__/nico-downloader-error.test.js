const test = require("ava");
const { NicoNicoDownloader } = require("../app/js/niconico-downloader");
const { NicoDownLoadMocks, writeBufStream, TestData } = require("./helper/nico_mock");

const video_id = TestData.video_id;
const dist_dir = __dirname;
const log = [];

const nico_download_mocks = new NicoDownLoadMocks();

test.before(t => {
});

test.after(t => {
    nico_download_mocks.clean();
});

test.beforeEach(t => {
    log.length = 0;
    nico_download_mocks.clean();
});

test.afterEach(t => {
    nico_download_mocks.clean();
});

class TestNicoDownloader extends NicoNicoDownloader {
    constructor(video_id, dist_dir){
        super(video_id, dist_dir);

        this.stream_error = false;
        this.commnet_error = false;
        this.thumbinfo_error = false;
        this.thumbimg_error = false;
    }

    streamError(){
        this.stream_error = true;
    }

    writeCommnetError(){
        this.commnet_error = true;
    }

    writeThumbInfoError(){
        this.thumbinfo_error = true;
    }

    writeThumbImgError(){
        this.thumbimg_error = true;
    }

    _createStream(dist_path){
        return new writeBufStream(this.stream_error);
    }

    _writeJson(file_path, data){
        if(this.commnet_error && /Comment/.test(file_path)){
            throw new Error("write commnet error");
        }
        if(this.thumbinfo_error && /ThumbInfo/.test(file_path)){
            throw new Error("write thumbinfo error");
        }
    }

    _writeBinary(file_path, data){
        if(this.thumbimg_error){
            throw new Error("write thumbimg error");
        }
    }
}

const setupNicoNock = (target_nock, {
    video_kind="dmc", video_quality="max",
    watch_delay=1, watch_code=200, 
    dmc_session_delay=1, dmc_session_code=200, 
    comment_delay=1, comment_code=200, 
    thumbnail_delay=1, thumbnail_code=200, 
    hb_delay=1, hb_code=200, 
    video_delay=1, video_code=200}={}) => {

    if(video_kind=="dmc"){
        target_nock.watch({ delay:watch_delay, code:watch_code });
        target_nock.dmc_session({ delay:dmc_session_delay, code:dmc_session_code });
        target_nock.comment({ delay:comment_delay, code:comment_code });
        target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
        target_nock.dmc_hb({ options_delay:hb_delay, code:hb_code });
        target_nock.dmc_video({ delay:video_delay, code:video_code });  
    }else if(video_kind=="smile"){
        let watch_kind = "";
        let smile_quality= "";
        if(video_quality=="max"){
            watch_kind = "smile max";
            smile_quality = "";
        }else{
            watch_kind = "smile low";
            smile_quality = "low";
        }      
        target_nock.watch({kind:watch_kind, delay:watch_delay, code:watch_code });
        target_nock.comment({ delay:comment_delay, code:comment_code });
        target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
        target_nock.smile_video({quality:smile_quality, delay:video_delay, code:video_code });  
    }
};

test("downloader timeout watch", async (t) => {
    setupNicoNock(nico_download_mocks, {watch_delay:6000});

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
    setupNicoNock(nico_download_mocks, {dmc_session_delay:6000});

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
    setupNicoNock(nico_download_mocks, {comment_delay:6000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout thumbnail", async (t) => {
    setupNicoNock(nico_download_mocks, {thumbnail_delay:6000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout dmc_hb", async (t) => {
    setupNicoNock(nico_download_mocks, {hb_delay:6000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout dmc_video", async (t) => {
    setupNicoNock(nico_download_mocks, {video_delay:6000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader timeout smile_video", async (t) => {
    setupNicoNock(nico_download_mocks, {video_kind:"smile", video_delay:6000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting smile"]); 
    t.is(result.state, "error");
    t.is(result.reason.message, "ESOCKETTIMEDOUT");  
});

test("downloader network error watch 404", async (t) => {
    setupNicoNock(nico_download_mocks, {watch_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, ["start getting watch"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error watch 500", async (t) => {
    setupNicoNock(nico_download_mocks, {watch_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, ["start getting watch"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_session 404", async (t) => {
    setupNicoNock(nico_download_mocks, {dmc_session_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, ["start getting watch"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_session 500", async (t) => {
    setupNicoNock(nico_download_mocks, {dmc_session_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, ["start getting watch"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error comment 404", async (t) => {
    setupNicoNock(nico_download_mocks, {comment_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error comment 500", async (t) => {
    setupNicoNock(nico_download_mocks, {comment_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error thumbnail 404", async (t) => {
    setupNicoNock(nico_download_mocks, {thumbnail_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error thumbnail 500", async (t) => {
    setupNicoNock(nico_download_mocks, {thumbnail_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_hb 404", async (t) => {
    setupNicoNock(nico_download_mocks, {hb_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_hb 500", async (t) => {
    setupNicoNock(nico_download_mocks, {hb_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_video 404", async (t) => {
    setupNicoNock(nico_download_mocks, {video_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_video 500", async (t) => {
    setupNicoNock(nico_download_mocks, {video_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader network error smile_video 404", async (t) => {
    setupNicoNock(nico_download_mocks, {video_kind:"smile", video_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting smile"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /404/);
});

test("downloader network error smile_video 500", async (t) => {
    setupNicoNock(nico_download_mocks, {video_kind:"smile", video_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting smile"]);
    t.is(result.state,  "error");
    t.regex(result.reason.message, /500/);
});

test("downloader save thumbinfo error", async (t) => {
    setupNicoNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeThumbInfoError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo"]); 
    t.is(result.state,  "error");
    t.is(result.reason.message, "write thumbinfo error");
});

test("downloader save comment error", async (t) => {
    setupNicoNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeCommnetError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet"]); 
    t.is(result.state,  "error");
    t.is(result.reason.message, "write commnet error");
});

test("downloader save thumbimg error", async (t) => {
    setupNicoNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeThumbImgError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg"]);
    t.is(result.state,  "error");
    t.is(result.reason.message, "write thumbimg error");
});

test("downloader save dmc error", async (t) => {
    setupNicoNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.streamError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting dmc", "100%"]);
    t.is(result.state,  "error");
    t.is(result.reason.message, "stream error");
});

test("downloader save smile error", async (t) => {
    setupNicoNock(nico_download_mocks, {video_kind:"smile"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.streamError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        "start getting watch", "start getting thumbinfo", "start getting commnet",
        "start getting thumbimg", "start getting smile", "100%"]);
    t.is(result.state,  "error");
    t.is(result.reason.message, "stream error");
});


