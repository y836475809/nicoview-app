const test = require("ava");
const nock = require("nock");
const { NicoWatch, NicoVideo, NicoComment, getCookies, getThumbInfo } = require("../app/js/niconico");
const { MockNicoUitl, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const no_owner_comment = TestData.no_owner_comment;
const owner_comment = TestData.owner_comment;

const prof_time = new ProfTime();

const nico_watch_mock = nock("http://www.nicovideo.jp");
const nico_nmsg_mock = nock("http://nmsg.nicovideo.jp");
const nico_session_mock = nock("https://api.dmc.nico");
const nico_hb_mock = nock("https://api.dmc.nico");
let hb_options_count = 0;
let hb_post_count = 0;

test.before(t => {
    prof_time.clear();
});

test.after(t => {
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

const getWatchMock = (delay, body) =>{
    const headers = {
        "Set-Cookie": `nicohistory=${TestData.video_id}%3A123456789; path=/; domain=.nicovideo.jp`
    };
    if(!body){
        body = MockNicoUitl.getWatchHtml(TestData.video_id);
    }
    nico_watch_mock
        .get(`/watch/${TestData.video_id}`)
        .delay(delay)
        .reply(200, body, headers);
};

const getNmsgMock = (delay) =>{
    nico_nmsg_mock
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

            return [200, [
                { "ping": { "content": "rs:0" } },
                { "ping": { "content": "rf:0" } }
            ]]; 
        });
};

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

    getWatchMock(1);
    getNmsgMock(1);
    getSessionMock(1);
    getHBMock(1, 1);

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
    t.is(hb_options_count, 1);
    t.is(hb_post_count, 2);
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