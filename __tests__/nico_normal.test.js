const request = require("request");
const { NicoWatch, NicoVideo,  NicoCommnet,
    getCookies } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp } = require("./nico_mock");

const test_video_id = "sm12345678";

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

    test("nico cookie api_data", async () => {
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

    test("nico smile error", async (done) => {
        expect.assertions(2);

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
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
    
    test("nico smile", async (done) => {
        expect.assertions(2);

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
        const smile_url = nico_video.SmileUrl;

        const options2 = {
            url: smile_url,
            method: "GET",
            timeout: 20 * 1000,
            proxy: proxy_url,
            jar: cookie_jar
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

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
        await nico_video.postDmcSession();

        expect(nico_video.dmc_session.session).not.toBeNull();
    });

    test("nico dmc heart beat", async (done) => {
        expect.assertions(2);
        mock_server.clearCount();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
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

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_video = new NicoVideo(cookie_jar, api_data, proxy_url);
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

    test("nico comment req param", async () => {
        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);

        {
            const commnet_json = nico_comment.makeJsonNoOwner(0, 0);
            expect(commnet_json.length).toBe(8);
            expect(commnet_json[0].ping.content).toBe("rs:0");
            expect(commnet_json[1].ping.content).toBe("ps:0");
            expect(commnet_json[2].thread.version).toBe("20090904");
            expect(commnet_json[3].ping.content).toBe("pf:0");
            expect(commnet_json[4].ping.content).toBe("ps:1");
            expect(commnet_json[5].thread_leaves).not.toBeNull();
            expect(commnet_json[6].ping.content).toBe("pf:1");
            expect(commnet_json[7].ping.content).toBe("rf:0");
        }
        {
            const commnet_json = nico_comment.makeJsonOwner(0, 0);
            expect(commnet_json.length).toBe(11);
            expect(commnet_json[0].ping.content).toBe("rs:0");
            expect(commnet_json[1].ping.content).toBe("ps:0");
            expect(commnet_json[2].thread.version).toBe("20061206");
            expect(commnet_json[3].ping.content).toBe("pf:0");
            expect(commnet_json[4].ping.content).toBe("ps:1");
            expect(commnet_json[5].thread.version).toBe("20090904");
            expect(commnet_json[6].ping.content).toBe("pf:1");
            expect(commnet_json[7].ping.content).toBe("ps:2");
            expect(commnet_json[8].thread_leaves).not.toBeNull();
            expect(commnet_json[9].ping.content).toBe("pf:2");
            expect(commnet_json[10].ping.content).toBe("rf:0");
        }
    });

    test("nico comment req param inc seq no", async () => {
        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);

        {
            const commnet_json = nico_comment._get_commnet_json();
            expect(commnet_json.length).toBe(8);
            expect(commnet_json[0].ping.content).toBe("rs:0");
            expect(commnet_json[1].ping.content).toBe("ps:0");
            expect(commnet_json[2].thread).not.toBeNull();
            expect(commnet_json[3].ping.content).toBe("pf:0");
            expect(commnet_json[4].ping.content).toBe("ps:1");
            expect(commnet_json[5].thread_leaves).not.toBeNull();
            expect(commnet_json[6].ping.content).toBe("pf:1");
            expect(commnet_json[7].ping.content).toBe("rf:0");
        }
        {
            const commnet_json = nico_comment._get_commnet_json();
            expect(commnet_json.length).toBe(8);
            expect(commnet_json[0].ping.content).toBe("rs:1");
            expect(commnet_json[1].ping.content).toBe("ps:8");
            expect(commnet_json[2].thread).not.toBeNull();
            expect(commnet_json[3].ping.content).toBe("pf:8");
            expect(commnet_json[4].ping.content).toBe("ps:9");
            expect(commnet_json[5].thread_leaves).not.toBeNull();
            expect(commnet_json[6].ping.content).toBe("pf:9");
            expect(commnet_json[7].ping.content).toBe("rf:1");
        }
        {
            const commnet_json = nico_comment._get_commnet_json();
            expect(commnet_json.length).toBe(8);
            expect(commnet_json[0].ping.content).toBe("rs:2");
            expect(commnet_json[1].ping.content).toBe("ps:16");
            expect(commnet_json[2].thread).not.toBeNull();
            expect(commnet_json[3].ping.content).toBe("pf:16");
            expect(commnet_json[4].ping.content).toBe("ps:17");
            expect(commnet_json[5].thread_leaves).not.toBeNull();
            expect(commnet_json[6].ping.content).toBe("pf:17");
            expect(commnet_json[7].ping.content).toBe("rf:2");
        }
    });

    test("nico comment", async () => {
        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);
        
        expect(nico_comment.hasOwnerComment()).toBe(false);

        const res_commnets = await nico_comment.getCommnet();
        expect(res_commnets.length).toBe(7);
        expect(res_commnets[0].ping).not.toBeNull();
        expect(res_commnets[1].ping).not.toBeNull();
        expect(res_commnets[2].thread).not.toBeNull();
        expect(res_commnets[3].leaf).not.toBeNull();
        expect(res_commnets[4].leaf).not.toBeNull();
        expect(res_commnets[5].chat).not.toBeNull();
        expect(res_commnets[6].chat).not.toBeNull();
    });
});