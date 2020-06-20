const test = require("ava");
const { DonwloadProgMsg, NicoDownloader } = require("../app/js/nico-downloader");
const { NicoDownLoadMocks, writeBufStream, setupNicoDownloadNock, TestData } = require("./helper/nico-mock");

const video_id = TestData.video_id;
const dist_dir = __dirname;
const log = [];

const nico_download_mocks = new NicoDownLoadMocks();
const mock_timeout = 121*1000;

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

class TestNicoDownloader extends NicoDownloader {
    constructor(video_id, dist_dir){
        super(video_id, dist_dir);

        this.stream_error = false;
        this.comment_error = false;
        this.thumbinfo_error = false;
        this.thumbimg_error = false;
    }

    async _renameTmp(oldname, newname){
    }

    streamError(){
        this.stream_error = true;
    }

    writeCommentError(){
        this.comment_error = true;
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
        if(this.comment_error && /Comment/.test(file_path)){
            throw new Error("write comment error");
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

test("downloader timeout watch", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {watch_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout dmc_session", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {dmc_session_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch]); 
    t.is(result.type, TestNicoDownloader.ResultType.error); 
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout comment", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {comment_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout thumbnail", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {thumbnail_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout dmc_hb", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {hb_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout dmc_video", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, DonwloadProgMsg.stop_hb
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader timeout smile_video", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_delay:mock_timeout});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /timeout\s*:\s*https/i);
});

test("downloader network error watch 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {watch_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error watch 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {watch_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_session 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {dmc_session_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.is(result.type, NicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_session 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {dmc_session_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error comment 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {comment_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error comment 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {comment_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error thumbnail 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {thumbnail_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error thumbnail 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {thumbnail_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_hb 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {hb_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_hb 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {hb_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error dmc_video 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, DonwloadProgMsg.stop_hb
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error dmc_video 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, DonwloadProgMsg.stop_hb
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader network error smile_video 404", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_code:404});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /404/);
});

test("downloader network error smile_video 500", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_code:500});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.regex(result.reason.message, /500/);
});

test("downloader save thumbinfo error", async (t) => {
    setupNicoDownloadNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeThumbInfoError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.stop_hb, 
        DonwloadProgMsg.write_data
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.is(result.reason.message, "write thumbinfo error");
});

test("downloader save comment error", async (t) => {
    setupNicoDownloadNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeCommentError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.stop_hb, 
        DonwloadProgMsg.write_data
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.is(result.reason.message, "write comment error");
});

test("downloader save thumbimg error", async (t) => {
    setupNicoDownloadNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.writeThumbImgError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    }); 
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.stop_hb, 
        DonwloadProgMsg.write_data
    ]); 
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.is(result.reason.message, "write thumbimg error");
});

test("downloader save dmc error", async (t) => {
    setupNicoDownloadNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.streamError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, "0.0MB 100%", 
        DonwloadProgMsg.stop_hb
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.is(result.reason.message, "stream error");
});

test("downloader save smile error", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    nico_down.streamError();

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile, "0.0MB 100%"
    ]);
    t.is(result.type, TestNicoDownloader.ResultType.error);
    t.is(result.reason.message, "stream error");
});


