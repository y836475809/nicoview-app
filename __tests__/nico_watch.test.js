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

    beforeAll(() => {
        console.log("beforeAll");
        mock_server.setupRouting();
        mock_server.start();
    });

    afterAll(() => {
        console.log("afterAll");
        mock_server.stop();
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
        const nico_watch = new NicoWatch(proxy_url);
        try {
            await nico_watch.watch("ms00000000");
        } catch (error) {
            expect(error.status).toBe(404);
        }
    });

    test("watch timetout", async () => {
        jest.setTimeout(20000);
        
        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");

        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(11000)
            .reply(200, getMockWatchHtml(test_video_id));

        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        try {
            await nico_watch.watch(test_video_id);
        } catch (error) {
            expect(error.name).toBe("RequestError");
            expect(error.message).toBe("Error: ESOCKETTIMEDOUT");
        }
    });

    test("watch cancel", (done) => { 
        expect.assertions(1);

        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");

        nock(server_url)
            .get(`/watch/${test_video_id}`)
            .delay(30000)
            .reply(200, "ok");
        
        const nico_watch = new NicoWatch(proxy_url);
        nico_watch.watch(test_video_id, (msg)=>{
            expect(msg).toBe("watch cancel");
            done();
        }).then(b=>{});

        setTimeout(()=>{
            nico_watch.cancel();
            // done();
        }, 1000);
        

    });
});