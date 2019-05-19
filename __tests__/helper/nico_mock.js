const nock = require("nock");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

const base_dir = path.resolve(__dirname, "..");
const video_id = "sm12345678";
const no_owner_comment = require(`${base_dir}/data/res_no_owner_comment.json`);
const owner_comment = require(`${base_dir}/data/res_owner_comment.json`);
const data_api_data = require(`${base_dir}/data/sm12345678_data_api_data.json`);
const dmc_session = require(`${base_dir}/data/sm12345678_dmc_session_max_quality.json`);
const dmc_session_low = require(`${base_dir}/data/sm12345678_dmc_session_low_quality.json`);

class NicoMocks {
    constructor(){
        this.hb_options_count = 0;
        this.hb_post_count = 0;

        nock.disableNetConnect();
    }

    clean(){
        nock.cleanAll();

        this.hb_options_count = 0;
        this.hb_post_count = 0;
    }

    watch(delay=1, code=200, body){
        this.watch_nock = nock("https://www.nicovideo.jp");
        const headers = {
            "Set-Cookie": [
                `nicohistory=${video_id}%3A123456789; path=/; domain=.nicovideo.jp`,
                "nicosid=123456.789; path=/; domain=.nicovideo.jp"
            ]
        };
        if(!body){
            body = MockNicoUitl.getWatchHtml(video_id);
        }
        this.watch_nock
            .get(`/watch/${video_id}`)
            .delay(delay)
            .reply(code, body, headers);
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

                if(data.length===8){
                    //no owner
                    return [code, no_owner_comment];
                }
    
                if(data.length===11){
                    //owner
                    return [code, owner_comment];
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
    
    dmc_hb(options_delay=1, post_delay=1){
        this.dmc_hb_nock = nock("https://api.dmc.nico");
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
            .reply((uri, reqbody)=>{
                this.hb_options_count++;
                return [200, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" }) 
            .reply(code, `${code}`);  
    }

    _search(text, code, delay, res_json){
        const fields = 
            "contentId,title,description,tags,"
            + "viewCounter,commentCounter,startTime,"
            + "thumbnailUrl,lengthSeconds";

        this.search_nock = nock("https://api.search.nicovideo.jp", 
            { encodedQueryParams: true });
        this.search_nock
            .get("/api/v2/video/contents/search")
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
}

class NicoDownLoadMocks {
    constructor(){
        nock.disableNetConnect();
    }

    clean(){
        nock.cleanAll();
    }
    watch({kind="dmc", delay=1, code=200} = {}){
        this.watch_nock = nock("https://www.nicovideo.jp");
        const headers = {
            "Set-Cookie": [
                `nicohistory=${video_id}%3A123456789; path=/; domain=.nicovideo.jp`,
                "nicosid=123456.789; path=/; domain=.nicovideo.jp"
            ]
        };
        const cp_data_api_data = JSON.parse(JSON.stringify(data_api_data));
        if(kind=="smile max"){
            cp_data_api_data.video.dmcInfo = null;
        }else if(kind=="smile low"){
            cp_data_api_data.video.dmcInfo = null;
            cp_data_api_data.video.smileInfo.url += "low";
        }

        const body = MockNicoUitl.getWatchHtml(video_id, cp_data_api_data);
        this.watch_nock
            .get(`/watch/${video_id}`)
            .delay(delay)
            .reply(code, body, headers);
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
            .reply((uri, reqbody)=>{
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
    
                if(data.length===8){
                    //no owner
                    return [code, no_owner_comment];
                }
    
                if(data.length===11){
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
        this.thumbnail_nock = nock("https://tn.smilevideo.jp");
        this.thumbnail_nock
            .get("/smile")
            .query({ i: "12345678.L" }) 
            .delay(delay)
            .reply(code, "thumbnail");
    }

    dmc_hb({options_delay=1, post_delay=1, code=200} = {}){
        this.dmc_hb_nock = nock("https://api.dmc.nico");
        this.dmc_hb_nock
            .options(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(options_delay)
            .reply((uri, reqbody)=>{
                return [code, "ok"];
            })
            .post(/\/api\/sessions\/.+/)
            .query({ _format: "json", _method: "PUT" })
            .delay(post_delay)
            .times(50)
            .reply((uri, reqbody)=>{
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

    smile_video({delay=1, code=200, quality=""} = {}){
        const data = "video smile";
        const headers = {
            "content-length": Buffer.byteLength(data)
        };
        this.smile_video_nock = nock("https://smile-cls20.sl.nicovideo.jp");
        this.smile_video_nock
            .get("/smile")
            .query({ m: `12345678.67759${quality}`})
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
            const fpath = `${base_dir}/data/${video_id}_data_api_data.json`;
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
    video_kind="dmc", video_quality="max",
    watch_delay=1, watch_code=200, 
    dmc_session_delay=1, dmc_session_code=200, 
    comment_delay=1, comment_code=200, 
    thumbnail_delay=1, thumbnail_code=200, 
    hb_delay=1, hb_code=200, 
    video_delay=1, video_code=200}={}) => {

    if(video_kind=="dmc"){
        target_nock.watch({ delay:watch_delay, code:watch_code });
        target_nock.dmc_session({quality:video_quality, delay:dmc_session_delay, code:dmc_session_code });
        target_nock.comment({ delay:comment_delay, code:comment_code });
        target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
        target_nock.dmc_hb({ options_delay:hb_delay, code:hb_code });
        target_nock.dmc_video({ delay:video_delay, code:video_code });  
    }else if(video_kind=="smile"){
        let watch_kind = "";
        let smile_quality= "";
        if(video_quality=="max"){
            watch_kind = "smile max";
            smile_quality = "";
        }else{
            watch_kind = "smile low";
            smile_quality = "low";
        }      
        target_nock.watch({kind:watch_kind, delay:watch_delay, code:watch_code });
        target_nock.comment({ delay:comment_delay, code:comment_code });
        target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
        target_nock.smile_video({quality:smile_quality, delay:video_delay, code:video_code });  
    }
};

class NicoMylistMocks {
    constructor(){
        nock.disableNetConnect();
    }
    
    clean(){
        nock.cleanAll();
    }

    mylist(id, delay=1, code=200){
        const xml = `<rss>${id}<rss>`;
        const headers = {
            "Content-Type": "application/xml",
        };
        this.myist_nock = nock("http://www.nicovideo.jp");
        this.myist_nock
            .get(`/mylist/${id}`)
            .query({ rss: "2.0", numbers: 1, sort:1 })
            .delay(delay)
            .reply(code, xml, headers);
    }
}

module.exports = {
    NicoMocks: NicoMocks,
    NicoDownLoadMocks: NicoDownLoadMocks,
    NicoMylistMocks: NicoMylistMocks,
    MockNicoUitl: MockNicoUitl,
    writeBufStream: writeBufStream,
    setupNicoDownloadNock: setupNicoDownloadNock,
    TestData : {
        video_id : video_id,
        no_owner_comment: no_owner_comment,
        owner_comment: owner_comment,
        data_api_data: data_api_data,
        dmc_session: dmc_session,
        dmc_session_low: dmc_session_low
    }
};