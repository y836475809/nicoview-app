const express = require("express");
const cookieParser = require("cookie-parser");
const httpProxy = require("http-proxy");
const http = require("http");
const fs = require("fs");

class MockNicoServer {
    constructor(){
        this.app = express();
        this.app.use(cookieParser());
        this.app.use(express.json());

        this.dmc_hb_options_count = 0;
        this.dmc_hb_post_count = 0;
    
        this.server_port = 8084;
        this.proxy_port = 3000;
        this.proxy = new httpProxy.createProxyServer();

        this.proxyServer = http.createServer((req, res) => {
            const mapping = {
                "www.nicovideo.jp": {
                    host: "localhost", port: this.server_port
                },
                "smile-cls20.sl.nicovideo.jp": {
                    host: "localhost", port: this.server_port
                },
                "smile-cls30.sl.nicovideo.jp": {
                    host: "localhost", port: this.server_port
                },
                "api.dmc.nico": {
                    host: "localhost", port: this.server_port
                }
            };

            let parser = document.createElement("a");
            parser.href = req.url;
            const target = mapping[parser.hostname];
            this.proxy.web(req, res, { target: target });
        });
        this.proxyServer.listen(this.proxy_port);
    }

    get serverUrl() {
        return `http://localhost:${this.server_port}`;
    } 
    get proxyUrl() {
        return `http://localhost:${this.proxy_port}`;
    } 

    start(){
        this.server = this.app.listen(this.server_port, () => {
            console.log("Start express");
        });
    }

    stop(){
        console.log("Stop express");
        this.server.close();
        this.proxyServer.close();
    }

    clearCount(){
        console.log("clearCount");
        this.dmc_hb_options_count = 0;
        this.dmc_hb_post_count = 0;
    }

    _hasCookie(req){
        const cookies = req.cookies;
        if (cookies === undefined) {
            return false;
        }
        if (cookies.nicohistory === undefined) {
            return false;
        }

        return true;
    }

    setupRouting(){
        this.app.get("/watch/:videoid", (req, res) => {
            const video_id = req.params.videoid;

            res.cookie("nicohistory", `${video_id}:123456789`, { domain: ".nicovideo.jp", path: "/" });
            res.cookie("nicosid", "123456.789", { domain: ".nicovideo.jp", path: "/" });

            const file = fs.readFileSync(`${__dirname}/data/${video_id}.html`, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(file);
            res.end();
        });
        this.app.get("/smile", (req, res) => {
            if(!this._hasCookie(req)){
                res.status(403).send("403");
                return;
            }
            res.status(200).send("smile");
        });   
        this.app.post("/api/sessions", (req, res) => {
            const query = req.query._format;
            if(query!="json"){
                res.status(403).send({
                    meta: {
                        status: 403,
                        message: "403"
                    }
                }); 
                return;
            }
            const json = req.body;
            if(json.session 
                && json.session.recipe_id 
                && json.session.content_id
                && json.session.content_type
                && json.session.content_src_id_sets
                && json.session.timing_constraint
                && json.session.keep_method
                && json.session.protocol
                && (json.session.content_uri === "")
                && json.session.session_operation_auth
                && json.session.content_auth
                && json.session.client_info
                && json.session.priority){
                    
                res.status(200).json({
                    meta: {
                        status: 201,
                        message: "created"
                    },
                    data: { session: {} }
                }); 
                return;
            }

            res.status(403).send(403); 
        });
        this.app.options("/api/sessions/:id", (req, res) => {
            const query = req.query._format;
            if(query!="json"){
                res.status(403).send("403");
                return;
            }
            this.dmc_hb_options_count++;
            res.status(200).send("ok");
        });
        this.app.post("/api/sessions/:id", (req, res) => {
            const query = req.query._format;
            if(query!="json"){
                res.status(403).json({
                    meta: {
                        status: 403,
                        message: 403
                    }
                }); 
                return;
            }
            const json = req.body;
            if(json.session){
                this.dmc_hb_post_count++;
                res.status(200).json({
                    meta: {
                        status: 200,
                        message: "ok"
                    },
                    data: { session: {} }
                }); 
                return;
            }
            res.status(403).json({
                meta: {
                    status: 403,
                    message: 403
                }
            }); 
        });
    }
}

/**
 * 
 * @param {string} url 
 */
const httpsTohttp = (api_data) => {
    const smile_url = api_data.video.smileInfo.url;
    const dmc_url = api_data.video.dmcInfo.session_api.urls[0].url;
    api_data.video.smileInfo.url = smile_url.replace("https", "http");
    api_data.video.dmcInfo.session_api.urls[0].url = dmc_url.replace("https", "http");
};

module.exports = {
    MockNicoServer: MockNicoServer,
    httpsTohttp: httpsTohttp
};