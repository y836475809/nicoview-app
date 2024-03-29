const test = require("ava");
const { NicoAPI, NicoVideo } = require("../src/lib/niconico");
const { NicoMocks, TestData } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const data_api_data = TestData.data_api_data;

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();
const mock_timeout = 121*1000;

const setHBLifetime = (nico_video, time_ms) => {
    const session = nico_video._nico_api._session;
    session.heartbeatLifetime = time_ms;
};

test.before(t => { // eslint-disable-line no-unused-vars
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);
    nico_mocks.clean();
});

test.beforeEach(t => {
    prof_time.start(t);
    nico_mocks.clean();
    
    const nico_api = new NicoAPI();
    nico_api.parse(data_api_data);
    t.context.nico_video = new NicoVideo(nico_api); 
});

test.afterEach(t => {
    prof_time.end(t);
});

test("nico dmc quality check", (t) => {
    const nico_video = t.context.nico_video;

    nico_video.dmc_session = TestData.dmc_session;
    t.truthy(nico_video.isDMCMaxQuality());
    
    nico_video.dmc_session = TestData.dmc_session_low;
    t.falsy(nico_video.isDMCMaxQuality());
});

test("nico session", t => {
    const nico_video = t.context.nico_video;
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

    const nico_video = t.context.nico_video;
    await nico_video.postDmcSession();

    t.is(nico_video.dmc_session.session.id, "12345678");
});

test("nico dmc session error", async (t) => {
    t.plan(2);

    nico_mocks.dmc_session_error();

    const nico_video = t.context.nico_video;
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
    }    
});

test("nico dmc session timeout", async (t) => {
    t.plan(2);

    nico_mocks.dmc_session(mock_timeout);

    const nico_video = t.context.nico_video;
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.regex(error.message, /timeout\s*:\s*https/i);
    }    
});

test("nico dmc session cancel", async (t) => {
    t.plan(1);

    nico_mocks.dmc_session(3000);

    const nico_video = t.context.nico_video;
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

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    setHBLifetime(nico_video, 1*1000);
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));
    nico_video.stopHeartBeat();  

    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 3);
});

test("nico stop dmc heart beat", async (t) => {
    t.plan(2);

    nico_mocks.dmc_hb();

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();

    setHBLifetime(nico_video, 1*1000);
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 500));
    nico_video.stopHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 0);
});

test("stop by cancel dmc heart beat", async (t) => {
    t.plan(3);
    
    nico_mocks.dmc_hb(1, 1*1000);

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();
  
    setHBLifetime(nico_video, 1*1000);
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

    const nico_video = t.context.nico_video;
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

    nico_mocks.dmc_hb(mock_timeout);

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };

    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.regex(error.message, /timeout\s*:\s*https/i);
        t.is(nico_mocks.hb_post_count, 0);  
    }
});

test("timeout dmc heart beat post",  async (t) => {
    t.plan(4);

    nico_mocks.dmc_hb(1, mock_timeout);

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat();
    setHBLifetime(nico_video, 1*1000);

    await new Promise(resolve => {
        nico_video.postHeartBeat((error)=>{
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.is(nico_mocks.hb_options_count, 1);
            t.is(nico_mocks.hb_post_count, 1); 
            resolve();           
        });
    });
});

test("stop by hb options error 403 dmc heart beat", async(t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_options_error(403);

    const nico_video = t.context.nico_video;
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

    const nico_video = t.context.nico_video;
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

test("stop by hb post error 403 dmc heart beat", async (t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_post_error(403);

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat().then(()=>{});
    setHBLifetime(nico_video, 1*1000);

    await new Promise(resolve => {
        nico_video.postHeartBeat((error=>{
            t.is(nico_mocks.hb_options_count, 1);
            t.is(nico_mocks.hb_post_count, 0); 
            
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.regex(error.message, /403:/);
            
            resolve();
        }));
    });
});

test("stop by hb post error 500 dmc heart beat", async (t) => {
    t.plan(5);
    
    nico_mocks.dmc_hb_post_error(500);

    const nico_video = t.context.nico_video;
    nico_video.dmc_session = { session: { id:"12345678" } };
    nico_video.optionsHeartBeat().then(()=>{});
    setHBLifetime(nico_video, 1*1000);

    await new Promise(resolve => {
        nico_video.postHeartBeat((error=>{
            t.is(nico_mocks.hb_options_count, 1);
            t.is(nico_mocks.hb_post_count, 0); 
            
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.regex(error.message, /500:/);
            
            resolve();
        }));
    });
});