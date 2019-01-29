const test = require("ava");
const MockAdapter  = require("axios-mock-adapter");
const { client, NicoComment } = require("../app/js/niconico");
const { TestData} = require("./helper/nico_mock");
const res_comment_json = TestData.no_owner_comment;
const data_api_data = TestData.data_api_data;
const { ProfTime } = require("./helper/ava_prof_time");
const niconmsg_url = "http://nmsg.nicovideo.jp/api.json/";

let mockAxios;
const prof_time = new ProfTime();

test.before(t => {
    console.log("beforeAll");
    prof_time.clear();
});

test.after(t => {
    console.log("afterAll");
    prof_time.log(t);
});

test.beforeEach(t => {
    prof_time.start(t);
    mockAxios  = new MockAdapter(client);
});

test.afterEach(t => {
    prof_time.end(t);
});

test("request param", t => {
    const nico_comment = new NicoComment(data_api_data);

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
    const nico_comment = new NicoComment(data_api_data);

    {
        const commnet_json = nico_comment._get_comment_json();
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
        const commnet_json = nico_comment._get_comment_json();
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
        const commnet_json = nico_comment._get_comment_json();
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
    mockAxios.onPost(niconmsg_url)
        .reply(200, res_comment_json);

    const nico_comment = new NicoComment(data_api_data);
    const res_commnets = await nico_comment.getComment();

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
    t.plan(2);

    mockAxios.onPost(niconmsg_url)
        .reply(404, "404 - \"Not Found\r\n\"");

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment._post([]);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }
});

test("get comment illegal param", async (t) => {
    t.plan(1);

    mockAxios.onPost(niconmsg_url)
        .reply(200,[
            { "ping": { "content": "rs:0" } },
            { "ping": { "content": "rf:0" } }]);

    const nico_comment = new NicoComment(data_api_data);
    const res_comments = await nico_comment._post([]);
    const chats = res_comments.filter((elm, index) => { 
        return "chat" in res_comments[index]; 
    });
    t.is(chats.length, 0);
});

test("get comment timeout", async (t) => {
    t.plan(3);

    mockAxios.onPost(niconmsg_url)
        .timeout();
    const nico_comment = new NicoComment(data_api_data);

    try {
        await nico_comment.getComment();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.regex(error.name, /Error/);
        t.regex(error.message, /timeout/);
    }
});

test("get comment cancel", async(t) => {
    t.plan(1);
    
    const mockAxios = new MockAdapter(client, { delayResponse: 3000 });
    mockAxios.onPost(niconmsg_url)
        .reply(200, res_comment_json);

    const nico_comment = new NicoComment(data_api_data);
    setTimeout(()=>{
        nico_comment.cancel();
    }, 1000);

    try {
        await nico_comment.getComment();
    } catch (error) {
        t.truthy(error.cancel);
    }
});