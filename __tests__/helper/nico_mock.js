const express = require("express");
const cookieParser = require("cookie-parser");
const tough = require("tough-cookie");
const httpProxy = require("http-proxy");
const http = require("http");
const nock = require("nock");
const fs = require("fs");
const path = require("path");

const base_dir = path.resolve(__dirname, "..");
const video_id = "sm12345678";
const no_owner_comment = require(`${base_dir}/data/res_no_owner_comment.json`);
const owner_comment = require(`${base_dir}/data/res_owner_comment.json`);
const data_api_data = require(`${base_dir}/data/sm12345678_data_api_data.json`);

class NicoMocks {
    constructor(){
        this.hb_options_count = 0;
        this.hb_post_count = 0;
    }

    clean(){
        nock.cleanAll();
    }

    watch(delay, body){
        this.watch_nock = nock("http://www.nicovideo.jp");

        const headers = {
            "Set-Cookie": `nicohistory=${video_id}%3A123456789; path=/; domain=.nicovideo.jp`
        };
        if(!delay){
            delay = 1;
        }
        if(!body){
            body = MockNicoUitl.getWatchHtml(video_id);
        }
        this.watch_nock
            .get(`/watch/${video_id}`)
            .delay(delay)
            .reply(200, body, headers);
    }
    
    comment(delay){
        this.comment_nock = nock("http://nmsg.nicovideo.jp");

        if(!delay){
            delay = 1;
        }
        this.comment_nock
            .post("/api.json/")
            .delay(delay)
            .reply((uri, reqbody)=>{
                const data = JSON.parse(reqbody);
                if(data.length===0){
                    return [404, "404 - \"Not Found\r\n\""];
                }
    
                if(data.length===8){
                    //no owner
                    return [200, no_owner_comment];
                }
    
                if(data.length===11){
                    //owner
                    return [200, owner_comment];
                }
    
                return [200, [
                    { "ping": { "content": "rs:0" } },
                    { "ping": { "content": "rf:0" } }
                ]]; 
            });
    }

    dmc_session(delay){
        this.dmc_session_nock = nock("https://api.dmc.nico");
        if(!delay){
            delay = 1;
        }
        this.dmc_session_nock
            .post("/api/sessions")
            .query({ _format: "json" })   
            .delay(delay)
            .reply((uri, reqbody)=>{
                const data = JSON.parse(reqbody);
                if(data.session 
                    && data.session.recipe_id 
                    && data.session.content_id
                    && data.session.content_type
                    && data.session.content_src_id_sets
                    && data.session.timing_constraint
                    && data.session.keep_method
                    && data.session.protocol
                    && (data.session.content_uri === "")
                    && data.session.session_operation_auth
                    && data.session.content_auth
                    && data.session.client_info
                    && data.session.priority !== undefined){
                    return [200, {
                        meta: { status: 201,message: "created" },
                        data: { session: { id:"12345678" } }
                    }];                    
                }
                return [403, "fault 403"];
            });
    }

    dmc_session_error(){
        this.dmc_session_nock = nock("https://api.dmc.nico");
        this.dmc_session_nock
            .post("/api/sessions")
            .query({ _format: "json" })
            .reply(403, { meta: { status: 403, message: "403"} });    
    }
    
