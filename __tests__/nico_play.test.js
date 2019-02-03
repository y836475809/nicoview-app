const test = require("ava");
const { NicoPlay } = require("../app/js/niconico_play");

const { NicoMocks, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

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

test("nico play", async (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay(heart_beat_rate);
    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state);   
    }).then((result)=>{
        // console.log("############ result=", result);
        t.not(result, undefined);
        
    }).catch(error => {
        console.log("############ error=", error);
    });

    await new Promise(resolve => setTimeout(resolve, 2200));
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);

    noco_play.stopHB();
});

test.cb("nico play cancel", (t) => {
    t.plan(1);

    nico_mocks.watch(3000);
    // nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    let state_log = "";
    // const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay();

    setTimeout(()=>{
        noco_play.cancel();
    },1000);

    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state); 
        state_log += state + ":";
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play cancel hb", (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    let state_log = "";
    const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay(heart_beat_rate);

    setTimeout(()=>{
        noco_play.cancel();
    },3000);

    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state); 
        state_log += state + ":";
    }, (error)=>{
        console.log("############ hb cancel error=", error); 
        t.is(state_log, 
            "start watch:finish watch:start comment:finish comment:start video:start HeartBeat:finish video:");

        t.truthy(error.cancel);

        t.end();
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
        // t.is(state_log, "start watch:");
    });     
});

// describe("nico play", () => {
//     const mock_server = new MockNicoServer();
//     const server_url = mock_server.serverUrl;
//     const proxy_url = mock_server.proxyUrl;

//     beforeAll(() => {
//         console.log("beforeAll");
//         mock_server.setupRouting();
//         mock_server.start();
//     });

//     afterAll(() => {
//         console.log("afterAll");
//         mock_server.stop();
//     });

//     // test("play pp", async (done) => {
//     //     expect.assertions(2);
//     //     mock_server.clearCount();
        

//     //     const myp = new pp(proxy_url);
//     //     const result = await myp.play((state)=>{
//     //         console.log("## state=", state);
//     //     }, (data)=>{
//     //         expect(data).not.toBeNull();
//     //     }, (hb_error)=>{

//     //     });
//     //     expect(result.state).toBe("done");

//     //     setTimeout(()=>{
//     //         myp.cancel();
//     //         done();
//     //     }, 2000);
//     // });

//     test("play pp cancel",  (done) => {
//         // expect.assertions(1);
//         // mock_server.clearCount();
//         // nock.cleanAll();
//         // nock.disableNetConnect();
//         // nock.enableNetConnect("localhost");
//         // nock(server_url)
//         //     .get(`/watch/${test_video_id}`)
//         //     .delay(3000)
//         //     .reply(200, getMockWatchHtml(test_video_id))
//         //     .post("/api.json/")
//         //     // .delay(11000)
//         //     .reply(200, res_comment_json)
//         //     .post("/api/sessions")
//         //     // .delay(11000)
//         //     .reply(200, {});

//         const myp = new pp(proxy_url);
//         myp.play((state)=>{
//             console.log("############ state=", state);
            
//         }).then((result)=>{
//             console.log("############ result=", result);
//             // expect(result.state).toBe("cancel");
//             // done();
//         }).catch(error => {
//             console.log("############ error=", error);
//         });
//         // myp.cancel();
//         // setTimeout(()=>{
//         //     myp.cancel();
//         //     // done();
//         // }, 1000);
//     });
//     // test("play pp cancel2", async (done) => {
//     //     expect.assertions(1);
//     //     mock_server.clearCount();

//     //     const myp = new pp(proxy_url);
//     //     myp.play((state)=>{
//     //         console.log("############ state=", state);
            
//     //     }, (data)=>{
//     //         expect(data).not.toBeNull();
//     //     }, (hb_error)=>{

//     //     }).then((result)=>{
//     //         expect(result.state).toBe("done");
//     //     });
//     //     setTimeout(()=>{
//     //         myp.cancel();
//     //         done();
//     //     }, 2000);
//     // });

//     // test("play", async (done) => {
//     //     expect.assertions(2);
//     //     mock_server.clearCount();

//     //     const nico_watch = new NicoWatch(proxy_url);
//     //     const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
//     //     httpsTohttp(api_data);
//     //     const nico_cookies = getCookies(cookie_jar);

//     //     const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);
//     //     const res_commnets = await nico_comment.getCommnet();
//     //     const thumb_info = getThumbInfo(api_data);        

//     //     const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
//     //     const smile_video_url = nico_video.SmileUrl;
//     //     await nico_video.postDmcSession();
//     //     const dmc_video_url = nico_video.DmcContentUri;
//     //     nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
//     //     nico_video.startHeartBeat((error)=>{});

//     //     setTimeout(()=>{
//     //         expect(mock_server.dmc_hb_options_count).toBe(1);
//     //         expect(mock_server.dmc_hb_post_count).toBe(3);
//     //         nico_video.stopHeartBeat();
//     //         done();
//     //     }, 3000);
//     // });    

// });