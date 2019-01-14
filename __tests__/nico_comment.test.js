const nock = require("nock");
const { NicoWatch, NicoVideo,  NicoCommnet, getCookies } = require("../app/js/niconico");
const { MockNicoServer, httpsTohttp } = require("./nico_mock");
const res_comment_json = require("./data/res_no_owner_comment.json");

const test_video_id = "sm12345678";

describe("nico comment", () => {
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

    test("request param", async () => {
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

    test("request param inc rs,ps no", async () => {
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

    test("get comment", async () => {
        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);
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

    test("get comment illegal param", async () => {
        expect.hasAssertions();

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);

        try {
            await nico_comment._post({});
        } catch (error) {
            expect(error.statusCode).toBe(403);
        }
    });

    test("get comment timeout", async () => {
        expect.hasAssertions();
        nock(server_url)
            .post(`/watch/${test_video_id}`)
            .delay(11000)
            .reply(200, res_comment_json);

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);
 
        try {
            await nico_comment.getCommnet();
        } catch (error) {
            expect(error.name).toBe("RequestError");
            expect(error.message).toBe("Error: ESOCKETTIMEDOUT");
        }
    });

    test("get comment cancel", async (done) => {
        nock(server_url)
            .post(`/watch/${test_video_id}`)
            .delay(3000)
            .reply(200, res_comment_json);

        const nico_watch = new NicoWatch(proxy_url);
        const { cookie_jar, api_data } = await nico_watch.watch(test_video_id);
        httpsTohttp(api_data);
        const nico_comment = new NicoCommnet(cookie_jar, api_data, proxy_url);

        nico_comment.getCommnet().then(b=>{});

        setTimeout(()=>{
            nico_comment.cancel();
            done();
        }, 1000);
    });
});