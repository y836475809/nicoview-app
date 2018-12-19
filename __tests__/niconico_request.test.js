const nock = require("nock");
const request = require("request");
const express = require("express");
const fs = require("fs");
const { NicoNico, NicoCommnet } = require("../test/test-client");


describe("http", () => {
    const port = 8084;
    let server;

    beforeAll(() => {
        console.log("beforeAll");

        const app = express();
        app.get("/watch/:videoid", (req, res) => {
            const video_id = req.params.videoid;
            const file = fs.readFileSync(`${__dirname}/data/${video_id}.html`, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(file);
            res.end();
        });
        server = app.listen(port, () => {
            console.log("Expressサーバー起動");
        });
    });

    afterAll(() => {
        console.log("afterAll");
        server.close();
    });

    test("http req cancel", (done) => {
        jest.setTimeout(20000);

        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        
        nock("http://localhost:8084")
            .get("/watch/sm19961784")
            .delay(1000);
        // .reply(200, "ok");
        // .reply(200, (uri, requestBody) => {
        //     console.log(requestBody);
        //     return requestBody;
        // });
        // .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

        const niconico = new NicoNico(`http://localhost:${port}`);
        niconico.watch("sm19961784").then(b=>{
            console.log("done: ", b);
            done();
        }).catch((error)=>{
            // console.log("error");
            console.log("error:", error);
            done();
        });

        // const options = {
        //     url: `http://localhost:${port}/watch/sm19961784`,
        //     method: "GET",
        //     timeout: 20 * 1000
        // };
        // request(options, (err, response, body) => {
        //     console.log(body);
        //     console.log("body");
        //     expect(body).toBe("ok");

        //     done();
        // });

    });
});