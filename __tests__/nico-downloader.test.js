const test = require("ava");
const { NicoNicoDownloader } = require("../app/js/niconico-downloader");

const api_data = require("./data/sm12345678_data_api_data.json");
const dmc_session_max = require("./data/sm12345678_dmc_session_max_quality.json");
const dmc_session_low = require("./data/sm12345678_dmc_session_low_quality.json");
const { NicoDownLoadMocks, TestData } = require("./helper/nico_mock");

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

test("downloader dmc", async (t) => {
    nico_download_mocks.watch();
    nico_download_mocks.dmc_session();
    nico_download_mocks.comment();
    nico_download_mocks.thumbnail();
    nico_download_mocks.dmc_hb();
    nico_download_mocks.dmc_video();

    const video_id = TestData.video_id;
    const dist_dir = __dirname;
    const nico_down = new NicoNicoDownloader();
    const result = await nico_down.download(video_id, dist_dir, (state)=>{
        console.log("progress: ",state);
    });
    //TODO
    t.is(result.state, "ok");
});

