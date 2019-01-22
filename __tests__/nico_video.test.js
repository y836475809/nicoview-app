const test = require("ava");
const nock = require("nock");
const axios = require("axios");
const { NicoVideo } = require("../app/js/niconico");
const { MockNicoServer, MockNicoUitl, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const data_api_data = TestData.data_api_data;
MockNicoUitl.tohttp(data_api_data);

const mock_server = new MockNicoServer();
const server_url = mock_server.serverUrl;
const proxy = mock_server.proxy;
const cookie_jar = MockNicoUitl.getCookieJar(TestData.video_id);

const prof_time = new ProfTime();

test.before(async t => {
    console.log("beforeAll");
    await mock_server.start();
    prof_time.clear();
});

test.after(async t => {
    console.log("afterAll");
    await mock_server.stop();
    prof_time.log(t);
});

test.beforeEach(t => {
    prof_time.start(t);
    nock.cleanAll();
});

test.afterEach(t => {
    prof_time.end(t);
});

test.cb("nico smile error", t => {
    t.plan(2);

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    const smile_url = nico_video.SmileUrl;

    axios.get(smile_url, {
        // jar: cookie_jar,
        withCredentials: true,
        proxy: proxy,
    }).catch((error) => {
        t.is(error.response.status, 403);
        t.is(error.response.data, "fault 403");
        t.end();
    });
});

test.cb("nico smile", (t) => {
    t.plan(2);

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    const smile_url = nico_video.SmileUrl;

    axios.get(smile_url, {
        jar: cookie_jar,
        withCredentials: true,
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

    t.is(nico_video.dmc_session.session.id, "12345678");
});



test("nico dmc session error", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api/sessions?_format=json")
        .reply(403, { meta: { status: 403, message: "403"} });

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }    
});

test("nico dmc session timeout", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api/sessions?_format=json")
        .delay(11000)
        .reply(200, { meta: { status: 200, message: "ok"} });

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
    }    
});

test("nico dmc session cancel", async (t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api/sessions?_format=json")
        .delay(5000)
        .reply(200, { meta: { status: 200, message: "ok"} });

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    setTimeout(()=>{
        nico_video.cancel();
    }, 1000);
    
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("nico dmc heart beat", async (t) => {
    t.plan(2);
    mock_server.clearCount();

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    await nico_video.postDmcSession();
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));

    nico_video.stopHeartBeat();  
    t.is(mock_server.dmc_hb_options_count, 1);
    t.is(mock_server.dmc_hb_post_count, 3);
});

test("nico stop dmc heart beat", async (t) => {
    t.plan(2);
    mock_server.clearCount();

    const nico_video = new NicoVideo(cookie_jar, data_api_data, proxy);
    await nico_video.postDmcSession();
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 500));
    nico_video.stopHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));
    t.is(mock_server.dmc_hb_options_count, 1);
    t.is(mock_server.dmc_hb_post_count, 0);
});
