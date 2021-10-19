const nock = require("nock");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

const base_dir = path.resolve(__dirname, "..");
const video_id = "sm12345678";
const no_owner_comment = require(`${base_dir}/data/no-owner-comment.json`);
const owner_comment = require(`${base_dir}/data/owner-comment.json`);
const data_api_data = require(`${base_dir}/data/sm12345678-data-api-data.json`);
const dmc_session = require(`${base_dir}/data/sm12345678-dmc-session-max-quality.json`);
const dmc_session_low = require(`${base_dir}/data/sm12345678-dmc-session-low-quality.json`);

const disableNetConnect = () => {
    const yellow  = "\u001b[33m";
    const reset = "\u001b[0m";
    console.warn(yellow +  // eslint-disable-line no-console
        "disable http_proxy, https_proxy, no_proxy in this test" + reset);

    process.env["http_proxy"]="";
    process.env["https_proxy"]="";
    process.env["no_proxy"]="";
    
    nock.disableNetConnect();
};

class NicoMocks {
    constructor(){
        this.hb_options_count = 0;
        this.hb_post_count = 0;

        disableNetConnect();
    }

    clean(){
        nock.cleanAll();

        this.hb_options_count = 0;
        this.hb_post_count = 0;
    }

    watch(delay=1, code=200, body){
        this.watch_nock = nock("https://www.nicovideo.jp");
        if(!body){
            body = MockNicoUitl.getWatchHtml(video_id);
        }
        this.watch_nock
            .get(`/watch/${video_id}`)
            .delay(delay)
            .reply(code, body);
    }
    
    comment(delay=1, code=200){
        this.comment_nock = nock("https://nmsg.nicovideo.jp");
        this.comment_nock
            .post("/api.json/")
            .delay(delay)
            .reply((uri, reqbody)=>{
                // const data = JSON.parse(reqbody);
                const data = reqbody;
                if(data.length===0){
                    return [404, "404 - \"Not Found\r\n\""];
                }

                if(data.length===14){
                    //no owner
                    return [code, no_owner_comment];
                }
    
                if(data.length===17){
                    //owner
                    return [code, owner_comment];
                }

                if(data.length===5){
                    const comment = MockNicoUitl.getCommnet(data, no_owner_comment);
                    return [code, comment];
                }
    
                return [code, [
                    { "ping": { "content": "rs:0" } },
                    { "ping": { "content": "rf:0" } }
                ]]; 
            });
    }

