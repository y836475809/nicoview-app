const nock = require("nock");
const request = require("request");
const express = require("express");
const fs = require("fs");
const httpProxy = require("http-proxy");
const http = require("http");
const { NicoNico, NicoCommnet } = require("../test/test-client");


describe("http", () => {
    let app = express();
    const port = 8084;
    const proxy_port = 3000;
    let server;
    let proxy = new httpProxy.createProxyServer();
    let proxyServer;

    beforeAll(() => {
        console.log("beforeAll");

        app.get("/watch/:videoid", (req, res) => {
            const video_id = req.params.videoid;

            res.cookie("nicohistory", `${video_id}%123456789`, { domain: ".nicovideo.jp", path: "/" });
            res.cookie("nicosid", "123456.789", { domain: ".nicovideo.jp", path: "/" });

            const file = fs.readFileSync(`${__dirname}/data/${video_id}.html`, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(file);
            res.end();
        });
        server = app.listen(port, () => {
            console.log("Expressサーバー起動");
        });

        proxyServer = http.createServer(function (req, res) {
            const mapping = {
                "www.nicovideo.jp": {
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

        expect.assertions(1);

        const niconico = new NicoNico(undefined, `http://localhost:${proxy_port}`);
        const ret = await niconico.watch("sm19961784");
        expect(niconico.getNicoHistory()).toEqual({
            name: "nicohistory",
            value: "sm19961784%123456789",
            domain: ".nicovideo.jp",
            path: "/",
            secure: false
        });
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