const https = require("https");
const fs = require("fs");
const path = require("path");

const { NicoMockResponse } = require("./nico-mock-response");

const wait_msec = process.env["mock_server_wait_msec"];

const options = { 
    key: fs.readFileSync(path.join(__dirname, "orekey.pem")),
    cert: fs.readFileSync(path.join(__dirname, "orecert.pem"))
};

class NicoMockServer {
    create(){ 
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
                        this.nico_mock_res.comment(body, res);
                    }
                    if(req.url.startsWith("https://api.dmc.nico/api/sessions")){
                        if(req.url.includes("_method=PUT")){
                            console.log("mock server: put dmcHB");
                            this.nico_mock_res.dmcHB(res);
                        }else{
                            console.log("mock server: dmcSession");
                            this.nico_mock_res.dmcSession(body, res);
                        }
                    }
                });
            }
            if(req.method.toLowerCase() == "options") {
                await new Promise(resolve => setTimeout(resolve, wait_msec));

                if(req.url.startsWith("https://api.dmc.nico")){
                    console.log("mock server: options dmcHB");
                    this.nico_mock_res.dmcHB(res);
                }
            }
            if(req.method.toLowerCase() == "get") {
                await new Promise(resolve => setTimeout(resolve, wait_msec));
                
                if(req.url.startsWith("https://api.search.nicovideo.jp")){
                    console.log("mock server: search");
                    this.nico_mock_res.search(req.url, res);
                }
                if(req.url.startsWith("https://www.nicovideo.jp/mylist")){
                    console.log("mock server: mylist");
                    this.nico_mock_res.mylist(req.url, res);
                }
                if(req.url.startsWith("https://www.nicovideo.jp/watch")){
                    console.log("mock server: watch");
                    this.nico_mock_res.watch(req.url, res);
                }
                if(req.url.startsWith("https://nicovideo.cdn.nimg.jp")){
                    console.log("mock server: thumbnail");
                    this.nico_mock_res.thumbnail(req.url, res);
                }
                if(req.url.startsWith("https://pa0000.dmc.nico/hlsvod/ht2_nicovideo")){
                    console.log("mock server: downloadVideo");
                    this.nico_mock_res.downloadVideo(res);
                }

                // img tag, video tag
                if(!req.url.startsWith("https://")){
                    if(req.url.includes("/hlsvod/ht2_nicovideo/nicovideo")){
                        console.log("mock server: playVideo");
                        this.nico_mock_res.playVideo(res);
                    }else{
                        this.nico_mock_res.thumbnail(req.url, res);
                    }
                }            
            }
        });
    }

    listen(){
        const port = process.env["mock_server_port"];
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

module.exports = {
    NicoMockServer,
};