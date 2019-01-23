const test = require("ava");
const nock = require("nock");
const { NicoWatch, NicoVideo,  NicoCommnet, getCookies, getThumbInfo } = require("../app/js/niconico");
const { MockNicoServer, MockNicoUitl, TestData } = require("./helper/nico_mock");

const mock_server = new MockNicoServer();
const server_url = mock_server.serverUrl;
const proxy = mock_server.proxy;

test.before(async t => {
    console.log("beforeAll");
    await mock_server.start();
    // prof_time.clear();
});

test.after(async t => {
    console.log("afterAll");
    await mock_server.stop();
    // prof_time.log(t);
});

class pp{
    constructor(proxy){
        this.proxy = proxy;
    }
    cancel(){
        if(this.nico_watch){
            console.log("############ cancel nico_watch");
            // this.is_canceled = true;
            this.nico_watch.cancel();
            console.log("############ canceled nico_watch");
        }
        if(this.nico_comment){
            console.log("############ cancel nico_comment");
            // this.is_canceled = true;
            this.nico_comment.cancel();
        }
        if(this.nico_video){
            console.log("############ cancel nico_video");
            // this.is_canceled = true;
            this.nico_video.cancel();
        }      
    }

    play(video_id, on_progress){
        return new Promise(async (resolve, reject) => {  
            try {
                on_progress("start watch");

                this.nico_watch = new NicoWatch(this.proxy);
                const { cookie_jar, api_data } = await this.nico_watch.watch(video_id); 


                on_progress("finish watch");
                MockNicoUitl.tohttp(api_data);
                // console.log("############ cookie_jar=", cookie_jar);
                // const nico_cookies = getCookies(cookie_jar);

                on_progress("start commnet");

                this.nico_comment = new NicoCommnet(cookie_jar, api_data, this.proxy);
                const res_commnets = await this.nico_comment.getCommnet();
                // if(this.is_canceled){
                //     console.log("############ cancel=2");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                on_progress("finish commnet");
                // const thumb_info = getThumbInfo(api_data);        

                on_progress("start video");
                this.nico_video = new NicoVideo(cookie_jar, api_data, this.proxy);
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

                const nico_cookies = getCookies(cookie_jar);
                const thumb_info = getThumbInfo(api_data); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                resolve({
                    nico_cookies: nico_cookies,
                    commnets: res_commnets,
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
    // expect.assertions(1);
    mock_server.clearCount();
    // nock.cleanAll();
    // nock.disableNetConnect();
    // nock.enableNetConnect("localhost");
    // nock(server_url)
    //     .get(`/watch/${TestData.video_id}`)
    //     .delay(3000)
    //     .reply(200, getMockWatchHtml(TestData.video_id))
    // //     .post("/api.json/")
    // //     // .delay(11000)
    // //     .reply(200, res_comment_json)
    // //     .post("/api/sessions")
    // //     // .delay(11000)
    // //     .reply(200, {});

    const myp = new pp(proxy);
    myp.play(TestData.video_id, (state)=>{
        console.log("############ state=", state);   
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
    });

    await new Promise(resolve => setTimeout(resolve, 2200));
    t.is(mock_server.dmc_hb_options_count, 1);
    t.is(mock_server.dmc_hb_post_count, 2);
    // // myp.cancel();
    // setTimeout(()=>{
    //     myp.cancel();
    //     // done();
    // }, 1000);
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