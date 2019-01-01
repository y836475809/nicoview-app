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
            const cookie = req.cookies;
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
            const json = res.json();
            if(json.session){
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
const httpsTohttp = (url) => {
    return url.replace("https", "http");
};


module.exports = {
    MockNicoServer: MockNicoServer,
    httpsTohttp: httpsTohttp
};