const nock = require("nock");
const { NicoWatch, NicoVideo, NicoCommnet, getCookies } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp, getMockWatchHtml } = require("./nico_mock");
const test = require('ava');

const test_video_id = "sm12345678";

const mock_server = new MockNicoServer();
const server_url = mock_server.serverUrl;
// const proxy_url = mock_server.proxyUrl;
const proxy_url = {
    host: "localhost",
    port: 3000
};
test.before(async t => {
    console.log("################## test.before");
    await mock_server.start();   
});

test.after(async t => {
    await mock_server.stop();
});
var start;
// let mm = new Map();
test.beforeEach(t => {
    start = new Date();
    // mm.set(t.title, start);
    console.log("################## t.title=", t.title);
    
    nock.cleanAll();
});

test.afterEach(t => {
    var stop = new Date();
    var ms = stop.getTime() - start.getTime();
    console.log("################## t.title=", t.title, " ms=", ms);
});

test.cb('calc test', t => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .delay(5000)
        // .reply(200, "ok");
        .reply(200, getMockWatchHtml(test_video_id));

    const nico_watch = new NicoWatch(proxy_url);
    nico_watch.watch(test_video_id, (msg) => {
        console.log("msg ##################", msg);
        t.is(msg, "watch cancel");
        // done(); 
        t.end();
    }).catch((error) => {
        console.log("error ##################", error);
    }).then((b) => {
        console.log("()then ##################");
        // t.end();
    });
    setTimeout(()=>{
        
        nico_watch.cancel();
        // done();
    }, 1000);
   
});

test("watch timetout", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .delay(11000)
        .reply(200, getMockWatchHtml(test_video_id));
        
    try {
        const nico_watch = new NicoWatch(proxy_url);
        await nico_watch.watch(test_video_id);
    } catch (error) {
        console.log("timetout then ##################");
        t.is(error.code, "ECONNABORTED");
        t.regex(error.message, /timeout/);
    }
});

test("get 404", async t => {
    t.plan(1);
    nock.cleanAll();

    const nico_watch = new NicoWatch(proxy_url);
    try {
        await nico_watch.watch("ms00000000");
    } catch (error) {
        console.log("################## error=", error);
        t.is(error.status, 404);
    }
});