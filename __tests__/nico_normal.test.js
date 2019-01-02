const nock = require("nock");
const request = require("request");
const { NicoNico, NicoCommnet } = require("../test/test-client");
const { MockNicoServer, httpsTohttp } = require("./nico_mock");

const test_data_video_id = "sm12345678";

describe("http", () => {
    const mock_server = new MockNicoServer();
    const mock_server_url = mock_server.serverUrl;
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

    test("http req cookie", async () => {
        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id);
        expect(niconico.getNicoHistory()).toEqual({
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

    test("http req smile", async (done) => {
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
            if(err){
                done();
            }else{
                expect(response.statusCode).toBe(403);
                expect(body).toBe("403");
                done();
            }
        });
    });
    test("http req smile2", async (done) => {
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

    test("http session", async () => {
        expect.hasAssertions();

        const niconico = new NicoNico(undefined, proxy_url);
        const api_data = await niconico.watch(test_data_video_id); 
        niconico.dmcInfo.session_api.urls[0].url = 
            httpsTohttp(niconico.dmcInfo.session_api.urls[0].url);
        const dmc_session = await niconico.postDmcSession();
        expect(dmc_session.session).not.toBeNull();
    });

    test("http req cancel", (done) => {
        // jest.setTimeout(20000);
        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        nock(mock_server_url)
            .get(`/watch/${test_data_video_id}`)
            .delay(1000)
            .reply(200, "ok");
        // // .reply(200, (uri, requestBody) => {
        // //     console.log(requestBody);
        // //     return requestBody;
        // // });
        // // .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

        expect.assertions(1);

        const niconico = new NicoNico(undefined, proxy_url);
        return niconico.watch(test_data_video_id).then(b=>{
            done();
        }).catch((error)=>{
            expect(error.name).toBe("TypeError");
            done();
        });
    });
});