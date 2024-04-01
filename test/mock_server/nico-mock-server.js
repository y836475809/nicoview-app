const https = require("https");
const fs = require("fs");
const path = require("path");

const { NicoMockResponse } = require("./nico-mock-response");

/* eslint-disable no-console */

const options = { 
    key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem"))
};

class NicoMockServer {
    create(wait_msec){ 
        this.nico_mock_res = new NicoMockResponse();
        this.srever = https.createServer(options, async (req, res) => {
            console.log(
                "mock server url=", req.url, 
                ", user-agent=", req.headers["user-agent"]);

            if(req.method.toLowerCase() == "post") {
                let body = "";
                req.on("data", (data) => {
                    body += data;
                });
                req.on("end", async () => {
                    await new Promise(resolve => setTimeout(resolve, wait_msec));

                    if(req.url.startsWith("https://nmsg.nicovideo.jp/api.json/")){
                        console.log("mock server: comment");
                        this.nico_mock_res.comment(req, res, body);
                    }
                    if(req.url.startsWith("https://api.dmc.nico/api/sessions")){
                        if(req.url.includes("_method=PUT")){
                            console.log("mock server: put dmcHB");
                            this.nico_mock_res.dmcHB(req, res);
                        }else{
                            console.log("mock server: dmcSession");
                            this.nico_mock_res.dmcSession(req, res, body);
                        }
                    }
                    if(req.url.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
                        console.log("mock server: contentUrlCookie");
                        this.nico_mock_res.contentUrlCookie(req, res);
                    }
                    if(req.url.startsWith("https://nv-comment.nicovideo.jp")){
                        console.log("mock server: nvComment");
                        this.nico_mock_res.nvComment(req, res);
                    }
                });
            }
            if(req.method.toLowerCase() == "options") {
                await new Promise(resolve => setTimeout(resolve, wait_msec));

                if(req.url.startsWith("https://api.dmc.nico")){
                    console.log("mock server: options dmcHB");
                    this.nico_mock_res.dmcHB(req, res);
                }
            }
            if(req.method.toLowerCase() == "get") {
                await new Promise(resolve => setTimeout(resolve, wait_msec));
                if(req.url.startsWith("https://snapshot.search.nicovideo.jp")){
                    console.log("mock server: search");
                    this.nico_mock_res.search(req, res);
                }
                if(req.url.startsWith("https://www.nicovideo.jp/mylist")){
                    console.log("mock server: mylist");
                    this.nico_mock_res.mylist(req, res);
                }
                if(req.url.startsWith("https://www.nicovideo.jp/watch")){
                    console.log("mock server: watch");
                    this.nico_mock_res.watch(req, res);
                }
                if(req.url.startsWith("https://nicovideo.cdn.nimg.jp")){
                    console.log("mock server: thumbnail");
                    this.nico_mock_res.thumbnail(req, res);
                }
                if(req.url.startsWith("https://pa0000.dmc.nico/hlsvod/ht2_nicovideo")){
                    console.log("mock server: downloadVideo");
                    this.nico_mock_res.downloadVideo(req, res);
                }
                if(req.url.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
                    console.log("mock server: nvapi watch");
                    this.nico_mock_res.contentUrlCookie(req, res);
                }
                if(req.url.startsWith("https://delivery.domand.nicovideo.jp")){
                    console.log("mock server: delivery.domand");
                    this.nico_mock_res.m3u8(req, res);
                }
                if(req.url.startsWith("https://asset.domand.nicovideo.jp")){
                    console.log("mock server: asset.domand");
                    this.nico_mock_res.hlsMedia(req, res);
                }


                // img tag, video tag
                if(!req.url.startsWith("https://")){
                    if(req.url.includes("/hlsvod/ht2_nicovideo/nicovideo")){
                        console.log("mock server: playVideo");
                        this.nico_mock_res.playVideo(req, res);           
                    } else if(req.url.startsWith("/nicoaccount/usericon")){
                        console.log("mock server: user icon url=", req.url);
                        this.nico_mock_res.userIcon(req, res);
                    }else{
                        console.log("mock server: http thumbnail url=", req.url);
                        this.nico_mock_res.thumbnail(req, res);
                    }
                }            
            }
        });
    }

    listen(port){
        this.srever.listen(port);
        console.log(`start mock server port=${port}`);
    }
    
    close(){
        this.srever.close();

        if(this.nico_mock_res){
            this.nico_mock_res.close();
        }
    }
}

const { app } = require("electron");
const setupMockServer = (port, wait_msec) => {
    app.commandLine.appendSwitch("host-rules", `MAP * localhost:${port}`);
    app.commandLine.appendSwitch("proxy-server", `https://localhost:${port}`);
    app.commandLine.appendSwitch("ignore-certificate-errors", "true");
    app.commandLine.appendSwitch("allow-insecure-localhost", "true");
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    process.env["proxy_server"] = app.commandLine.getSwitchValue("proxy-server");

    console.log(`use local proxy, mock_server_port is ${port}`);
    
    const nico_mock_server = new NicoMockServer();
    nico_mock_server.create(wait_msec);
    nico_mock_server.listen(port);
};

module.exports = {
    NicoMockServer,
    setupMockServer
};