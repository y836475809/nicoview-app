const test = require("ava");
const MockAdapter  = require("axios-mock-adapter");
const { client, NicoVideo } = require("../app/js/niconico");
const { TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const data_api_data = TestData.data_api_data;
const dmc_session_url = "https://api.dmc.nico/api/sessions?_format=json";
const reg_dmc_hb_url = new RegExp("https:\\/\\/api.dmc.nico\\/api\\/sessions/.+\\?_format=json&_method=PUT");

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
    mockAxios = new MockAdapter(client);
});

test.afterEach(t => {
    prof_time.end(t);
});

test("nico smile", t => {
    const nico_video = new NicoVideo(data_api_data);

    t.truthy(nico_video.isDmc());
    t.regex(nico_video.SmileUrl, /https:\/\/smile-cls\d\d.sl.nicovideo.jp\/smile\?m=\d+\.\d+low/);
});

test("nico session", async (t) => {
    const nico_video = new NicoVideo(data_api_data);
    const dmc_session =  nico_video.DmcSession;

    t.not(dmc_session.session, undefined);
    t.not(dmc_session.session.content_id, undefined);
    t.not(dmc_session.session.content_type, undefined);
    t.not(dmc_session.session.content_src_id_sets, undefined);
    t.not(dmc_session.session.timing_constraint, undefined);
    t.not(dmc_session.session.keep_method, undefined);
    t.not(dmc_session.session.protocol, undefined);
    t.is(dmc_session.session.content_uri,"")
    t.not(dmc_session.session.session_operation_auth, undefined);
    t.not(dmc_session.session.content_auth, undefined);
    t.not(dmc_session.session.client_info, undefined);
    t.not(dmc_session.session.priority, undefined);
});

test("nico post dmc session", async (t) => {
    mockAxios.onPost(dmc_session_url)
        .reply(200, {
            meta: {
                status: 201,
                message: "created"
            },
            data: { session: { id:"12345678" } }
        });

    const nico_video = new NicoVideo(data_api_data);
    await nico_video.postDmcSession();

    t.is(nico_video.dmc_session.session.id, "12345678");
});

test("nico post dmc session error", async (t) => {
    t.plan(2);

    mockAxios.onPost(dmc_session_url)
        .reply(403, {
            meta: {
                status: 403,
                message: "fault 403"
            }
        });

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

    mockAxios.onPost(dmc_session_url)
        .timeout();

    const nico_video = new NicoVideo(data_api_data);
    try {
        await nico_video.postDmcSession();
    } catch (error) {
        t.is(error.cancel, undefined);
        t.regex(error.name, /Error/);
    }    
});

test("nico dmc session cancel", async (t) => {
    t.plan(1);

    const mockAxios = new MockAdapter(client, { delayResponse: 3000 });
    mockAxios.onPost(dmc_session_url)
        .reply(200, {
            meta: {
                status: 201,
                message: "created"
            },
            data: { session: { id:"12345678" } }
        });

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
    let hb_options_count = 0;
    let hb_post_count = 0;
    mockAxios
        .onOptions(reg_dmc_hb_url)
        .reply((config) => {
            hb_options_count++;
            return [200, "ok"];
        })
        .onPost(reg_dmc_hb_url)
        .reply((config) => {
            hb_post_count++;
            return [200, "ok"];
        });
    
    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session =  { session: { id:"12345678" } };
    await nico_video.optionsHeartBeat();
    
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 3000));

    nico_video.stopHeartBeat();  
    t.is(hb_options_count, 1);
    t.is(hb_post_count, 3);
});

test("nico stop dmc heart beat", async (t) => {
    let hb_options_count = 0;
    let hb_post_count = 0;
    mockAxios
        .onOptions(reg_dmc_hb_url)
        .reply((config) => {
            hb_options_count++;
            return [200, "ok"];
        })
        .onPost(reg_dmc_hb_url)
        .reply((config) => {
            hb_post_count++;
            return [200, "ok"];
        });

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session =  { session: { id:"12345678" } };
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
    let hb_options_count = 0;
    let hb_post_count = 0;
    mockAxios
        .onOptions(reg_dmc_hb_url)
        .reply((config) => {
            hb_options_count++;
            return [200, "ok"];
        })
        .onPost(reg_dmc_hb_url)
        .reply((config) => {
            hb_post_count++;
            return [200, "ok"];
        });

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session =  { session: { id:"12345678" } };
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

    let hb_options_count = 0;
    mockAxios
        .onOptions(reg_dmc_hb_url)
        .reply((config) => {
            
            return new Promise((resolve , reject) => {
                setTimeout(()=>{
                    console.log("###############config=",config);
                    hb_options_count++;
                    resolve([200, "ok"]);
                }, 5000);
            });
        });

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session =  { session: { id:"12345678" } };
    // nico_video.optionsHeartBeat()
    //     .then((session)=>{

    //     }).catch(error=>{
    //         t.truthy(error.cancel); 
    //     });
    // nico_video.cancel();
    setTimeout(()=>{
        nico_video.cancel();
    }, 1000);
    try {
        await nico_video.optionsHeartBeat();
    } catch (error) {
        console.log("###############error=",error);
        t.truthy(error.cancel); 
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(hb_options_count, 0);
});

test("cancel dmc heart beat post", async (t) => {
    let hb_post_count = 0;
    mockAxios
        .onPost(reg_dmc_hb_url)
        .reply(async (config) => {      
            hb_post_count++;
            return [200, "ok"];
        });

    const nico_video = new NicoVideo(data_api_data);
    nico_video.dmc_session =  { session: { id:"12345678" } };
    nico_video.dmcInfo.session_api.heartbeat_lifetime = 2*1000;
    nico_video.postHeartBeat();

    await new Promise(resolve => setTimeout(resolve, 1000));
    nico_video.cancel();
    await new Promise(resolve => setTimeout(resolve, 3000));

    t.is(hb_post_count, 0);    
});