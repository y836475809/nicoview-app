const nock = require("nock");
const request = require("request");
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const httpProxy = require("http-proxy");
const http = require("http");
const { NicoNico, NicoCommnet } = require("../test/test-client");

/**
 * 
 * @param {string} url 
 */
const httpsTohttp = (url) => {
    return url.replace("https", "http");
};

describe("http", () => {
    let app = express();
    app.use(cookieParser());
    app.use(express.json());

    const port = 8084;
    const proxy_port = 3000;
    let server;
    let proxy = new httpProxy.createProxyServer();
    let proxyServer;

    beforeAll(() => {
        console.log("beforeAll");

        app.get("/watch/:videoid", (req, res) => {
            const video_id = req.params.videoid;

            res.cookie("nicohistory", `${video_id}:123456789`, { domain: ".nicovideo.jp", path: "/" });
            res.cookie("nicosid", "123456.789", { domain: ".nicovideo.jp", path: "/" });

            const file = fs.readFileSync(`${__dirname}/data/${video_id}.html`, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(file);
            res.end();
        });
        app.get("/smile", (req, res) => {
            const cookie = req.cookies;
            console.log("smile cookie=", cookie);
            if (cookie === undefined) {
                res.status(403).send("403");
                return;
            }            
            if (cookie.nicohistory === undefined) {
                res.status(403).send("403");
                return;
            }

            res.status(200).send("smile");
        });   
        app.post("/api/sessions", (req, res) => {
            console.log("sessions=", req.body); 
            res.status(200).send(req.body); 
        });      
        
        server = app.listen(port, () => {
            console.log("Expressサーバー起動");
        });

        proxyServer = http.createServer(function (req, res) {
            const mapping = {
                "www.nicovideo.jp": {
                    host: "localhost", port: port
                },
                "smile-cls20.sl.nicovideo.jp": {
                    host: "localhost", port: port
                },
                "smile-cls30.sl.nicovideo.jp": {
                    host: "localhost", port: port
                },
                "api.dmc.nico": {
                    host: "localhost", port: port
                }
            };

            let parser = document.createElement("a");
            parser.href = req.url;
            const target = mapping[parser.hostname];
            proxy.web(req, res, { target: target });
        });
        proxyServer.listen(proxy_port);
    });

    afterAll(() => {
        console.log("afterAll");
        server.close();
        proxyServer.close();
    });

    test("http req cookie", async () => {
        // jest.setTimeout(20000);
        // nock.cleanAll();
        // nock.disableNetConnect();
        // nock.enableNetConnect("localhost");
        // nock(`http://localhost:${port}`)
        //     .get("/watch/sm19961784")
        //     .delay(1000)
        //     .reply(200, "ok");
        // // .reply(200, (uri, requestBody) => {
        // //     console.log(requestBody);
        // //     return requestBody;
        // // });
        // // .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

        // expect.assertions(4);

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        const api_data = await niconico.watch("sm19961784");
        expect(niconico.getNicoHistory()).toEqual({
            name: "nicohistory",
            value: "sm19961784%3A123456789",
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

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        const api_data = await niconico.watch("sm19961784"); 
        const smile_url = api_data.video.smileInfo.url;
        const url = httpsTohttp(smile_url);

        const options1 = {
            url: url,
            method: "GET",
            timeout: 20 * 1000,
            proxy:`http://localhost:${proxy_port}`
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

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        const api_data = await niconico.watch("sm19961784"); 
        const cookieJar = niconico.cookieJar;
        const smile_url = api_data.video.smileInfo.url;
        const url = httpsTohttp(smile_url);

        const options2 = {
            url: url,
            method: "GET",
            timeout: 20 * 1000,
            proxy:`http://localhost:${proxy_port}`,
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
        expect.assertions(1);

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        const api_data = await niconico.watch("sm19961784"); 
        niconico.dmcInfo.session_api.urls[0].url = 
            httpsTohttp(niconico.dmcInfo.session_api.urls[0].url);
        const dmc_session = await niconico.postDmcSession();
        
    });

    test("http req cancel", (done) => {
        // jest.setTimeout(20000);
        nock.cleanAll();
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        nock(`http://localhost:${port}`)
            .get("/watch/sm19961784")
            .delay(1000)
            .reply(200, "ok");
        // // .reply(200, (uri, requestBody) => {
        // //     console.log(requestBody);
        // //     return requestBody;
        // // });
        // // .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

        expect.assertions(1);

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        return niconico.watch("sm19961784").then(b=>{
            console.log("done: ", b);
            done();
        }).catch((error)=>{
            // console.log("error");
            console.log("error name:", error.name);
            console.log("error message:", error.message);
            expect(error.name).toBe("TypeError");
            done();
        });
        
        // await expect(niconico.watch("sm19961784")).rejects.toThrow('error!');
        // const options = {
        //     url: "http://www.nicovideo.jp/watch/sm19961784",
        //     method: "GET",
        //     timeout: 20 * 1000,
        //     proxy:`http://localhost:${proxy_port}`
        // };
        // request(options, (err, response, body) => {
        //     console.log(body);
        //     // console.log("body");
        //     // expect(body).toBe("ok");
        //     done();
        // });
        
    });
});