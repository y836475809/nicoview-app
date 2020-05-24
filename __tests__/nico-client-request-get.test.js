const test = require("ava");
const nock = require("nock");
const { writeBufStream } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");
const { NicoClientRequest, NicoCookie } = require("../app/js/nico-client-request");

const prof_time = new ProfTime();

const mock_timeout = 121*1000;
const test_host = "https://www.nock.test-get";
const test_path = "/get/";
const test_url = `${test_host}${test_path}`;
const cookies = [
    "nicohistory=sm123456%3A123456789; path=/; domain=.nicovideo.jp",
    "nicosid=123456.789; path=/; domain=.nicovideo.jp"
];

const nock_get = (delay=1, code=200) => {
    const body = "ok";
    const headers = {
        "Set-Cookie": cookies,
        "Content-Length":body.length
    };
    
    nock(test_host)
        .get(test_path)
        .delay(delay)
        .reply(code, body, headers);
};

const nock_get_req_cookie = () => {
    const body = "ok";
    nock(test_host, {
        reqheaders: {
            "Cookie": cookies,
        }
    })
        .get(test_path)
        .reply(200, body);
};

test.before(t => {
    prof_time.clear();

    process.env["http_proxy"]="";
    process.env["https_proxy"]="";
    process.env["no_proxy"]="";
    
    nock.disableNetConnect();
});

test.after(t => {
    prof_time.log(t);
});

test.beforeEach(t => {
    prof_time.start(t);
    nock.cleanAll();
});

test.afterEach(t => {
    prof_time.end(t);
    nock.cleanAll();
});

test("get data, res cookie", async (t) => {
    nock_get();

    const req = new NicoClientRequest();
    const body = await req.get(test_url);
    const nico_cookie = req.getNicoCookie();

    t.is(body, "ok");
    t.deepEqual(nico_cookie.getSesstionCookies(),[
        {
            url: test_host,
            name: "nicohistory",
            value: "sm123456%3A123456789",
            domain: ".nicovideo.jp",
            path: "/",
            secure: false
        },
        {
            url: test_host,
            name: "nicosid",
            value: "123456.789",
            domain: ".nicovideo.jp",
            path: "/",
            secure: false
        }
    ]);
});

test("get req cookie", async (t) => {
    nock_get_req_cookie();

    const nico_cookie = new NicoCookie(test_url, {
        "set-cookie":cookies
    });

    const req = new NicoClientRequest();
    const body = await req.get(test_url, {nico_cookie});

    t.is(body, "ok");
});

test.cb("get cancel", (t) => {
    t.plan(1);

    nock_get(2*1000);

    const req = new NicoClientRequest();
    setTimeout(()=>{
        req.cancel();
    }, 1000);

    req.get(test_url)
        .then()
        .catch(error=>{
            t.truthy(error.cancel);
            t.end();
        });
});

test("get stream", async (t) => {
    nock_get();

    const req = new NicoClientRequest();
    const writer = new writeBufStream();
    let act_current = 0;
    let act_content_len = 0;
    let progress_count = 0;
    await req.get(test_url, {stream:writer, on_progress:(current, content_len)=>{
        act_current = current;
        act_content_len = content_len;
        progress_count++;
    }});

    t.is(writer.buf, "ok");
    t.true(progress_count>0);
    t.true(act_current>0);
    t.true(act_content_len>0);
    t.is(act_current, act_content_len);
});

test("cancel", async(t) => {
    t.plan(1);

    nock_get(3000);

    const req = new NicoClientRequest();

    setTimeout(()=>{
        req.cancel();
    }, 1000);

    try {
        await req.get(test_url);
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("cancel twice", async(t) => {
    t.plan(1);

    nock_get(3000);

    const req = new NicoClientRequest();

    setTimeout(()=>{
        req.cancel();
    }, 1000);
    setTimeout(()=>{
        req.cancel();
    }, 2000);

    try {
        await req.get(test_url);
    } catch (error) {
        t.truthy(error.cancel);    
    }
});

test("timetout", async (t) => {
    t.plan(3);

    nock_get(mock_timeout);
        
    try {
        const req = new NicoClientRequest();
        await req.get(test_url);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout/i);
    }
});

test("page not find", async t => {
    t.plan(3);

    nock_get(1, 404);
        
    try {
        const req = new NicoClientRequest();
        await req.get(test_url);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});