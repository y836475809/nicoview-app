const test = require("ava");
const { NicoWatch, NicoVideo, NicoComment, getCookies, getThumbInfo } = require("../app/js/niconico");
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

class pp{
    constructor(){
    }

    cancel(){
        if(this.nico_watch){
            console.log("############ cancel nico_watch");
            this.nico_watch.cancel();
        }
        if(this.nico_comment){
            console.log("############ cancel nico_comment");
            this.nico_comment.cancel();
        }
        if(this.nico_video){
            console.log("############ cancel nico_video");
            this.nico_video.cancel();
        }      
    }

    play(video_id, on_progress){
        return new Promise(async (resolve, reject) => {  
            try {
                on_progress("start watch");

                this.nico_watch = new NicoWatch();
                const { cookies, api_data } = await this.nico_watch.watch(video_id); 

                on_progress("finish watch");
                // MockNicoUitl.tohttp(api_data);
                // console.log("############ cookie_jar=", cookie_jar);
                // const nico_cookies = getCookies(cookie_jar);

                on_progress("start comment");

                this.nico_comment = new NicoComment(api_data);
                const res_comments = await this.nico_comment.getComment();
                // if(this.is_canceled){
                //     console.log("############ cancel=2");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                on_progress("finish comment");
                // const thumb_info = getThumbInfo(api_data);        

                on_progress("start video");
                this.nico_video = new NicoVideo(api_data);
                // const smile_video_url = this.nico_video.SmileUrl;

                // if(!this.nico_video.isDmc())
                // {
                //     on_progress("finish smile");
                //     on_data({
                //         nico_cookies: nico_cookies,
                //         commnets: res_commnets,
                //         thumb_info: thumb_info,
                //         video_url: smile_video_url
                //     });
                //     resolve({ state:"done" });
                //     return;                    
                // }
                
                // on_progress("start dmc session");
                await this.nico_video.postDmcSession();
                await this.nico_video.optionsHeartBeat();

                this.nico_video.dmcInfo.session_api.heartbeat_lifetime = 1000;
                on_progress("start HeartBeat");
                this.nico_video.postHeartBeat();
                // if(this.is_canceled){
                //     console.log("############ cancel=3");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                on_progress("finish video");

                const nico_cookies = getCookies(cookies);
                const thumb_info = getThumbInfo(api_data); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                resolve({
                    nico_cookies: nico_cookies,
                    comments: res_comments,
                    thumb_info: thumb_info,
                    video_url: dmc_video_url
                });
                // on_progress("start dmc hb");
                // this.nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
                // this.nico_video.startHeartBeat((error)=>{
                //     this.nico_video.stopHeartBeat();
                //     on_hb_error(error);
                // });                                
            } catch (error) {
                console.log("############ err=1");
                reject(error);
            }
        });      
    }
}

test("play pp", async (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const myp = new pp();
    myp.play(TestData.video_id, (state)=>{
        console.log("############ state=", state);   
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
    });

    await new Promise(resolve => setTimeout(resolve, 2200));
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);
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