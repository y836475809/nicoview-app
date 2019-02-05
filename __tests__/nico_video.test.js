const test = require("ava");
const { NicoVideo } = require("../app/js/niconico");
const { NicoMocks, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

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
    nico_mocks.dmc_session();

    const nico_video = new NicoVideo(data_api_data);
    await nico_video.postDmcSession();

    t.is(nico_video.dmc_session.session.id, "12345678");
});

test("nico dmc session error", async (t) => {
    t.plan(2);

    nico_mocks.dmc_session_error();

    const nico_video = new NicoVideo(data_api_data);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
    }    
});

test("nico dmc session timeout", async (t) => {
    t.plan(2);

    nico_mocks.dmc_session(6000);

    const nico_video = new NicoVideo(data_api_data);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
    }    
});

test("nico dmc session cancel", async (t) => {
    t.plan(1);

    nico_mocks.dmc_session(3000);

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

    nico_mocks.dmc_hb();

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));
    nico_video.stopHeartBeat();  

    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 3);
});

test("nico stop dmc heart beat", async (t) => {
    t.plan(2);

    nico_mocks.dmc_hb();

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 500));
    nico_video.stopHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 0);
});

test("stop by cancel dmc heart beat", async (t) => {
    t.plan(3);
    
    nico_mocks.dmc_hb();

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();
  
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat((error=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 2);   

        t.truthy(error.cancel); 
    }));

    await new Promise(resolve => setTimeout(resolve, 2000));
    nico_video.cancel();
    await new Promise(resolve => setTimeout(resolve, 3000));
});


test("cancel dmc heart beat options", async (t) => {
    t.plan(2);

    nico_mocks.dmc_hb(3000);

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

    t.is(nico_mocks.hb_post_count, 0);  
});

test("timeout dmc heart beat options", async (t) => {
    t.plan(3);

    nico_mocks.dmc_hb(6000);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };

    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(nico_mocks.hb_post_count, 0);  
    }
});

test.cb("timeout dmc heart beat post",  (t) => {
    t.plan(4);

    nico_mocks.dmc_hb(1, 6000);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat();
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 10*1000;
    nico_video.postHeartBeat((error)=>{
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 1); 
        t.end();           
    });
});

test("stop by hb options error 403 dmc heart beat", async(t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_options_error(403);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0); 
        
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /403:/);        
    }
});

test("stop by hb options error 500 dmc heart beat", async(t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_options_error(500);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0); 
        
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /500:/);        
    }
});

test.cb("stop by hb post error 403 dmc heart beat", (t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_post_error(403);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat().then(()=>{});
  
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat((error=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 0); 
        
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /403:/);
        
        t.end();
    }));
});

test.cb("stop by hb post error 500 dmc heart beat", (t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_post_error(500);

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat().then(()=>{});
  
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat((error=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 0); 
        
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /500:/);
        
        t.end();
    }));
});