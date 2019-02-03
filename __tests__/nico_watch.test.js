const test = require("ava");
const { NicoWatch, getCookies } = require("../app/js/niconico");
const { NicoMocks, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();

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
    const { cookie_jar, api_data } = await nico_watch.watch(TestData.video_id);
    t.deepEqual(getCookies(cookie_jar, TestData.video_id),[
        {
            url: "https://www.nicovideo.jp",
            name: "nicohistory",
            value: `${TestData.video_id}%3A123456789`,
            domain: "nicovideo.jp",
            path: "/",
            secure: false
        },
        {
            url: "https://www.nicovideo.jp",
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

    nico_mocks.watch(6000);
        
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /time/i);
    }
});

test("watch page not find", async t => {
    t.plan(3);

    nico_mocks.watchNotFindPage("ms00000000");
        
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch("ms00000000");
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
    nico_mocks.watch(1, body);

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
    nico_mocks.watch(1, body);

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
    nico_mocks.watch(1, body);

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Cannot read property 'getAttribute' of null");
    }
});