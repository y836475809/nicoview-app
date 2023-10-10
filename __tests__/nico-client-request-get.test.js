const test = require("ava");
const nock = require("nock");
const { writeBufStream } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");
const { NicoClientRequest } = require("../src/lib/nico-client-request");

const prof_time = new ProfTime();

const mock_timeout = 121*1000;
const test_host = "https://www.nock.test-get";
const test_path = "/get/";
const test_url = `${test_host}${test_path}`;

const nock_get = (delay=1, code=200) => {
    const body = "ok";
    const headers = {
        "Content-Length":body.length
    };
    
    nock(test_host)
        .get(test_path)
        .delay(delay)
        .reply(code, body, headers);
};

test.before(t => { // eslint-disable-line no-unused-vars
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

test("get cancel", async (t) => {
    t.plan(1);

    nock_get(2*1000);
    const req = new NicoClientRequest();

    await new Promise(resolve => {
        setTimeout(()=>{
            req.cancel();
        }, 1000);
        
        req.get(test_url).then().catch(error=>{
            t.truthy(error.cancel);
            resolve();
        });
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