    dmc_session(delay=1){
        this.dmc_session_nock = nock("https://api.dmc.nico");
        this.dmc_session_nock
            .post("/api/sessions")
            .query({ _format: "json" })   
            .delay(delay)
            .reply((uri, reqbody)=>{
                // const data = JSON.parse(reqbody);
                const data = reqbody;
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
                        data: { 
                            session: { 
                                id:"12345678" ,
                                content_src_id_sets: [{
                                    content_src_ids:[{
                                        src_id_to_mux:{
                                            video_src_ids:["archive_h264_360p"],
                                            audio_src_ids:["archive_aac_64kbps"]
                                        }
                                    }]
                                }]
                            } 
                        }
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
    
    dmc_hb(options_delay=1, post_delay=1){
        this.dmc_hb_nock = nock("https://api.dmc.nico");
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(options_delay)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                this.hb_options_count++;
                return [200, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(post_delay)
            .times(50)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                this.hb_post_count++;
                return [200, {    
                    meta: {
                        status: 200,
                        message: "ok"
                    }
                }];
            });
    } 

    dmc_hb_options_error(code){
        if(!code){
            throw new Error("code is undefined");
        }

        this.dmc_hb_nock = nock("https://api.dmc.nico");
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .reply(code, `${code}`);  
    }

    dmc_hb_post_error(code){
        if(!code){
            throw new Error("code is undefined");
        }

        this.dmc_hb_nock = nock("https://api.dmc.nico");
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                this.hb_options_count++;
                return [200, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" }) 
            .reply(code, `${code}`);  
    }

    _search(text, code, delay, res_json){
        const fields = 
            "contentId,title,tags,"
            + "viewCounter,commentCounter,startTime,"
            + "thumbnailUrl,lengthSeconds";

        this.search_nock = nock("https://api.search.nicovideo.jp", 
            { encodedQueryParams: true });
        this.search_nock
            .get("/api/v2/snapshot/video/contents/search")
            .query({ 
                q: encodeURIComponent(text), 
                targets: encodeURIComponent("title,description,tags"), 
                fields: encodeURIComponent(fields), 
                _sort: encodeURIComponent("-startTime"),
                _offset: 0, 
                _limit:32, 
                _context: encodeURIComponent("electron-app")
            })
            .delay(delay)
            .reply(code, res_json); 
    }

    search(text, code=200, delay=1){
        const res_json = {
            meta: {
                status: code,
                totalCount: 1,
                id:"012345-6789"
            },
            data: [{
                contentId: "sm100",
                title: text,
                description: "テスト",
                startTime: "2099-09-31T00:00:00+09:00",
                viewCounter: 100
            }]
        };
        this._search(text, code, delay, res_json);
    }

    search_incorrect_json(text, code=200, delay=1){
        this._search(text, code, delay, "incorrect_json");
    }

    searchHtml(target, word1, word2, page, sort, order, code, delay){
        const f_pth = path.join(__dirname, "..", "..", "test", "mock_server", "data", "html", `${target}.html`);
        const html = fs.readFileSync(f_pth, "utf-8");

        const query_json = {
            sort:sort,
            order:order
        };
        if(page>1){
            query_json["page"] = page;
        }
        this.search_html_nock = nock("https://www.nicovideo.jp", 
            { encodedQueryParams: true });
        this.search_html_nock
            .matchHeader("accept-encoding", "gzip")
            .get(`/${target}/${encodeURIComponent(word1)}`)
            .query(query_json)
            .delay(delay)
            .reply(code, html,{
                "Set-Cookie": [
                    "nico_gc=1srch_s%3Df%26srch_o%3Dd; expires=Sun, 14-Nov-2021 00:00:00 GMT; Max-Age=2592000; path=/; domain=.nicovideo.jp",
                    "nicosid=12345.67890; expires=Mon, 13-Oct-2031 10:10:10 GMT; Max-Age=315360000; path=/; domain=.nicovideo.jp"
                ]
            })  
            .get(`/${target}/${encodeURIComponent(word2)}`)
            .query(query_json)
            .matchHeader("cookie", "nicosid=12345.67890; nico_gc=1srch_s%3Df%26srch_o%3Dd")
            .delay(delay)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                if(word1 == word2){
                    return [code, html, {
                        "Set-Cookie": [
                            "nico_gc=2srch_s%3Df%26srch_o%3Dd; expires=Sun, 14-Nov-2021 00:00:00 GMT; Max-Age=2592000; path=/; domain=.nicovideo.jp",
                        ]
                    }];
                }else{
                    return [code, html];  
                }

            });
    }
}

class NicoDownLoadMocks {
    constructor(){
        disableNetConnect();
    }

    clean(){
        nock.cleanAll();
    }
    watch({delay=1, code=200} = {}){
        this.watch_nock = nock("https://www.nicovideo.jp");
        const cp_data_api_data = JSON.parse(JSON.stringify(data_api_data));
        const body = MockNicoUitl.getWatchHtml(video_id, cp_data_api_data);
        this.watch_nock
            .get(`/watch/${video_id}`)
            .delay(delay)
            .reply(code, body);
    } 

