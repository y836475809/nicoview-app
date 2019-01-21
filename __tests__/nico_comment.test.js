const test = require("ava");
const nock = require("nock");
const { NicoCommnet } = require("../app/js/niconico");
const { MockNicoServer, MockNicoUitl, TestData} = require("./helper/nico_mock");
const res_comment_json = TestData.no_owner_comment;
const data_api_data = TestData.data_api_data;
MockNicoUitl.tohttp(data_api_data);
const { ProfTime } = require("./helper/ava_prof_time");

const mock_server = new MockNicoServer();
const server_url = mock_server.serverUrl;
const proxy = mock_server.proxy;
const prof_time = new ProfTime();

const cookie_jar = MockNicoUitl.getCookieJar(TestData.video_id);

test.before(async t => {
    console.log("beforeAll");
    await mock_server.start();
    prof_time.clear();
});

test.after(async t => {
    console.log("afterAll");
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


test("request param", t => {
    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);

    {
        const commnet_json = nico_comment.makeJsonNoOwner(0, 0);
        t.is(commnet_json.length, 8);
        t.is(commnet_json[0].ping.content, "rs:0");
        t.is(commnet_json[1].ping.content, "ps:0");
        t.is(commnet_json[2].thread.version, "20090904");
        t.is(commnet_json[3].ping.content, "pf:0");
        t.is(commnet_json[4].ping.content, "ps:1");
        t.not(commnet_json[5].thread_leaves, undefined);
        t.is(commnet_json[6].ping.content, "pf:1");
        t.is(commnet_json[7].ping.content, "rf:0");
    }
    {
        const commnet_json = nico_comment.makeJsonOwner(0, 0);
        t.is(commnet_json.length, 11);
        t.is(commnet_json[0].ping.content, "rs:0");
        t.is(commnet_json[1].ping.content, "ps:0");
        t.is(commnet_json[2].thread.version, "20061206");
        t.is(commnet_json[3].ping.content, "pf:0");
        t.is(commnet_json[4].ping.content, "ps:1");
        t.is(commnet_json[5].thread.version, "20090904");
        t.is(commnet_json[6].ping.content, "pf:1");
        t.is(commnet_json[7].ping.content, "ps:2");
        t.not(commnet_json[8].thread_leaves, undefined);
        t.is(commnet_json[9].ping.content, "pf:2");
        t.is(commnet_json[10].ping.content, "rf:0");
    }
});

test("request param inc rs,ps no", t => {
    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);

    {
        const commnet_json = nico_comment._get_commnet_json();
        t.is(commnet_json.length, 8);
        t.is(commnet_json[0].ping.content, "rs:0");
        t.is(commnet_json[1].ping.content, "ps:0");
        t.not(commnet_json[2].thread, undefined);
        t.is(commnet_json[3].ping.content, "pf:0");
        t.is(commnet_json[4].ping.content, "ps:1");
        t.not(commnet_json[5].thread_leaves, undefined);
        t.is(commnet_json[6].ping.content, "pf:1");
        t.is(commnet_json[7].ping.content, "rf:0");
    }
    {
        const commnet_json = nico_comment._get_commnet_json();
        t.is(commnet_json.length, 8);
        t.is(commnet_json[0].ping.content, "rs:1");
        t.is(commnet_json[1].ping.content, "ps:8");
        t.not(commnet_json[2].thread, undefined);
        t.is(commnet_json[3].ping.content, "pf:8");
        t.is(commnet_json[4].ping.content, "ps:9");
        t.not(commnet_json[5].thread_leaves, undefined);
        t.is(commnet_json[6].ping.content, "pf:9");
        t.is(commnet_json[7].ping.content, "rf:1");
    }
    {
        const commnet_json = nico_comment._get_commnet_json();
        t.is(commnet_json.length, 8);
        t.is(commnet_json[0].ping.content, "rs:2");
        t.is(commnet_json[1].ping.content, "ps:16");
        t.not(commnet_json[2].thread, undefined);
        t.is(commnet_json[3].ping.content, "pf:16");
        t.is(commnet_json[4].ping.content, "ps:17");
        t.not(commnet_json[5].thread_leaves, undefined);
        t.is(commnet_json[6].ping.content, "pf:17");
        t.is(commnet_json[7].ping.content, "rf:2");
    }
});

test("get comment", async (t) => {
    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);
    const res_commnets = await nico_comment.getCommnet();

    t.is(res_commnets.length, 7);
    t.not(res_commnets[0].ping, undefined);
    t.not(res_commnets[1].ping, undefined);
    t.not(res_commnets[2].thread, undefined);
    t.not(res_commnets[3].leaf, undefined);
    t.not(res_commnets[4].leaf, undefined);
    t.not(res_commnets[5].chat, undefined);
    t.not(res_commnets[6].chat, undefined);
});

test("get comment empty param", async (t) => {
    t.plan(1);

    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);
    try {
        await nico_comment._post([]);
    } catch (error) {
        t.is(error.status, 404);
    }
});

test("get comment illegal param", async (t) => {
    t.plan(1);

    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);

    let cmds = [];
    cmds.push(nico_comment._getPing("rs", 0));
    cmds.push(nico_comment._getPing("rf", 0));
    const res_commnets = await nico_comment._post(cmds);
    const chats = res_commnets.filter((elm, index) => { 
        return "chat" in res_commnets[index]; 
    });
    t.is(chats.length, 0);
});

test("get comment timeout", async (t) => {
    t.plan(2);

    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api.json/")
        .delay(11000)
        .reply(200, res_comment_json);

    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);

    try {
        await nico_comment.getCommnet();
    } catch (error) {
        t.is(error.code, "ECONNABORTED");
        t.regex(error.message, /timeout/);
    }
});

test.cb("get comment cancel", t => {
    t.plan(1);
    
    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api.json/")
        .delay(3000)
        .reply(200, res_comment_json);

    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);
    nico_comment.getCommnet((msg) => {
        t.is(msg, "comment cancel");
        t.end();
    });
    setTimeout(()=>{
        nico_comment.cancel();
    }, 1000);
});

test("get comment cancel 2", async(t) => {
    t.plan(3);
    
    nock.disableNetConnect();
    nock.enableNetConnect("localhost");
    nock(server_url)
        .post("/api.json/")
        .delay(3000)
        .reply(200, res_comment_json);

    const nico_comment = new NicoCommnet(cookie_jar, data_api_data, proxy);
    
    let cancel_count = 0;
    setTimeout(()=>{
        nico_comment.cancel();
        nico_comment.cancel();
    }, 1000);

    const ret = await nico_comment.getCommnet((msg) => {
        t.is(msg, "comment cancel");
        cancel_count++;
    });
    t.is(ret, null);
    t.is(cancel_count, 1);
});