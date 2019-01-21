const test = require("ava");
const axios = require("axios");
const { NicoVideo } = require("../app/js/niconico");
const { MockNicoServer, MockNicoUitl, TestData } = require("./helper/nico_mock");
const data_api_data = TestData.data_api_data;
MockNicoUitl.tohttp(data_api_data);

const mock_server = new MockNicoServer();
const proxy = mock_server.proxy;
const cookie_jar = MockNicoUitl.getCookieJar(TestData.video_id);

test.before(async t => {
    console.log("beforeAll");
    await mock_server.start();
});

test.after(async t => {
    console.log("afterAll");
    await mock_server.stop();
});

test.cb("nico smile error", t => {
    t.plan(2);

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    const smile_url = nico_video.SmileUrl;

    axios.get(smile_url, {
        // jar: cookie_jar,
        proxy: proxy,
    }).catch((error) => {
        t.is(error.response.status, 403);
        t.is(error.response.data, "403");
        t.end();
    });
});

test.cb("nico smile", (t) => {
    t.plan(2);

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    const smile_url = nico_video.SmileUrl;

    axios.get(smile_url, {
        jar: cookie_jar,
        proxy: proxy,
    }).then((response) => {
        t.is(response.status, 200);
        t.is(response.data, "smile");
        t.end();
    });
});

test("nico dmc session", async (t) => {
    t.plan(1);

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    await nico_video.postDmcSession();

    t.not(nico_video.dmc_session.session, undefined);
});

test.cb("nico dmc heart beat", async (t) => {
    t.plan(2);
    mock_server.clearCount();

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    await nico_video.postDmcSession();
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.startHeartBeat((error)=>{});

    setTimeout(()=>{
        t.is(mock_server.dmc_hb_options_count, 1);
        t.is(mock_server.dmc_hb_post_count, 3);
        nico_video.stopHeartBeat();
        t.end();
    }, 3000);
});

test.cb("nico stop dmc heart beat", async (t) => {
    t.plan(2);
    mock_server.clearCount();

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    await nico_video.postDmcSession();
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.startHeartBeat((error)=>{});
    setTimeout(()=>{
        nico_video.stopHeartBeat();
    }, 500);

    setTimeout(()=>{
        t.is(mock_server.dmc_hb_options_count, 1);
        t.is(mock_server.dmc_hb_post_count, 0);
        nico_video.stopHeartBeat();
        t.end();
    }, 3000);
});
