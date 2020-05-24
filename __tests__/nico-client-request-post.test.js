const test = require("ava");
const nock = require("nock");
const { ProfTime } = require("./helper/ava-prof-time");
const { NicoClientRequest } = require("../app/js/nico-client-request");

const prof_time = new ProfTime();

const mock_timeout = 121*1000;
const test_host = "https://www.nock.test-json";
const test_path = "/json/";
const test_url = `${test_host}${test_path}`;
const json_data = {key1:"data1"};

let post_count = 0;
const nock_post = ({delay=1, code=200, res_json={key:"ok"}}={}) => {
    post_count = 0;
    nock(test_host)
        .post(test_path)
        .delay(delay)
        .times(Infinity)
        .reply((uri, reqbody)=>{
            post_count++;
            return [code, res_json];
        });
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

test("post", async (t) => {
    nock_post();

    const req = new NicoClientRequest();
    const ret = await req.post(test_url, {json:json_data});
    t.deepEqual(ret, {key:"ok"});
});

test.cb("post cancel", (t) => {
    t.plan(1);

    nock_post({delay:2*1000});

    const req = new NicoClientRequest();
    setTimeout(()=>{
        req.cancel();
    }, 1000);

    req.post(test_url, {json:json_data})
        .then()
        .catch(error=>{
            t.truthy(error.cancel);
            t.end();
        });
});

test("post json error", async (t) => {
    nock_post({res_json:"ok"});
    try {
        const req = new NicoClientRequest();
        await req.post(test_url, {json:json_data});
    } catch (error) {
        t.is(error.cancel, undefined);
        t.regex(error.message, /response json parse error/i);
    }
});

test("post repeat", async (t) => {
    nock_post();

    const req = new NicoClientRequest();
    const int_id = setInterval(async () => { 
        await req.post(test_url, {json:json_data});
    }, 1000);
    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(int_id);

    t.is(post_count, 2);
});

test.cb("post repeat check async", (t) => {
    t.plan(2);

    nock_post();

    const log = [];
    let int_id = null;
    setTimeout(()=>{
        clearInterval(int_id);
        t.is(post_count, 2);
        t.deepEqual(log, ["log1", {key:"ok"}, {key:"ok"}]);
        t.end();
    },2500);

    const req = new NicoClientRequest();
    int_id = setInterval(() => { 
        req.post(test_url, {json:json_data})
            .then((ret)=>{log.push(ret);});
    }, 1000);  
    
    log.push("log1");
});

test("post repeat stop", async (t) => {
    nock_post();

    const req = new NicoClientRequest();
    const int_id = setInterval(async () => { 
        await req.post(test_url, {json:json_data});
        clearInterval(int_id);
    }, 1000);
    await new Promise(resolve => setTimeout(resolve, 2500));

    t.is(post_count, 1);
});

test("post timeout", async (t) => {
    t.plan(3);

    nock_post({delay:mock_timeout});

    try {
        const req = new NicoClientRequest();
        await req.post(test_url, {json:json_data});
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout/i);
    }
});

test("post page not find", async t => {
    t.plan(3);

    nock_post({delay:1, code:404});
        
    try {
        const req = new NicoClientRequest();
        await req.post(test_url, {json:json_data});
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});