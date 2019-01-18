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

let test_times = [];

test.before(async t => {
    test_times = [];
    await mock_server.start();   
});

test.after(async t => {
    await mock_server.stop();

    const black   = "\u001b[30m";
    const red     = "\u001b[31m";
    const green   = "\u001b[32m";
    const yellow  = "\u001b[33m";
    const blue    = "\u001b[34m";
    const magenta = "\u001b[35m";
    const cyan    = "\u001b[36m";
    const white   = "\u001b[37m";
    const reset   = "\u001b[0m";

    test_times.forEach(value => {
        console.log(`${value.name} ${green}(${value.time} ms)${reset}`);
    });
});

test.beforeEach(t => {
    t.context.start = new Date();

    nock.cleanAll();
});

test.afterEach(t => {
    const start = t.context.start;
    const ms = new Date().getTime() - start.getTime();
    test_times.push({
        name: t.title.replace("afterEach hook for ", ""),
        time: ms
    });
});

test("watch get cookie", async (t) => {
    const nico_watch = new NicoWatch(proxy_url);
    const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
    t.deepEqual(getCookies(cookie_jar),[
        {
            url: "http://www.nicovideo.jp",
            name: "nicohistory",
            value: `${test_video_id}%3A123456789`,
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

test.cb("watch cancel", t => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .delay(5000)
        .reply(200, getMockWatchHtml(test_video_id));

    const nico_watch = new NicoWatch(proxy_url);
    nico_watch.watch(test_video_id, (msg) => {
        t.is(msg, "watch cancel");
        t.end();
    });
    setTimeout(()=>{
        nico_watch.cancel();
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
        t.is(error.code, "ECONNABORTED");
        t.regex(error.message, /timeout/);
    }
});

test("watch page not find", async t => {
    t.plan(1);

    try {
        const nico_watch = new NicoWatch(proxy_url);
        await nico_watch.watch("ms00000000");
    } catch (error) {
        t.is(error.status, 404);
    }
});

test("watch data-api-data json error", async (t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" data-api-data="dummy"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy_url);
        await nico_watch.watch(test_video_id);
    } catch (error) {
        t.is(error.error.message, "Unexpected token d in JSON at position 0");
    }
});

test("watch no data-api-data", async (t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" fault-data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy_url);
        await nico_watch.watch(test_video_id);
    } catch (error) {
        t.is(error.error.message, "not find data-api-data");
    }
});

test("watch no js-initial-watch-data", async (t) => {
    t.plan(1);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .get(`/watch/${test_video_id}`)
        .reply(200, 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="fault-js-initial-watch-data" data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`);
    try {
        const nico_watch = new NicoWatch(proxy_url);
        await nico_watch.watch(test_video_id);
    } catch (error) {
        t.is(error.error.message, "Cannot read property 'getAttribute' of null");
    }
});