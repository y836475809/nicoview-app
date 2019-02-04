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

        this.hb_options_count = 0;
        this.hb_post_count = 0;
    }

    watch(delay=1, body){
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
            .reply(200, body, headers);
    }

    watchNotFindPage(video_id){
        nock("https://www.nicovideo.jp")
            .get(`/watch/${video_id}`)
            .reply(404, "not find page");    
    }
    
    comment(delay=1){
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

    comment_error(code){
        if(!code){
            throw new Error("code is undefined");
        }
        this.comment_nock = nock("https://nmsg.nicovideo.jp");
        this.comment_nock
            .post("/api.json/")
            .reply(code, `${code}`);
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
}

module.exports = {
    NicoMocks: NicoMocks,
    MockNicoUitl: MockNicoUitl,
    TestData : {
        video_id : video_id,
        no_owner_comment: no_owner_comment,
        owner_comment: owner_comment,
        data_api_data: data_api_data
    }
};