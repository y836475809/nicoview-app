const test = require("ava");
const nock = require("nock");
const { NicoWatch, getCookies } = require("../app/js/niconico");
const { MockNicoUitl, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const prof_time = new ProfTime();
const nico_mock = nock("http://www.nicovideo.jp");

test.before(t => {
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);

    nock.cleanAll();  
});

test.beforeEach(t => {
    prof_time.start(t);

    nock.cleanAll();
    nock.enableNetConnect();
});

test.afterEach(t => {
    prof_time.end(t);
});

const getMock = (delay, body) =>{
    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    if(!body){
        body = MockNicoUitl.getWatchHtml(TestData.video_id);
    }
    nico_mock
        .get(`/watch/${TestData.video_id}`)
        .delay(delay)
        .reply(200, body, headers);
};

test("watch get cookie", async (t) => {
    getMock(1);

    const nico_watch = new NicoWatch();
    const { cookies, api_data } = await nico_watch.watch(TestData.video_id);
    t.deepEqual(getCookies(cookies),[
        {
            url: "http://www.nicovideo.jp",
            name: "nicohistory",
            value: `${TestData.video_id}%3A123456789`,
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

    getMock(3000);

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

    getMock(3000);

    const nico_watch = new NicoWatch();

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

    getMock(6000);
        
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
        t.regex(error.message, /timeout/);
    }
});

test("watch page not find", async t => {
    t.plan(2);

    getMock(1);
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch("ms00000000");
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
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
    getMock(1, body);
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
    getMock(1, body);
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
    getMock(1, body);            
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Cannot read property 'getAttribute' of null");
    }
});