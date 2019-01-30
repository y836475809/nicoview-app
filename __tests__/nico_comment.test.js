const test = require("ava");
const nock = require("nock");
const { NicoComment } = require("../app/js/niconico");
const { TestData} = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const data_api_data = TestData.data_api_data;
const no_owner_comment = TestData.no_owner_comment;
const owner_comment = TestData.owner_comment;

const prof_time = new ProfTime();
const example = nock("http://nmsg.nicovideo.jp");

test.before(t => {
    console.log("beforeAll");
    prof_time.clear();
});

test.after(t => {
    console.log("afterAll");
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

const getMock = (delay) =>{
    example
        .post("/api.json/")
        .delay(delay)
        .reply((uri, reqbody)=>{
            const data = JSON.parse(reqbody);         
            if(data.length===0){              
                return [404, "404 - \"Not Found\r\n\""];
            }

            if(data.length===8){
                //no owner
                return [200, no_owner_comment];
            }

            if(data.length===11){
                //owner
                return [200, owner_comment];
            }

            return [200,
                [
                    { "ping": { "content": "rs:0" } },
                    { "ping": { "content": "rf:0" } }
                ]]; 
        });
};

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
    getMock(1);

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

    getMock(1);

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment._post([]);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }
});

test("get comment illegal param", async (t) => {
    getMock(1);

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

    getMock(11000);

    const nico_comment = new NicoComment(data_api_data);
    try {
        await nico_comment.getComment();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
        t.regex(error.message, /timeout/);
    }
});

test("get comment cancel", async(t) => {
    t.plan(1);
    
    getMock(3000);

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
    
    getMock(3000);

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