const test = require("ava");
const api_data = require("./data/sm12345678_data_api_data.json");
const dmc_session_max = require("./data/sm12345678_dmc_session_max_quality.json");
const dmc_session_low = require("./data/sm12345678_dmc_session_low_quality.json");

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

test("downloder quality check", (t) => {
    t.truthy(isMaxQuality(api_data, dmc_session_max));
    t.falsy(isMaxQuality(api_data, dmc_session_low));
});