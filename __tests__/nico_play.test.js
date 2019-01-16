const nock = require("nock");
const { NicoWatch, NicoVideo,  NicoCommnet, getCookies, getThumbInfo } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp, getMockWatchHtml } = require("./nico_mock");

const res_comment_json = require("./data/res_no_owner_comment.json");
const test_video_id = "sm12345678";


class pp{
    constructor(proxy_url){
        this.proxy_url = proxy_url;
        this.is_canceled = false;
    }
    cancel(){
        console.log("############ cancel=");
        this.is_canceled = true;
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
    play(on_progress, on_data, on_hb_error){
        return new Promise(async (resolve, reject) => {
            on_progress("start watch");
            if(this.is_canceled){
                resolve({ state:"cancel" });
                return;               
            }
            try {
                this.nico_watch = new NicoWatch(this.proxy_url);
                const { cookie_jar, api_data } = await this.nico_watch.watch(test_video_id); 
                // let cookie_jar;
                // let api_data;
                // this.nico_watch.watch(test_video_id)
                //     .then((data)=>{
                //         console.log("############ cancel=0");
                //         cookie_jar = data.cookie_jar;
                //         api_data = data.api_data;
                //         if(this.is_canceled){
                //             console.log("############ cancel=1");
                //             resolve({ state:"cancel" });
                //             return;
                //         }

                //         resolve({ state:"done" });
                //         return;
                //     });       
                console.log("1############ cancel=1");
                if(this.is_canceled){
                    console.log("############ cancel=1");
                    resolve({ state:"cancel" });
                    return;
                }

                // on_progress("finish watch");
                // httpsTohttp(api_data);
                // console.log("############ cookie_jar=", cookie_jar);
                // const nico_cookies = getCookies(cookie_jar);

                // on_progress("start commnet");

                // this.nico_comment = new NicoCommnet(cookie_jar, api_data, this.proxy_url);
                // const res_commnets = await this.nico_comment.getCommnet();
                // if(this.is_canceled){
                //     console.log("############ cancel=2");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                // on_progress("finish commnet");
                // const thumb_info = getThumbInfo(api_data);        

                // this.nico_video = new NicoVideo(cookie_jar, api_data, this.proxy_url);
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
                // await this.nico_video.postDmcSession();
                // if(this.is_canceled){
                //     console.log("############ cancel=3");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                // on_progress("finish dmc session");
                // const dmc_video_url = this.nico_video.DmcContentUri;
                // on_data({
                //     nico_cookies: nico_cookies,
                //     commnets: res_commnets,
                //     thumb_info: thumb_info,
                //     video_url: dmc_video_url
                // });
                // on_progress("start dmc hb");
                // this.nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
                // this.nico_video.startHeartBeat((error)=>{
                //     this.nico_video.stopHeartBeat();
                //     on_hb_error(error);
                // });
                // resolve({ state:"done" });
                                
            } catch (error) {
                console.log("############ err=1");
                reject(error);
            }
        });      
    }
}

describe("nico play", () => {
    const mock_server = new MockNicoServer();
    const server_url = mock_server.serverUrl;
    const proxy_url = mock_server.proxyUrl;

    beforeAll(() => {
        console.log("beforeAll");
        mock_server.setupRouting();
        mock_server.start();
    });

    afterAll(() => {
        console.log("afterAll");
        mock_server.stop();
    });

    // test("play pp", async (done) => {
    //     expect.assertions(2);
    //     mock_server.clearCount();
        

    //     const myp = new pp(proxy_url);
    //     const result = await myp.play((state)=>{
    //         console.log("## state=", state);
    //     }, (data)=>{
    //         expect(data).not.toBeNull();
    //     }, (hb_error)=>{

    //     });
    //     expect(result.state).toBe("done");

    //     setTimeout(()=>{
    //         myp.cancel();
    //         done();
    //     }, 2000);
    // });

    test("play pp cancel",  (done) => {
        expect.assertions(1);
        mock_server.clearCount();
        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(3000)
            .reply(200, getMockWatchHtml(test_video_id))
        //     .post("/api.json/")
        //     // .delay(11000)
        //     .reply(200, res_comment_json)
        //     .post("/api/sessions")
        //     // .delay(11000)
        //     .reply(200, {});

        const myp = new pp(proxy_url);
        myp.play((state)=>{
            console.log("############ state=", state);
            
        }, (data)=>{
            expect(data).not.toBeNull();
        }, (hb_error)=>{

        }).then((result)=>{
            console.log("############ result=", result);
            expect(result.state).toBe("cancel");
            done();
        });
        // myp.cancel();
        setTimeout(()=>{
            myp.cancel();
            // done();
        }, 1000);
    });
    // test("play pp cancel2", async (done) => {
    //     expect.assertions(1);
    //     mock_server.clearCount();

    //     const myp = new pp(proxy_url);
    //     myp.play((state)=>{
    //         console.log("############ state=", state);
            
    //     }, (data)=>{
    //         expect(data).not.toBeNull();
    //     }, (hb_error)=>{

    //     }).then((result)=>{
    //         expect(result.state).toBe("done");
    //     });
    //     setTimeout(()=>{
    //         myp.cancel();
    //         done();
    //     }, 2000);
    // });

    // test("play", async (done) => {
    //     expect.assertions(2);
    //     mock_server.clearCount();

    //     const nico_watch = new NicoWatch(proxy_url);
    //     const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
    //     httpsTohttp(api_data);
    //     const nico_cookies = getCookies(cookie_jar);

    //     const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);
    //     const res_commnets = await nico_comment.getCommnet();
    //     const thumb_info = getThumbInfo(api_data);        

    //     const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
    //     const smile_video_url = nico_video.SmileUrl;
    //     await nico_video.postDmcSession();
    //     const dmc_video_url = nico_video.DmcContentUri;
    //     nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
    //     nico_video.startHeartBeat((error)=>{});

    //     setTimeout(()=>{
    //         expect(mock_server.dmc_hb_options_count).toBe(1);
    //         expect(mock_server.dmc_hb_post_count).toBe(3);
    //         nico_video.stopHeartBeat();
    //         done();
    //     }, 3000);
    // });    

});