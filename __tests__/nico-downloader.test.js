const test = require("ava");
const path = require("path");
const { DonwloadProgMsg, NicoNicoDownloader } = require("../app/js/niconico-downloader");
const { NicoDownLoadMocks, writeBufStream, setupNicoDownloadNock, TestData } = require("./helper/nico_mock");

const data_api_data = TestData.data_api_data;
const dmc_session_max = TestData.dmc_session;
const dmc_session_low = TestData.dmc_session_low;
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
    constructor(video_id, dist_dir, only_max_quality=true){
        super(video_id, dist_dir, only_max_quality);
        this.map = new Map();
        this.rename_map = new Map();
    }

    async _renameTmp(oldname, newname){
        this.rename_map.set(oldname, newname);
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

test("downloader quality check", (t) => {
    const nico_down = new NicoNicoDownloader();
    t.truthy(nico_down._isDMCMaxQuality(data_api_data, dmc_session_max));
    t.falsy(nico_down._isDMCMaxQuality(data_api_data, dmc_session_low));
});

test("downloader dmc", async (t) => {
    setupNicoDownloadNock(nico_download_mocks);

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc , "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.stop_hb,
        DonwloadProgMsg.write_data, DonwloadProgMsg.rename_video_file
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.complete, reason: "" });

    const item = nico_down.getDownloadedItem();
    t.deepEqual(item, { 
        _data_type:"video", 
        _db_type:"json", 
        dirpath: dist_dir,
        video_id: "sm12345678", 
        video_name: "test",
        video_type: "mp4",
        max_quality: true,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"],
        is_deleted: false
    });

    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbImg].jpeg"));
        t.is(data, "thumbnail");
    }
    {
        const video_path = path.join(dist_dir, "_video.tmp");
        const writer = nico_down.map.get(video_path);
        t.is(writer.buf, "video dmc");
        t.is(nico_down.rename_map.get(video_path), path.join(dist_dir, "sm12345678.mp4"));
    }
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[Comment].json"));
        t.is(data[0].text, "comment1");  
        t.is(data[1].text, "comment2");  
    } 
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbInfo].json"));
        t.deepEqual(data, {
            video:{
                video_id: "sm12345678",
                title: "test",
                description: "test description",
                thumbnailURL: "https://tn.smilevideo.jp/smile?i=12345678",
                largeThumbnailURL: "https://tn.smilevideo.jp/smile?i=12345678.L",
                postedDateTime: "2018/01/01 01:00:00",
                duration: 100,
                viewCount: 200,
                mylistCount: 300,
                video_type: "mp4",
            },
            thread:{
                commentCount: 1000
            },
            tags:[
                {id: "1", name: "tag1", isLocked: true},
                {id: "2", name: "tag2", isLocked: true},
                {id: "3", name: "tag3", isLocked: false}
            ],
            owner: {
                id: "123345677",
                nickname: "aaaaさん",
                iconURL: "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/100.123345677.jpg?1313765172"
            }
        });
    }      
});

test("downloader smile", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile , "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.write_data, 
        DonwloadProgMsg.rename_video_file
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.complete, reason: "" });

    const item = nico_down.getDownloadedItem();
    t.deepEqual(item, { 
        _data_type:"video", 
        _db_type:"json",
        dirpath: dist_dir, 
        video_id: "sm12345678", 
        video_name: "test",
        video_type: "mp4",
        max_quality: true,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"],
        is_deleted: false
    });

    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbImg].jpeg"));
        t.is(data, "thumbnail");
    }
    {
        const video_path = path.join(dist_dir, "_video.tmp");
        const writer = nico_down.map.get(video_path);
        t.is(writer.buf, "video smile");
        t.is(nico_down.rename_map.get(video_path), path.join(dist_dir, "sm12345678.mp4"));
    }
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[Comment].json"));
        t.is(data[0].text, "comment1");  
        t.is(data[1].text, "comment2");  
    } 
    {
        const data = nico_down.map.get(path.join(dist_dir, "sm12345678[ThumbInfo].json"));
        t.deepEqual(data, {
            video:{
                video_id: "sm12345678",
                title: "test",
                description: "test description",
                thumbnailURL: "https://tn.smilevideo.jp/smile?i=12345678",
                largeThumbnailURL: "https://tn.smilevideo.jp/smile?i=12345678.L",
                postedDateTime: "2018/01/01 01:00:00",
                duration: 100,
                viewCount: 200,
                mylistCount: 300,
                video_type: "mp4",
            },
            thread:{
                commentCount: 1000
            },
            tags:[
                {id: "1", name: "tag1", isLocked: true},
                {id: "2", name: "tag2", isLocked: true},
                {id: "3", name: "tag3", isLocked: false}
            ],
            owner: {
                id: "123345677",
                nickname: "aaaaさん",
                iconURL: "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/100.123345677.jpg?1313765172"
            }
        });
    } 
});

test("downloader dmc low quality", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_quality:"low"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir, false);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.stop_hb,
        DonwloadProgMsg.write_data, DonwloadProgMsg.rename_video_file
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.complete, reason: "" });

    const item = nico_down.getDownloadedItem();
    t.deepEqual(item, { 
        _data_type:"video", 
        _db_type:"json", 
        dirpath: dist_dir,
        video_id: "sm12345678",       
        video_name: "test",
        video_type: "mp4",
        max_quality: false,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"],
        is_deleted: false
    });     
});

test("downloader smile low quality", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_quality:"low"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir, false);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile, "0.0MB 100%", 
        DonwloadProgMsg.complete, DonwloadProgMsg.write_data, 
        DonwloadProgMsg.rename_video_file
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.complete, reason: "" });

    const item = nico_down.getDownloadedItem();
    t.deepEqual(item, { 
        _data_type:"video", 
        _db_type:"json", 
        dirpath: dist_dir,
        video_id: "sm12345678",    
        video_name: "test",
        video_type: "mp4",
        max_quality: false,
        time: 100,
        pub_date: new Date("2018/01/01 01:00:00").getTime(),
        tags:["tag1", "tag2", "tag3"],
        is_deleted: false
    }); 
});

test("downloader cancel dmc low quality", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_quality:"low"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.skip, reason: "最高画質でないため" });
});

test("downloader cancel smile low quality", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_quality:"low"});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);
    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.skip, reason: "最高画質でないため" });
});

test("downloader cancel watch", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {watch_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel dmc_session", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {dmc_session_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [DonwloadProgMsg.start_watch]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel comment", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {comment_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel thumbnail", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {thumbnail_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel dmc_hb options", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {hb_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc
    ]);
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel dmc_video", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_dmc, DonwloadProgMsg.stop_hb
    ]); 
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});

test("downloader cancel smile_video", async (t) => {
    setupNicoDownloadNock(nico_download_mocks, {video_kind:"smile", video_delay:2000});

    const nico_down = new TestNicoDownloader(video_id, dist_dir);

    setTimeout(()=>{
        nico_down.cancel();
    }, 1000);

    const result = await nico_down.download((state)=>{
        log.push(state);
    });  
    t.deepEqual(log, [
        DonwloadProgMsg.start_watch, DonwloadProgMsg.start_thumbinfo, 
        DonwloadProgMsg.start_comment, DonwloadProgMsg.start_thumbimg, 
        DonwloadProgMsg.start_smile
    ]); 
    t.deepEqual(result, { type: TestNicoDownloader.ResultType.cancel, reason: "cancel" });
});
