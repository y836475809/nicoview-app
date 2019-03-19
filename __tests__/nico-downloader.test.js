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

const isMaxQuality = (api_data, dmc_session) => {
    const quality = api_data.video.dmcInfo.quality;
    const max_quality = { 
        video: quality.videos[0].id,
        audio: quality.audios[0].id
    };

    const src_id_to_mux = 
        dmc_session.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux;
    const session_quality = { 
        video: src_id_to_mux.video_src_ids[0],
        audio: src_id_to_mux.audio_src_ids[0]
    };

    return max_quality.video == session_quality.video
        && max_quality.audio == session_quality.audio;
};

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
});

test("downloader quality check", (t) => {
    t.truthy(isMaxQuality(api_data, dmc_session_max));
    t.falsy(isMaxQuality(api_data, dmc_session_low));
});

class TestNicoDownloader extends NicoNicoDownloader {
    constructor(){
        super();
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
    _writeThumbImg(dist_path, data){
        const text_decoder = new TextDecoder("utf-8");
        const str = text_decoder.decode(Uint8Array.from(data).buffer);
        this.map.set(dist_path, str);
    }
}

test("downloader dmc", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new TestNicoDownloader();
    const result = await nico_down.download(video_id, dist_dir, (state)=>{
        console.log("progress: ",state);
    });
    //TODO
    t.is(result.state, "ok");
    {
        const data = nico_down.map.get(path.join(dist_dir, "test - [sm12345678][ThumbImg].jpeg"));
        t.is(data, "thumbnail");
    }
    {
        const writer = nico_down.map.get(path.join(dist_dir, "test - [sm12345678].mp4"));
        t.is(writer.buf, "video dmc");
    }
    {
        const data = nico_down.map.get(path.join(dist_dir, "test - [sm12345678].json"));
        // const json = JSON.parse(data);
        // console.log(data);
        t.is(data[0].text, "comment1");  
        t.is(data[1].text, "comment2");  
    } 
    {
        const data = nico_down.map.get(path.join(dist_dir, "test - [sm12345678][ThumbInfo].json"));
        // const json = JSON.parse(data);
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
        t.is(data.tags[1].id, "2");  
        t.is(data.tags[1].name, "tag2");  
        t.is(data.tags[2].id, "3");  
        t.is(data.tags[2].name, "tag3");  

        t.is(data.owner.id, "123345677");  
        t.is(data.owner.nickname, "aaaaさん");  
        t.regex(data.owner.iconURL, /https:\/\/secure-dcdn\.cdn\.nimg\.jp\/nicoaccount\/usericon\/.+/);
    }      
});

