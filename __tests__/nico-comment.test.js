const test = require("ava");
const { NicoComment } = require("../app/js/niconico");
const { NicoMocks, TestData} = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const data_api_data = TestData.data_api_data;

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

test("request param", t => {
    const nico_comment = new NicoComment(data_api_data);

    {
        const comment_json = nico_comment.makeJsonNoOwner(0, 0);
        t.is(comment_json.length, 8);
        t.is(comment_json[0].ping.content, "rs:0");
        t.is(comment_json[1].ping.content, "ps:0");
        t.is(comment_json[2].thread.version, "20090904");
        t.is(comment_json[3].ping.content, "pf:0");
        t.is(comment_json[4].ping.content, "ps:1");
        t.not(comment_json[5].thread_leaves, undefined);
        t.is(comment_json[6].ping.content, "pf:1");
        t.is(comment_json[7].ping.content, "rf:0");
    }
    {
        const comment_json = nico_comment.makeJsonOwner(0, 0);
        t.is(comment_json.length, 11);
        t.is(comment_json[0].ping.content, "rs:0");
        t.is(comment_json[1].ping.content, "ps:0");
        t.is(comment_json[2].thread.version, "20061206");
        t.is(comment_json[3].ping.content, "pf:0");
        t.is(comment_json[4].ping.content, "ps:1");
        t.is(comment_json[5].thread.version, "20090904");
        t.is(comment_json[6].ping.content, "pf:1");
        t.is(comment_json[7].ping.content, "ps:2");
        t.not(comment_json[8].thread_leaves, undefined);
        t.is(comment_json[9].ping.content, "pf:2");
        t.is(comment_json[10].ping.content, "rf:0");
    }
});

test("request param inc rs,ps no", t => {
    const nico_comment = new NicoComment(data_api_data);

    {
        const comment_json = nico_comment._get_comment_json();
        t.is(comment_json.length, 8);
        t.is(comment_json[0].ping.content, "rs:0");
        t.is(comment_json[1].ping.content, "ps:0");
        t.not(comment_json[2].thread, undefined);
        t.is(comment_json[3].ping.content, "pf:0");
        t.is(comment_json[4].ping.content, "ps:1");
        t.not(comment_json[5].thread_leaves, undefined);
        t.is(comment_json[6].ping.content, "pf:1");
        t.is(comment_json[7].ping.content, "rf:0");
    }
    {
        const comment_json = nico_comment._get_comment_json();
        t.is(comment_json.length, 8);
        t.is(comment_json[0].ping.content, "rs:1");
        t.is(comment_json[1].ping.content, "ps:8");
        t.not(comment_json[2].thread, undefined);
        t.is(comment_json[3].ping.content, "pf:8");
        t.is(comment_json[4].ping.content, "ps:9");
        t.not(comment_json[5].thread_leaves, undefined);
        t.is(comment_json[6].ping.content, "pf:9");
        t.is(comment_json[7].ping.content, "rf:1");
    }
    {
        const comment_json = nico_comment._get_comment_json();
        t.is(comment_json.length, 8);
        t.is(comment_json[0].ping.content, "rs:2");
        t.is(comment_json[1].ping.content, "ps:16");
        t.not(comment_json[2].thread, undefined);
        t.is(comment_json[3].ping.content, "pf:16");
        t.is(comment_json[4].ping.content, "ps:17");
        t.not(comment_json[5].thread_leaves, undefined);
        t.is(comment_json[6].ping.content, "pf:17");
        t.is(comment_json[7].ping.content, "rf:2");
    }
});

test("get comment", async (t) => {
    nico_mocks.comment();

    const nico_comment = new NicoComment(data_api_data);
    const res_comments = await nico_comment.getComment();

    t.is(res_comments.length, 7);
    t.not(res_comments[0].ping, undefined);
    t.not(res_comments[1].ping, undefined);
    t.not(res_comments[2].thread, undefined);
    t.not(res_comments[3].leaf, undefined);
    t.not(res_comments[4].leaf, undefined);
    t.not(res_comments[5].chat, undefined);
    t.not(res_comments[6].chat, undefined);
});

test("get comment empty param", async (t) => {
    t.plan(2);

    nico_mocks.comment();

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment._post([]);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
    }
});

test("get comment illegal param", async (t) => {
    nico_mocks.comment();

    const nico_comment = new NicoComment(data_api_data);

    let cmds = [];
    cmds.push(nico_comment._getPing("rs", 0));
    cmds.push(nico_comment._getPing("rf", 0));
    const res_comments = await nico_comment._post(cmds);
    const chats = res_comments.filter((elm, index) => { 
        return "chat" in res_comments[index]; 
    });
    t.is(chats.length, 0);
});

test("get comment timeout", async (t) => {
    t.plan(3);

    nico_mocks.comment(11*1000);

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment.getComment();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout\s*:\s*https/i);
    }
});

test("get comment cancel", async(t) => {
    t.plan(1);
    
    nico_mocks.comment(3000);

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

test("get comment cancel 2", async(t) => {
    t.plan(1);
    
    nico_mocks.comment(3000);

    const nico_comment = new NicoComment(data_api_data);
    
    setTimeout(()=>{
        nico_comment.cancel();
        nico_comment.cancel();
    }, 1000);
    
    try {
        await nico_comment.getComment();
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("get comment 403", async (t) => {
    t.plan(3);

    nico_mocks.comment(1, 403);

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment.getComment();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /403:/);
    }
});

test("get comment 500", async (t) => {
    t.plan(3);

    nico_mocks.comment(1, 500);

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment.getComment();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /500:/);
    }
});