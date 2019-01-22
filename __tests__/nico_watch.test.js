const test = require("ava");
const nock = require("nock");
const { NicoWatch, getCookies } = require("../app/js/niconico");
const { MockNicoServer, MockNicoUitl, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const mock_server = new MockNicoServer();
const server_url = mock_server.serverUrl;
const proxy = mock_server.proxy;

const prof_time = new ProfTime();

test.before(async t => {
    await mock_server.start();
    prof_time.clear();
});

test.after(async t => {
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

test("watch get cookie", async (t) => {
    const nico_watch = new NicoWatch(proxy);
    const { cookie_jar, api_data } = await nico_watch.watch(TestData.video_id);
    t.deepEqual(getCookies(cookie_jar),[
        {
            url: "http://www.nicovideo.jp",
            name: "nicohistory",
            value: `${TestData.video_id}%3A123456789`,
            domain: "nicovideo.jp",
            path: "/",
            secure: false
        },
        {
            url: "http://www.nicovideo.jp",
            name: "nicosid",
            value: "123456.789",
            domain: "nicovideo.jp",
            path: "/",
            secure: false
        }
    ]);

    t.not(api_data.video, undefined);
    t.not(api_data.commentComposite.threads, undefined);
    t.not(api_data.video.dmcInfo.session_api, undefined);
});

test("watch cancel", async(t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .delay(5000)
        .reply(200, MockNicoUitl.getWatchHtml(TestData.video_id));

    const nico_watch = new NicoWatch(proxy);
    setTimeout(()=>{
        nico_watch.cancel();
    }, 1000);
    try {
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("watch cancel 2", async(t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .delay(5000)
        .reply(200, MockNicoUitl.getWatchHtml(TestData.video_id));

    const nico_watch = new NicoWatch(proxy);

    setTimeout(()=>{
        nico_watch.cancel();
        nico_watch.cancel();
    }, 1000);

    try {
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.truthy(error.cancel);    
    }
});

test("watch timetout", async (t) => {
    t.plan(3);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .delay(11000)
        .reply(200, MockNicoUitl.getWatchHtml(TestData.video_id));
        
    try {
        const nico_watch = new NicoWatch(proxy);
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
        t.regex(error.message, /timeout/);
    }
});

test("watch page not find", async t => {
    t.plan(2);

    try {
        const nico_watch = new NicoWatch(proxy);
        await nico_watch.watch("ms00000000");
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }
});

test("watch data-api-data json error", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" data-api-data="dummy"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy);
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Unexpected token d in JSON at position 0");
    }
});

test("watch no data-api-data", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" fault-data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy);
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "not find data-api-data");
    }
});

test("watch no js-initial-watch-data", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${TestData.video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="fault-js-initial-watch-data" data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy);
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Cannot read property 'getAttribute' of null");
    }
});