    dmc_session({quality="max", delay=1, code=200} = {}){
        const cp_dmc_session = JSON.parse(JSON.stringify(dmc_session));
        if(quality!="max"){
            cp_dmc_session.session.content_src_id_sets[0].content_src_ids = [
                {
                    "src_id_to_mux": {
                        "video_src_ids": ["archive_h264_360p"],
                        "audio_src_ids": ["archive_aac_64kbps"]
                    }
                }
            ];
        }

        this.dmc_session_nock = nock("https://api.dmc.nico");
        this.dmc_session_nock
            .post("/api/sessions")
            .query({ _format: "json" })   
            .delay(delay)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                return [code, {
                    meta: { status: 201,message: "created" },
                    data: cp_dmc_session
                }];                    
            });
    }

    comment({delay=1, code=200} = {}){
        this.comment_nock = nock("https://nmsg.nicovideo.jp");
        this.comment_nock
            .post("/api.json/")
            .delay(delay)
            .reply((uri, reqbody)=>{
                const data = reqbody;
                if(data.length===0){
                    return [404, "404 - \"Not Found\r\n\""];
                }
    
                if(data.length===14){
                    //no owner
                    return [code, no_owner_comment];
                }
    
                if(data.length===17){
                    //owner
                    return [code, owner_comment];
                }
    
                return [code, [
                    { "ping": { "content": "rs:0" } },
                    { "ping": { "content": "rf:0" } }
                ]]; 
            });
    }

    thumbnail({delay=1, code=200} = {}){
        this.thumbnail_nock = nock("https://nicovideo.cdn.nimg.jp");
        this.thumbnail_nock
            .get(/\/thumbnails\/12345678\/.*/)
            .delay(delay)
            .reply(code, "thumbnail");
    }

    dmc_hb({options_delay=1, post_delay=1, code=200} = {}){
        this.dmc_hb_nock = nock("https://api.dmc.nico");
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(options_delay)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                return [code, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(post_delay)
            .times(50)
            .reply((uri, reqbody)=>{ // eslint-disable-line no-unused-vars
                return [code, "ok"];
            });
    } 

    dmc_video({delay=1, code=200} = {}){
        const data = "video dmc";
        const headers = {
            "content-length": Buffer.byteLength(data)
        };
        this.dmc_video_nock = nock("https://pa0000.dmc.nico");
        this.dmc_video_nock
            .get("/m")
            .delay(delay)
            .reply(code, data, headers);
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

    static getWatchHtml(video_id, json){ 
        let data_api_data = "";
        if(json){
            data_api_data = MockNicoUitl._escapeHtml(JSON.stringify(json));
        }else{   
            const fpath = `${base_dir}/data/${video_id}-data-api-data.json`;
            const j = fs.readFileSync(fpath, "utf-8");
            data_api_data = MockNicoUitl._escapeHtml(j);
        }
        return `<!DOCTYPE html>
        <html lang="ja">
            <body>
            <div id="js-initial-watch-data" data-api-data="${data_api_data}"
            </body>
        </html>`;
    }

    /**
     * 
     * @param {Array} post_data 
     * @param {Array} comments 
     */
    static getCommnet(post_data, comments){
        const res_from = post_data[2].thread.res_from;
        if(res_from < 0){
            return comments;
        }
        return [
            {ping: {content: "rs:0"}},
            {ping: {content: "ps:0"}},
            {
                "thread": {
                    resultcode: 0,
                    thread: "1",
                    server_time: 1,
                    last_res: res_from+1,
                    ticket: "0x00000",
                    revision: 1
                }
            },
            { 
                chat:
                { 
                    thread: "1",
                    no: res_from,
                    vpos: 10,
                    date: 1555754900,
                    date_usec: 388400,
                    anonymity: 1,
                    user_id: "a",
                    mail: "184",
                    content: `! no ${res_from}`
                } 
            },
            { 
                chat:
                { 
                    thread: "1",
                    no: res_from+1,
                    vpos: 20,
                    date: 1555754900,
                    date_usec: 388400,
                    anonymity: 1,
                    user_id: "b",
                    mail: "184",
                    content: `! no ${res_from+1}`
                } 
            },
            {global_num_res: {thread: "1",num_res: res_from+1}},
            {ping: {content: "pf:0"}},
            {ping: {content: "rf:0"}}
        ];
    }
}

class writeBufStream extends stream.Writable {
    constructor(raise_error=false) {
        super();
        this.buf = "";
        this.raise_error = raise_error;
    }

    _write(chunk, enc, next) {
        if(this.raise_error){
            next(new Error("stream error"));
        }else{
            this.buf += chunk.toString();
            next();
        }
    }

    end() {
        this.writable = false;
        this.emit.apply(this, ["close"]);
    }

    close() {
        this.end();
    }
}

const setupNicoDownloadNock = (target_nock, {
    video_quality="max",
    watch_delay=1, watch_code=200, 
    dmc_session_delay=1, dmc_session_code=200, 
    comment_delay=1, comment_code=200, 
    thumbnail_delay=1, thumbnail_code=200, 
    hb_delay=1, hb_code=200, 
    video_delay=1, video_code=200}={}) => {

    target_nock.watch({ delay:watch_delay, code:watch_code });
    target_nock.dmc_session({quality:video_quality, delay:dmc_session_delay, code:dmc_session_code });
    target_nock.comment({ delay:comment_delay, code:comment_code });
    target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
    target_nock.dmc_hb({ options_delay:hb_delay, code:hb_code });
    target_nock.dmc_video({ delay:video_delay, code:video_code });  
};

class NicoMylistMocks {
    constructor(){
        disableNetConnect();
    }
    
    clean(){
        nock.cleanAll();
    }

    mylist(id, delay=1, code=200){
        const xml = `<rss>${id}<rss>`;
        const headers = {
            "Content-Type": "application/xml",
        };
        this.myist_nock = nock("https://www.nicovideo.jp");
        this.myist_nock
            .get(`/mylist/${id}`)
            .query({ rss: "2.0", numbers: 1, sort:6 })
            .delay(delay)
            .reply(code, xml, headers);
    }
}

const TestData = {
    video_id,
    no_owner_comment,
    owner_comment,
    data_api_data,
    dmc_session,
    dmc_session_low
};

module.exports = {
    NicoMocks,
    NicoDownLoadMocks,
    NicoMylistMocks,
    MockNicoUitl,
    writeBufStream,
    setupNicoDownloadNock,
    TestData
};