const request = require("request");
const { NicoWatch, NicoVideo } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp } = require("./nico_mock");
const mock_data_api_data = require("./data/sm12345678_data_api_data.json");

const test_video_id = "sm12345678";

describe("nico video", () => {
    const mock_server = new MockNicoServer();
    const proxy_url = mock_server.proxyUrl;

    const mock_cookie_jar = request.jar();
    mock_cookie_jar.setCookie(`nicohistory=${test_video_id}%3A123456789; Domain=nicovideo.jp`, "http://nicovideo.jp");
    mock_cookie_jar.setCookie("nicosid=123456.789; Domain=nicovideo.jp", "http://nicovideo.jp");

    beforeAll(() => {
        console.log("beforeAll");
        mock_server.setupRouting();
        mock_server.start();
    });

    afterAll(() => {
        console.log("afterAll");
        mock_server.stop();
    });

    test("nico smile error", async (done) => {
        expect.assertions(2);

        httpsTohttp(mock_data_api_data);
        const nico_video = new NicoVideo(mock_cookie_jar, mock_data_api_data, proxy_url);
        const smile_url = nico_video.SmileUrl;

        const options1 = {
            url: smile_url,
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
    
    test("nico smile", (done) => {
        expect.assertions(2);

        httpsTohttp(mock_data_api_data);
        const nico_video = new NicoVideo(mock_cookie_jar, mock_data_api_data, proxy_url);
        const smile_url = nico_video.SmileUrl;

        const options2 = {
            url: smile_url,
            method: "GET",
            timeout: 20 * 1000,
            proxy: proxy_url,
            jar: mock_cookie_jar
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

        httpsTohttp(mock_data_api_data);
        const nico_video = new NicoVideo(mock_cookie_jar, mock_data_api_data, proxy_url);
        await nico_video.postDmcSession();

        expect(nico_video.dmc_session.session).not.toBeNull();
    });

    test("nico dmc heart beat", async (done) => {
        expect.assertions(2);
        mock_server.clearCount();

        httpsTohttp(mock_data_api_data);
        const nico_video = new NicoVideo(mock_cookie_jar, mock_data_api_data, proxy_url);
        await nico_video.postDmcSession();
        nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
        nico_video.startHeartBeat((error)=>{});

        setTimeout(()=>{
            expect(mock_server.dmc_hb_options_count).toBe(1);
            expect(mock_server.dmc_hb_post_count).toBe(3);
            nico_video.stopHeartBeat();
            done();
        }, 3000);
    });

    test("nico stop dmc heart beat", async (done) => {
        jest.setTimeout(20000);
        expect.assertions(2);
        mock_server.clearCount();

        httpsTohttp(mock_data_api_data);
        const nico_video = new NicoVideo(mock_cookie_jar, mock_data_api_data, proxy_url);
        await nico_video.postDmcSession();
        nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
        nico_video.startHeartBeat((error)=>{});
        setTimeout(()=>{
            nico_video.stopHeartBeat();
        }, 500);

        setTimeout(()=>{
            expect(mock_server.dmc_hb_options_count).toBe(1);
            expect(mock_server.dmc_hb_post_count).toBe(0);
            nico_video.stopHeartBeat();
            done();
        }, 3000);
    });
});