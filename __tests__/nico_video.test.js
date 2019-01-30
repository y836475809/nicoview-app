const test = require("ava");
const nock = require("nock");
const { NicoVideo } = require("../app/js/niconico");
const { TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const data_api_data = TestData.data_api_data;

const prof_time = new ProfTime();
const nico_session_mock = nock("https://api.dmc.nico");
const nico_hb_mock = nock("https://api.dmc.nico");

let hb_options_count = 0;
let hb_post_count = 0;

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

const getSessionMock = (delay) =>{
    nico_session_mock
        .post("/api/sessions")
        .query({ _format: "json" })   
        .delay(delay)
        .reply((uri, reqbody)=>{
            const data = JSON.parse(reqbody);         
            if(data.session 
                && data.session.recipe_id 
                && data.session.content_id
                && data.session.content_type
                && data.session.content_src_id_sets
                && data.session.timing_constraint
                && data.session.keep_method
                && data.session.protocol
                && (data.session.content_uri === "")
                && data.session.session_operation_auth
                && data.session.content_auth
                && data.session.client_info
                && data.session.priority !== undefined){
                return [200, {
                    meta: { status: 201,message: "created" },
                    data: { session: { id:"12345678" } }
                }];                    
            }

            return [403, "fault 403"];
        });
};

const getHBMock = (options_delay, post_delay) =>{
    hb_options_count = 0;
    hb_post_count = 0;

    nico_hb_mock
        .options(/\/api\/sessions\/.+/)
        .query({ _format: "json", _method: "PUT" })
        .delay(options_delay)
        .reply((uri, reqbody)=>{
            hb_options_count++;
            return [200, "ok"];
        })
        .post(/\/api\/sessions\/.+/)
        .query({ _format: "json", _method: "PUT" })
        .delay(post_delay)
        .times(50)
        .reply((uri, reqbody)=>{
            hb_post_count++;
            return [200, "ok"];
        });
};

test("nico smile", t => {
    const nico_video = new NicoVideo(data_api_data);

    t.truthy(nico_video.isDmc());
    t.regex(nico_video.SmileUrl, /https:\/\/smile-cls\d\d.sl.nicovideo.jp\/smile\?m=\d+\.\d+low/);
});

test("nico session", t => {
    const nico_video = new NicoVideo(data_api_data);
    const dmc_session =  nico_video.DmcSession;

    t.not(dmc_session.session, undefined);
    t.not(dmc_session.session.content_id, undefined);
    t.not(dmc_session.session.content_type, undefined);
    t.not(dmc_session.session.content_src_id_sets, undefined);
    t.not(dmc_session.session.timing_constraint, undefined);
    t.not(dmc_session.session.keep_method, undefined);
    t.not(dmc_session.session.protocol, undefined);
    t.is(dmc_session.session.content_uri,"");
    t.not(dmc_session.session.session_operation_auth, undefined);
    t.not(dmc_session.session.content_auth, undefined);
    t.not(dmc_session.session.client_info, undefined);
    t.not(dmc_session.session.priority, undefined);
});

test("nico dmc session", async (t) => {
    getSessionMock(1);

    const nico_video = new NicoVideo(data_api_data);
    await nico_video.postDmcSession();

    t.is(nico_video.dmc_session.session.id, "12345678");
});

test("nico dmc session error", async (t) => {
    t.plan(2);

    nock("https://api.dmc.nico")
        .post("/api/sessions")
        .query({ _format: "json" })
        .reply(403, { meta: { status: 403, message: "403"} });

    const nico_video = new NicoVideo(data_api_data);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "ResponseError");
    }    
});

test("nico dmc session timeout", async (t) => {
    t.plan(2);

    getSessionMock(6000);

    const nico_video = new NicoVideo(data_api_data);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
    }    
});

test("nico dmc session cancel", async (t) => {
    t.plan(1);

    getSessionMock(3000);

    const nico_video = new NicoVideo(data_api_data);
    setTimeout(()=>{
        nico_video.cancel();
    }, 1000);
    
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("nico dmc heart beat", async (t) => {
    t.plan(2);

    getHBMock(1, 1);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));
    nico_video.stopHeartBeat();  

    t.is(hb_options_count, 1);
    t.is(hb_post_count, 3);
});

test("nico stop dmc heart beat", async (t) => {
    t.plan(2);

    getHBMock(1, 1);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 500));
    nico_video.stopHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(hb_options_count, 1);
    t.is(hb_post_count, 0);
});

test("stop by cancel dmc heart beat", async (t) => {
    t.plan(2);
    
    getHBMock(1, 1);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();
  
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 2000));
    nico_video.cancel();
    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(hb_options_count, 1);
    t.is(hb_post_count, 2);    
});

test("cancel dmc heart beat options", async (t) => {
    t.plan(2);

    getHBMock(3000, 1);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };

    setTimeout(()=>{
        nico_video.cancel();
    }, 1000);
    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.truthy(error.cancel); 
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(hb_post_count, 0);  
});

test("timeout dmc heart beat options", async (t) => {
    t.plan(3);

    getHBMock(6000, 1);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };

    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
        t.is(hb_post_count, 0);  
    }
});

test.cb("timeout dmc heart beat post",  (t) => {
    t.plan(4);

    getHBMock(1, 6000);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat();
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 10*1000;
    nico_video.postHeartBeat((error)=>{
        t.is(error.cancel, undefined);
        t.is(error.name, "RequestError");
        t.is(hb_options_count, 1);
        t.is(hb_post_count, 1); 
        t.end();           
    });
});