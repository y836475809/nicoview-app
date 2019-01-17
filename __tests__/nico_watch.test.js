const nock = require("nock");
const { NicoWatch, NicoVideo,  NicoCommnet, getCookies } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp, getMockWatchHtml } = require("./nico_mock");

const test_video_id = "sm12345678";

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

        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
    });

    afterAll(async(done) => {
        console.log("afterAll");
        await mock_server.stop();
        setTimeout(done, 1000);
    });

    test("get cookie api_data", async () => {
        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        expect(getCookies(cookie_jar)).toEqual([
            {
                url: "http://www.nicovideo.jp",
                name: "nicohistory",
                value: `${test_video_id}%3A123456789`,
                domain: "nicovideo.jp",
                path: "/",
                secure: false
            },
            {
                url: "http://www.nicovideo.jp",
                name: "nicosid",
                value: "123456.789",
                domain: "nicovideo.jp",
                path: "/",
                secure: false
            }
        ]);

        expect(api_data.video).not.toBeNull();
        expect(api_data.commentComposite.threads).not.toBeNull();
        expect(api_data.video.dmcInfo.session_api).not.toBeNull();
    });

    test("get 404", async () => {
        expect.hasAssertions();
        nock.cleanAll();
        const nico_watch = new NicoWatch(proxy_url);
        try {
            await nico_watch.watch("ms00000000");
        } catch (error) {
            expect(error.status).toBe(404);
        }
    });

    test("watch error", async () => {
        expect.hasAssertions();
 
        // nock.cleanAll();
        // nock.disableNetConnect();
        // nock.enableNetConnect("localhost");
        nock(server_url)
            .get(`/watch/${test_video_id}`)
            // .delay(11000)
            .reply(200, 
                `<!DOCTYPE html>
                <html lang="ja">
                    <body>
                    <div id="js-initial-watch-data" data-api-data="dummy"
                    </body>
                </html>`);

        const nico_watch = new NicoWatch(proxy_url);
        try {
            await nico_watch.watch(test_video_id);
        } catch (error) {
            expect(error.error).not.toBeNull();
        }
    });

    test("watch timetout", async () => {
        jest.setTimeout(12000);
        expect.hasAssertions();

        // nock.cleanAll();
        // nock.disableNetConnect();
        // nock.enableNetConnect("localhost");
        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(11000)
            .reply(200, getMockWatchHtml(test_video_id));
            
        try {
            const nico_watch = new NicoWatch(proxy_url);
            await nico_watch.watch(test_video_id);
        } catch (error) {
            console.log("timetout then ##################");
            expect(error.code).toBe("ECONNABORTED");
            expect(error.message).toContain("timeout");
        }
    });

    test("watch cancel", (done) => { 
        expect.assertions(1);
        jest.useFakeTimers();

        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(15000)
            // .reply(200, "ok");
            .reply(200, getMockWatchHtml(test_video_id));
        
        const nico_watch = new NicoWatch(proxy_url);
        nico_watch.watch(test_video_id, (msg)=>{
            console.log("msg ##################", msg);
            expect(msg).toBe("watch cancel");   
            done(); 
        }).catch((error)=>{
            console.log("error ##################", error);
        }).then((b)=>{
            console.log("()then ##################");
            // done();
        });
        setTimeout(()=>{
            console.log("then ##################");
            nico_watch.cancel();
            // done();
        }, 1000);
        jest.runOnlyPendingTimers();
    });
});