const request = require("request");
const { NicoNico, NicoCommnet } = require("../test/test-client");
const { MockNicoServer, httpsTohttp } = require("./nico_mock");

const test_data_video_id = "sm12345678";

describe("http", () => {
    const mock_server = new MockNicoServer();
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

    test("nico cookie", async () => {
        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id);
        expect(niconico.getNicoHistory()).toEqual({
            url: "http://www.nicovideo.jp",
            name: "nicohistory",
            value: `${test_data_video_id}%3A123456789`,
            domain: "nicovideo.jp",
            path: "/",
            secure: false
        });

        expect(api_data.video).not.toBeNull();
        expect(api_data.commentComposite.threads).not.toBeNull();
        expect(niconico.dmcInfo.session_api).not.toBeNull();
    });

    test("nico smile error", async (done) => {
        expect.assertions(2);

        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id); 
        const smile_url = api_data.video.smileInfo.url;
        const url = httpsTohttp(smile_url);

        const options1 = {
            url: url,
            method: "GET",
            timeout: 20 * 1000,
            proxy:proxy_url
        };
        request(options1, (err, response, body) => {
            if(!err && response.statusCode==403){
                expect(response.statusCode).toBe(403);
                expect(body).toBe("403");
                done();
            }
        });
    });
    
    test("nico smile", async (done) => {
        expect.assertions(2);

        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id); 
        const cookieJar = niconico.cookieJar;
        const smile_url = api_data.video.smileInfo.url;
        const url = httpsTohttp(smile_url);

        const options2 = {
            url: url,
            method: "GET",
            timeout: 20 * 1000,
            proxy: proxy_url,
            jar: cookieJar
        };
        request(options2, (err, response, body) => {
            if(err){
                done();
            }else{
                expect(response.statusCode).toBe(200);
                expect(body).toBe("smile");
                done();
            }
        });
    });

    test("nico dmc session", async () => {
        expect.hasAssertions();

        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id); 
        niconico.dmcInfo.session_api.urls[0].url = 
            httpsTohttp(niconico.dmcInfo.session_api.urls[0].url);
        const dmc_session = await niconico.postDmcSession();
        expect(dmc_session.session).not.toBeNull();
    });

    test("nico dmc heart beat", async (done) => {
        // jest.setTimeout(20000);
        expect.assertions(3);
        mock_server.clearCount();

        const niconico = new NicoNico(undefined, proxy_url);
        await niconico.watch(test_data_video_id); 
        niconico.dmcInfo.session_api.urls[0].url = 
            httpsTohttp(niconico.dmcInfo.session_api.urls[0].url);
        const dmc_session = await niconico.postDmcSession();
        expect(dmc_session.session).not.toBeNull();

        niconico.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
        niconico.startHeartBeat((error)=>{});

        setTimeout(()=>{
            expect(mock_server.dmc_hb_options_count).toBe(1);
            expect(mock_server.dmc_hb_post_count).toBe(3);
            niconico.stopHeartBeat();
            done();
        }, 3000);
    });

    test("nico stop dmc heart beat", async (done) => {
        jest.setTimeout(20000);
        expect.assertions(3);
        mock_server.clearCount();

        const niconico = new NicoNico(undefined, proxy_url);
        await niconico.watch(test_data_video_id); 
        niconico.dmcInfo.session_api.urls[0].url = 
            httpsTohttp(niconico.dmcInfo.session_api.urls[0].url);
        const dmc_session = await niconico.postDmcSession();
        expect(dmc_session.session).not.toBeNull();

        niconico.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
        niconico.startHeartBeat((error)=>{});
        setTimeout(()=>{
            niconico.stopHeartBeat();
        }, 500);

        setTimeout(()=>{
            expect(mock_server.dmc_hb_options_count).toBe(1);
            expect(mock_server.dmc_hb_post_count).toBe(0);
            niconico.stopHeartBeat();
            done();
        }, 3000);
    });
});