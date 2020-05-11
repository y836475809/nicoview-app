const test = require("ava");
const nock = require("nock");
const { ProfTime } = require("./helper/ava-prof-time");
const { NicoClientRequest } = require("../app/js/nico-client-request");

const prof_time = new ProfTime();

const test_host = "https://www.nock.test-options";
const test_path = "/options/";
const test_url = `${test_host}${test_path}`;

const nock_options = (delay=1, code=200) => {
    nock(test_host)
        .options(test_path)
        .delay(delay)
        .reply(code, "ok");
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
    nock.cleanAll();
});

test.beforeEach(t => {
    prof_time.start(t);
    nock.cleanAll();
});

test.afterEach(t => {
    prof_time.end(t);
});

test("options", async (t) => {
    nock_options();

    const req = new NicoClientRequest();
    const body = await req.options(test_url);
    t.is(body, "ok");
});

test.cb("options cancel", (t) => {
    t.plan(1);

    nock_options(2*1000);

    const req = new NicoClientRequest();
    setTimeout(()=>{
        req.cancel();
    }, 1000);

    req.options(test_url)
        .then()
        .catch(error=>{
            t.truthy(error.cancel);
            t.end();
        });
});

test("options timeout", async (t) => {
    t.plan(3);

    nock_options(3000);

    try {
        const req = new NicoClientRequest();
        await req.options(test_url, {timeout_msec:1*1000});
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout/i);
    }
});

test("options page not find", async t => {
    t.plan(3);

    nock_options(1, 404);
        
    try {
        const req = new NicoClientRequest();
        await req.options(test_url);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});