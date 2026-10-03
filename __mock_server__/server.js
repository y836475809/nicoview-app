const https = require("https");
const fs = require("fs");
const path = require("path");
const { MockResponse } = require("./mock-response");

/* eslint-disable no-console */

const options = { 
    key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem"))
};
 
const mock_res = new MockResponse();
const srever = https.createServer(options, async (req, res) => {
    const originalHost = req.headers.host;
    const urlPath = req.url;
    const protocol = 'https';
    const orgUrl = `${protocol}://${originalHost}${urlPath}`;
    console.log(
        "mock server url=", orgUrl, 
        ", user-agent=", req.headers["user-agent"]);

    if(req.method?.toLowerCase() == "post") {
        let body = "";
        req.on("data", (data) => {
            body += data;
        });
        req.on("end", async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            if(orgUrl.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
                console.log("mock server: contentUrlCookie");
                mock_res.contentUrlCookie(req, res);
            }
            if(orgUrl.startsWith("https://nv-comment.nicovideo.jp")){
                console.log("mock server: nvComment");
                mock_res.nvComment(req, res);
            }
        });
    }
    if(req.method?.toLowerCase() == "get") {
        await new Promise(resolve => setTimeout(resolve, 500));
        if(orgUrl.startsWith("https://snapshot.search.nicovideo.jp")){
            console.log("mock server: search");
            mock_res.search(orgUrl, req, res);
        }
        if(orgUrl.startsWith("https://www.nicovideo.jp/mylist")){
            console.log("mock server: mylist");
            mock_res.mylist(orgUrl, req, res);
        }
        if(orgUrl.startsWith("https://www.nicovideo.jp/watch")){
            console.log("mock server: watch");
            mock_res.watch(orgUrl, req, res);
        }
        if(orgUrl.startsWith("https://nicovideo.cdn.nimg.jp")){
            console.log("mock server: thumbnail");
            mock_res.thumbnail(req, res);
        }
        if(orgUrl.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
            console.log("mock server: nvapi watch");
            mock_res.contentUrlCookie(req, res);
        }
        if(orgUrl.startsWith("https://delivery.domand.nicovideo.jp")){
            console.log("mock server: delivery.domand");
            mock_res.m3u8(orgUrl, req, res);
        }
        if(orgUrl.startsWith("https://asset.domand.nicovideo.jp")){
            console.log("mock server: asset.domand");
            mock_res.hlsMedia(orgUrl, req, res);
        }            
    }
});

const port = 8098;
srever.listen(port, () => {
    console.log(`Server running port=${port}`);
});
