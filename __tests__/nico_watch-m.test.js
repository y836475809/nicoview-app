const test = require("ava");
const MockAdapter  = require("axios-mock-adapter");
const { client, NicoWatch, getCookies } = require("../app/js/niconico");
const { MockNicoUitl, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

let mockAxios;
const prof_time = new ProfTime();

test.before(async t => {
    prof_time.clear();
});

test.after(async t => {
    prof_time.log(t);
});

test.beforeEach(t => {
    prof_time.start(t);
    mockAxios  = new MockAdapter(client);
});

test.afterEach(t => {
    prof_time.end(t);
});

test("watch get cookie",  async(t) => {
    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            return [200, MockNicoUitl.getWatchHtml(TestData.video_id), headers];
        });

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

    const mockAxios = new MockAdapter(client, { delayResponse: 3000 });
    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            return [200, MockNicoUitl.getWatchHtml(TestData.video_id), headers];
        });

    const nico_watch = new NicoWatch();
    setTimeout(()=>{
        nico_watch.cancel();
    }, 1000);
    try {
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        // console.log(error)
        t.truthy(error.cancel);
    }
});

test("watch cancel 2", async(t) => {
    t.plan(1);

    const mockAxios = new MockAdapter(client, { delayResponse: 3000 });
    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            return [200, MockNicoUitl.getWatchHtml(TestData.video_id), headers];
        });

    const nico_watch = new NicoWatch();
    setTimeout(()=>{
        nico_watch.cancel();
        nico_watch.cancel();
    }, 1000);
    try {
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        // console.log(error)
        t.truthy(error.cancel);
    }
});

test("watch timetout", async (t) => {
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`).timeout();

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        // console.log(error)
        t.is(error.cancel, undefined);
        // t.is(error.name, "RequestError");
        t.regex(error.message, /timeout/);
    }
});

test("watch page not find", async t => {
    t.plan(2);

    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch("ms00000000");
    } catch (error) {
        // console.log("rror.response.status", error)
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }
});

test("watch data-api-data json error", async (t) => {
    t.plan(2);

    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            const html = `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" data-api-data="dummy"
                </body>
            </html>`;
            return [200, html, headers];
        });
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

    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            const html = 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="js-initial-watch-data" fault-data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`;
            return [200, html, headers];
        });

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

    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    mockAxios.onGet(`http://www.nicovideo.jp/watch/${TestData.video_id}`)
        .reply((config) => {
            const html = 
            `<!DOCTYPE html>
            <html lang="ja">
                <body>
                <div id="fault-js-initial-watch-data" data-api-data="{&quot;video&quot;:null}"
                </body>
            </html>`;
            return [200, html, headers];
        });
    try {
        const nico_watch = new NicoWatch();
        await nico_watch.watch(TestData.video_id);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.message, "Cannot read property 'getAttribute' of null");
    }
});