    dmc_hb(options_delay, post_delay){
        this.dmc_hb_nock = nock("https://api.dmc.nico");

        this.hb_options_count = 0;
        this.hb_post_count = 0;

        if(!options_delay){
            options_delay = 1;
        }
        if(!post_delay){
            post_delay = 1;
        }
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(options_delay)
            .reply((uri, reqbody)=>{
                this.hb_options_count++;
                return [200, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(post_delay)
            .times(50)
            .reply((uri, reqbody)=>{
                this.hb_post_count++;
                return [200, "ok"];
            });
    } 
}

class MockNicoUitl {
    static _escapeHtml(str){
        str = str.replace(/&/g, "&amp;");
        str = str.replace(/>/g, "&gt;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/'/g, "&#x27;");
        str = str.replace(/`/g, "&#x60;");
        str = str.replace(/\//g, "\\/");
        return str;
    }

    static getWatchHtml(video_id){ 
        const fpath = `${base_dir}/data/${video_id}_data_api_data.json`;
        const j = fs.readFileSync(fpath, "utf-8");
        const data_api_data = MockNicoUitl._escapeHtml(j);
        // const html = escape("hh");
        return `<!DOCTYPE html>
        <html lang="ja">
            <body>
            <div id="js-initial-watch-data" data-api-data="${data_api_data}"
            </body>
        </html>`;
    }

    /**
     * 
     * @param {string} url 
     */
    static tohttp(api_data){
        const smile_url = api_data.video.smileInfo.url;
        const dmc_url = api_data.video.dmcInfo.session_api.urls[0].url;
        api_data.video.smileInfo.url = smile_url.replace("https", "http");
        api_data.video.dmcInfo.session_api.urls[0].url = dmc_url.replace("https", "http");
    }

    static getCookieJar(video_id){
        const url = `http://www.nicovideo.jp/watch/${video_id}`;
        const options = "Domain=nicovideo.jp; Path=/";
        const c1 = tough.Cookie.parse(`nicohistory=${video_id}%3A123456789; ${options}`);
        const c2 = tough.Cookie.parse(`nicosid=123456.789; ${options}`);
        
        const cookie_jar = new tough.CookieJar();
        cookie_jar.setCookieSync(c1, url);
        cookie_jar.setCookieSync(c2, url);
        
        return cookie_jar;
    }
}

class MockNicoServer {
    constructor(){
        this.app = express();
        this.app.use(cookieParser());
        this.app.use(express.json());

        this.dmc_hb_options_count = 0;
        this.dmc_hb_post_count = 0;
    
        this.server_port = 8084;
        this.proxy_port = 3000;
        this.proxy_server = new httpProxy.createProxyServer();
        this.proxy_server.on("error", (err, req, res) => {
            res.end();
        });

        this.convert_server = http.createServer((req, res) => {
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
                },
                "nmsg.nicovideo.jp" : {
                    host: "localhost", port: this.server_port
                }
            };

            // let parser = document.createElement("a");
            // parser.href = req.url;
            // const target = mapping[parser.hostname];
            const target = { host: "localhost", port: this.server_port };
            this.proxy_server.web(req, res, { target: target });
        });
        this.convert_server.listen(this.proxy_port);
    }

    get serverUrl() {
        return `http://localhost:${this.server_port}`;
    } 
    get proxy() {
        return {
            host: "localhost",
            port: this.proxy_port
        };
    } 

    async start(){        
        await new Promise((resolve) => {
            this.server = this.app.listen(this.server_port, () => {
                console.log("Start express");
                return resolve();
            });
        });
        this.setupRouting();
        // this.server = this.app.listen(this.server_port, () => {
        //     console.log('Listening :)');
        //     //this.server.close(function() { console.log('Doh :('); });
        // });
    }

    async stop(){
        console.log("Stop express");
        await this.convert_server.close();
        await this.server.close();
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
        if (cookies.nicosid === undefined) {
            return false;
        }

        return true;
    }

    setupRouting(){
        this.app.get("/watch/:videoid", (req, res) => {
            const video_id = req.params.videoid;
            const fpath = `${base_dir}/data/${video_id}_data_api_data.json`;
            try {
                fs.statSync(fpath);
            } catch (error) {
                res.status(404).send(`not find ${video_id}`);
                return;               
            }

            res.cookie("nicohistory", `${video_id}:123456789`, { domain: ".nicovideo.jp", path: "/", secure: false});
            res.cookie("nicosid", "123456.789", { domain: ".nicovideo.jp", path: "/", secure: false });
            
            res.status(200).send(MockNicoUitl.getWatchHtml(video_id));
        });
        this.app.get("/smile", (req, res) => {
            if(!this._hasCookie(req)){
                res.status(403).send("fault 403");
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
                        message: "fault 403"
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
                && json.session.priority !== undefined){
                    
                res.status(200).json({
                    meta: {
                        status: 201,
                        message: "created"
                    },
                    data: { session: { id:"12345678" } }
                }); 
                return;
            }

            res.status(403).send("fault 403"); 
        });
        this.app.options("/api/sessions/:id+", (req, res) => {
            const query = req.query._format;
            if(query!="json"){
                res.status(403).send("fault 403");
                return;
            }
            this.dmc_hb_options_count++;
            res.status(200).send("ok");
        });
        this.app.post("/api/sessions/:id+", (req, res) => {
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
        this.app.post("/api.json", (req, res) => {
            /**
             *  @type {Array}
             */
            const req_json = req.body;
            if(req_json.length===0){              
                res.status(404).send("404 - \"Not Found\r\n\""); 
                return;  
            }

            if(req_json.length===8){
                //no owner
                if(req_json[0].ping.content
                 && req_json[1].ping.content
                 && req_json[2].thread.version == "20090904"
                 && req_json[3].ping.content
                 && req_json[4].ping.content
                 && req_json[5].thread_leaves
                 && req_json[6].ping.content
                 && req_json[7].ping.content){
                    res.status(200).json(no_owner_comment_json); 
                    return;
                }
            }

            if(req_json.length===11){
                //owner
                if(req_json[0].ping.content
                 && req_json[1].ping.content
                 && req_json[2].thread.version == "20061206"
                 && req_json[3].ping.content
                 && req_json[4].ping.content
                 && req_json[5].thread.version == "20090904"
                 && req_json[6].ping.content
                 && req_json[7].ping.content
                 && req_json[8].thread_leaves
                 && req_json[9].ping.content
                 && req_json[10].ping.content){
                    res.status(200).json(owner_comment_json); 
                    return;
                }
            }

            res.status(200).json([
                {
                    "ping": { "content": "rs:0" }
                },
                {
                    "ping": { "content": "rf:0" }
                }
            ]); 
        });
    }
}

module.exports = {
    NicoMocks: NicoMocks,
    MockNicoServer: MockNicoServer,
    MockNicoUitl: MockNicoUitl,
    TestData : {
        video_id : video_id,
        no_owner_comment: no_owner_comment,
        owner_comment: owner_comment,
        data_api_data: data_api_data
    }
};