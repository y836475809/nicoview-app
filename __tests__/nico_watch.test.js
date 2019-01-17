const nock = require("nock");
const { NicoWatch, NicoVideo,  NicoCommnet, getCookies } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp, getMockWatchHtml } = require("./nico_mock");

const test_video_id = "sm12345678";

const flushPromises = (sec) => {
    return new Promise(resolve => {
        const t1 = new Date().getTime(); 
        let t2 = new Date().getTime(); 
        
        while( t2 < t1 + 1000 * sec ){ 
            t2 = new Date().getTime();
        
        }
        resolve();
    });
};

describe("nico watch", () => {
    const mock_server = new MockNicoServer();
    const server_url = mock_server.serverUrl;
    // const proxy_url = mock_server.proxyUrl;
    const proxy_url = {
        host: "localhost",
        port : 3000
    };

    beforeAll(async () => {
        // global.Promise = require.requireActual('promise');
        console.log("beforeAll");
        //mock_server.setupRouting();
        await mock_server.start();
    });

    afterAll(async(done) => {
        console.log("afterAll");
        await mock_server.stop();
        setTimeout(done, 1000);
    });

    // test("get cookie api_data", async () => {
    //     const nico_watch = new NicoWatch(proxy_url);
    //     const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
    //     expect(getCookies(cookie_jar)).toEqual([
    //         {
    //             url: "http://www.nicovideo.jp",
    //             name: "nicohistory",
    //             value: `${test_video_id}%3A123456789`,
    //             domain: "nicovideo.jp",
    //             path: "/",
    //             secure: false
    //         },
    //         {
    //             url: "http://www.nicovideo.jp",
    //             name: "nicosid",
    //             value: "123456.789",
    //             domain: "nicovideo.jp",
    //             path: "/",
    //             secure: false
    //         }
    //     ]);

    //     expect(api_data.video).not.toBeNull();
    //     expect(api_data.commentComposite.threads).not.toBeNull();
    //     expect(api_data.video.dmcInfo.session_api).not.toBeNull();
    // });

    // test("get 404", async () => {
    //     expect.hasAssertions();
    //     const nico_watch = new NicoWatch(proxy_url);
    //     try {
    //         await nico_watch.watch("ms00000000");
    //     } catch (error) {
    //         expect(error.status).toBe(404);
    //     }
    // });

    // test("watch error", async () => {
    //     expect.hasAssertions();
 
    //     nock.cleanAll();
    //     nock.disableNetConnect();
    //     nock.enableNetConnect("localhost");
    //     nock(server_url)
    //         .get(`/watch/${test_video_id}`)
    //         // .delay(11000)
    //         .reply(200, 
    //             `<!DOCTYPE html>
    //             <html lang="ja">
    //                 <body>
    //                 <div id="js-initial-watch-data" data-api-data="dummy"
    //                 </body>
    //             </html>`);

    //     const nico_watch = new NicoWatch(proxy_url);
    //     try {
    //         await nico_watch.watch(test_video_id);
    //     } catch (error) {
    //         expect(error.error).not.toBeNull();
    //     }
    // });

    // test("watch timetout", async () => {
    //     jest.setTimeout(20000);
    //     expect.hasAssertions();

    //     nock.cleanAll();
    //     nock.disableNetConnect();
    //     nock.enableNetConnect("localhost");
    //     nock(server_url)
    //         .get(`/watch/${test_video_id}`)
    //         .delay(11000)
    //         .reply(200, getMockWatchHtml(test_video_id));

    //     const nico_watch = new NicoWatch(proxy_url);
    //     try {
    //         await nico_watch.watch(test_video_id);
    //     } catch (error) {
    //         expect(error.code).toBe("ECONNABORTED");
    //         expect(error.message).toContain("timeout");
    //     }
    // });

    test("watch cancel", async(done) => { 
        expect.assertions(1);
        jest.setTimeout(20000);
        jest.useRealTimers();
        // jest.useFakeTimers();

        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(5000)
            // .reply(200, "ok");
            .reply(200, getMockWatchHtml(test_video_id));
        
        let nico_watch = new NicoWatch(proxy_url);
        // setTimeout(()=>{
        //     console.log("then ##################");
        //     nico_watch.cancel();
        //     // done();
        // }, 500);
        // setTimeout(()=>{
        //     console.log("then ##################");
        //     // nico_watch.cancel();
        //     done();
        // }, 6000);

        nico_watch.watch(test_video_id, (msg)=>{
            console.log("msg ##################", msg);
            expect(msg).toBe("watch cancel");   
            // done(); 
        }).catch((error)=>{
            console.log("error ##################", error);
        }).then((b)=>{
            console.log("()then ##################");
            done();
        });
        // setTimeout(()=>{
        //     console.log("then ##################");
        //     nico_watch.cancel();
        //     // done();
        // }, 1000);
        // const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
        // await waitFor(500);
        // await new Promise(resolve => {
        //     setTimeout(resolve, 500);
        //   });
        // nico_watch.cancel();
        // console.log("()then ################## ", new Date());
        // for (let index = 0; index < 100000000000; index++) {
        //     // const element = array[index];
        //     let m=0;
        // }
        // console.log("()then ################## ", new Date());
        console.log("()then ################## ", new Date());
        await flushPromises(2);
        // // await flushPromises();
        // // await flushPromises();
        console.log("()then ################## ", new Date());

        // await new Promise(resolve => setTimeout(resolve, 1000));
        nico_watch.cancel();
        // try {
        //     await nico_watch.watch(test_video_id, async (msg)=>{
        //         console.log("##################")
        //         expect(msg).toBe("watch cancel");
        //         // done();
        //     });          
        // } catch (error) {
        //     console.log("################## error=", error)
        //     done();
        // }

        
        // done();
    });
});