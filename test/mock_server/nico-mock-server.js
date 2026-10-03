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
            const originalHost = req.headers.host;
            const urlPath = req.url;
            const protocol = 'https';
            const orgUrl = `${protocol}://${originalHost}${urlPath}`;
            console.log(
                "mock server url=", orgUrl, 
                ", user-agent=", req.headers["user-agent"]);

            if(req.method.toLowerCase() == "post") {
                let body = "";
                req.on("data", (data) => {
                    body += data;
                });
                req.on("end", async () => {
                    await new Promise(resolve => setTimeout(resolve, wait_msec));

                    if(orgUrl.startsWith("https://nmsg.nicovideo.jp/api.json/")){
                        console.log("mock server: comment");
                        this.nico_mock_res.comment(req, res, body);
                    }
                    if(orgUrl.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
                        console.log("mock server: contentUrlCookie");
                        this.nico_mock_res.contentUrlCookie(req, res);
                    }
                    if(orgUrl.startsWith("https://nv-comment.nicovideo.jp")){
                        console.log("mock server: nvComment");
                        this.nico_mock_res.nvComment(req, res);
                    }
                });
            }
            if(req.method.toLowerCase() == "get") {
                await new Promise(resolve => setTimeout(resolve, wait_msec));
                if(orgUrl.startsWith("https://snapshot.search.nicovideo.jp")){
                    console.log("mock server: search");
                    this.nico_mock_res.search(orgUrl, req, res);
                }
                if(orgUrl.startsWith("https://www.nicovideo.jp/mylist")){
                    console.log("mock server: mylist");
                    this.nico_mock_res.mylist(orgUrl, req, res);
                }
                if(orgUrl.startsWith("https://www.nicovideo.jp/watch")){
                    console.log("mock server: watch");
                    this.nico_mock_res.watch(orgUrl, req, res);
                }
                if(orgUrl.startsWith("https://nicovideo.cdn.nimg.jp")){
                    console.log("mock server: thumbnail");
                    this.nico_mock_res.thumbnail(req, res);
                }
                if(orgUrl.startsWith("https://pa0000.dmc.nico/hlsvod/ht2_nicovideo")){
                    console.log("mock server: downloadVideo");
                    this.nico_mock_res.downloadVideo(req, res);
                }
                if(orgUrl.startsWith("https://nvapi.nicovideo.jp/v1/watch")){
                    console.log("mock server: nvapi watch");
                    this.nico_mock_res.contentUrlCookie(req, res);
                }
                if(orgUrl.startsWith("https://delivery.domand.nicovideo.jp")){
                    console.log("mock server: delivery.domand");
                    this.nico_mock_res.m3u8(orgUrl, req, res);
                }
                if(orgUrl.startsWith("https://asset.domand.nicovideo.jp")){
                    console.log("mock server: asset.domand");
                    this.nico_mock_res.hlsMedia(orgUrl, req, res);
                }


                // img tag, video tag
                if(!orgUrl.startsWith("https://")){
                    if(orgUrl.includes("/hlsvod/ht2_nicovideo/nicovideo")){
                        console.log("mock server: playVideo");
                        this.nico_mock_res.playVideo(req, res);           
                    } else if(orgUrl.startsWith("/nicoaccount/usericon")){
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
    const port_api = 8098;
    const rules = [
        'nvapi.nicovideo.jp',
        'www.nicovideo.jp',
        'delivery.domand.nicovideo.jp',
        'asset.domand.nicovideo.jp',
        'public.nvcomment.nicovideo.jp',
        'nicovideo.cdn.nimg.jp',
        'secure-dcdn.cdn.nimg.jp',
        'snapshot.search.nicovideo.jp',
        'nv-comment.nicovideo.jp'
    ].map((host) => {
        return `MAP ${host} localhost:${port_api}`;
    }).join(',');
    app.commandLine.appendSwitch('host-resolver-rules', rules);
    app.commandLine.appendSwitch('ignore-certificate-errors');

    console.log(`use local proxy, mock_server_port is ${port}`);
    
    const nico_mock_server = new NicoMockServer();
    nico_mock_server.create(wait_msec);
    nico_mock_server.listen(port);
};

module.exports = {
    NicoMockServer,
    setupMockServer
};