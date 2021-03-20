const test = require("ava");
const { NicoWatch } = require("../app/js/niconico");
const { NicoMocks, TestData } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();
const mock_timeout = 121*1000;

test.before(t => {
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);

    nico_mocks.clean(); 
});

test.beforeEach(t => {
    prof_time.start(t);

    nico_mocks.clean(); 
});

test.afterEach(t => {
    prof_time.end(t);
});

test("watch get cookie", async (t) => {
    nico_mocks.watch();

    const nico_watch = new NicoWatch();
    const { nico_cookie, nico_api } = await nico_watch.watch(TestData.video_id);
    t.deepEqual(nico_cookie.getSesstionCookies(),[
        {
            url: "https://www.nicovideo.jp",
            name: "nicohistory",
            value: `${TestData.video_id}%3A123456789`,
            domain: ".nicovideo.jp",
            path: "/",
            secure: false
        },
        {
            url: "https://www.nicovideo.jp",
            name: "nicosid",
            value: "123456.789",
            domain: ".nicovideo.jp",
            path: "/",
            secure: false
        }
    ]);

    t.not(nico_api.getVideo(), undefined);
    t.not(nico_api.getVideoQuality(), undefined);
    t.not(nico_api.getTags(), undefined);
    t.not(nico_api.getCommentOwnerThread(), undefined);
    t.not(nico_api.getCommentDefaultThread(), undefined);
    t.not(nico_api.getSession(), undefined);
});

test("watch cancel", async(t) => {
    t.plan(1);

    nico_mocks.watch(3000);

    const nico_watch = new NicoWatch();
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

    nico_mocks.watch(3000);

    const nico_watch = new NicoWatch();

    setTimeout(()=>{
        nico_watch.cancel();
    }, 1000);
    setTimeout(()=>{
        nico_watch.cancel();
    }, 2000);

    try {
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.truthy(error.cancel);    
    }
});

test("watch timetout", async (t) => {
    t.plan(3);

    nico_mocks.watch(mock_timeout);
        
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout\s*:\s*https/i);
    }
});

test("watch page not find", async t => {
    t.plan(3);

    nico_mocks.watch(1, 404);
        
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});

test("watch data-api-data json error", async (t) => {
    t.plan(2);

    const body =             
    `<!DOCTYPE html>
    <html lang="ja">
        <body>
        <div id="js-initial-watch-data" data-api-data="dummy"
        </body>
    </html>`;
    nico_mocks.watch(1, 200, body);

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Unexpected token d in JSON at position 0");
    }
});

test("watch no data-api-data", async (t) => {
    t.plan(2);

    const body =             
    `<!DOCTYPE html>
    <html lang="ja">
        <body>
        <div id="js-initial-watch-data" fault-data-api-data="{&quot;video&quot;:null}"
        </body>
    </html>`;
    nico_mocks.watch(1, 200, body);

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "not find data-api-data");
    }
});

test("watch no js-initial-watch-data", async (t) => {
    t.plan(2);

    const body =             
    `<!DOCTYPE html>
    <html lang="ja">
        <body>
        <div id="fault-js-initial-watch-data" data-api-data="{&quot;video&quot;:null}"
        </body>
    </html>`;
    nico_mocks.watch(1, 200, body);

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "not find data-api-data");
    }
});