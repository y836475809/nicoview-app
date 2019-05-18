const nock = require("nock");
const fs = require("fs");
const querystring = require("querystring");

const comment = require("./data/comment.json");
const data_api_data = require("./data/api_data.json");
const dmc_session = require("./data/dmc_session.json");

class NicoSearchMocks {
    constructor(){
        nock.disableNetConnect();
    }
    
    clean(){
        nock.cleanAll();
    }

    search({delay=1, code=200} = {}){
        this.search_nock = nock("https://api.search.nicovideo.jp");
        this.search_nock
            .get(/api\/v2\/video\/contents\/search\?.+/)
            .delay(delay)
            .times(Infinity)
            .reply(code, (uri, requestBody) => {
                const q = querystring.parse(uri);
                const text = q["/api/v2/video/contents/search?q"];
                const limit = parseInt(q["_limit"]);
                const offset = parseInt(q["_offset"]);
                const data = [];
                for (let j = 0; j < limit; j++) {
                    const tag_cnt = Math.floor(Math.random() * 5);
                    const tags = [];
                    for (let index = 0; index < tag_cnt; index++) {
                        tags.push(`tag${index+1}`);
                    }
                    data.push({
                        thumbnailUrl: `${__dirname}/img/sm${Math.floor(Math.random() * 10)}.jpeg`,
                        contentId: `sm${offset + j}`,
                        title: `title ${text} ${offset + j}`,
                        tags: tags.join(" "),
                        viewCounter: Math.floor(Math.random() * 100),
                        commentCounter: Math.floor(Math.random() * 100),
                        lengthSeconds: Math.floor(Math.random() * 300),
                        startTime: new Date(new Date().getTime() - Math.floor(Math.random() * 5000)).toISOString()
                    });
                }
                return [code, {
                    meta: { 
                        status: code,
                        totalCount: 1000,
                        id:"1234567890"
                    },
                    data: data
                }];
            });     
    }
}

class NicoDownLoadMocks {
    constructor(id, lowq_set, smile_set){
        this.id = id;
        this.video_fs = null;
        this.lowq_set = lowq_set;
        this.smile_set = smile_set;

        nock.disableNetConnect();
    }

    clean(){
        nock.cleanAll();
    }

    watch({delay=1, code=200} = {}){
        const headers = {
            "Set-Cookie": [
                "nicohistory=123456%3A123456789; path=/; domain=.nicovideo.jp",
                "nicosid=123456.789; path=/; domain=.nicovideo.jp"
            ]
        };
        this.watch_nock = nock("https://www.nicovideo.jp");
        this.watch_nock
            .get(`/watch/sm${this.id}`)
            .delay(delay)
            .times(Infinity)
            .reply(code, (uri, requestBody) => {
                return MockNicoUitl.getWatchHtml(this.id, this.smile_set.has(this.id));
            }, headers);
    } 

    dmc_session({delay=1, code=200} = {}){
        this.dmc_session_nock = nock("https://api.dmc.nico");
        this.dmc_session_nock
            .post("/api/sessions")
            .query({ _format: "json" })   
            .delay(delay)
            .times(Infinity)
            .reply((uri, reqbody)=>{
                const id = reqbody.session.recipe_id.match(/\d+/)[0];
                return [code, {
                    meta: { status: 201,message: "created" },
                    data: createSession(id, this.lowq_set.has(id))
                }];                    
            });
    }

    comment({delay=1, code=200} = {}){
        this.comment_nock = nock("https://nmsg.nicovideo.jp");
        this.comment_nock
            .post("/api.json/")
            .delay(delay)
            .times(Infinity)
            .reply((uri, reqbody)=>{
                return [code, comment];
            });
    }

    thumbnail({delay=1, code=200} = {}){
        this.thumbnail_nock = nock("https://tn.smilevideo.jp");
        this.thumbnail_nock
            .get("/smile")
            .query({ i: `${this.id}.L` }) 
            .delay(delay)
            .times(Infinity)
            .replyWithFile(code, `${__dirname}/data/sm${this.id}.jpeg`, {
                "Content-Type": "image/jpeg",
            });
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
            .times(Infinity)
            .reply((uri, reqbody)=>{
                return [code, "ok"];
            });
    } 

    closeStream(){
        if(this.video_fs){
            this.video_fs.close();
        }
    }

    dmc_video({delay=1, code=200} = {}){
        const file_path = `${__dirname}/data/sm${this.id}.mp4`;
        const stat = fs.statSync(file_path);
        const headers = {
            "Content-Type": "audio/mp4 ",
            "content-length": stat.size
        };
        this.dmc_video_nock = nock("https://pa0000.dmc.nico");
        this.dmc_video_nock
            .get(`/hlsvod/ht2_nicovideo/nicovideo-sm${this.id}`)
            .delay(delay)
            .times(Infinity)
            //.replyWithFile(code, file_path, headers);  
            .reply(code, (uri, requestBody) => {
                const sbuf = Math.floor(stat.size/(1638000));
                this.video_fs = fs.createReadStream(file_path, { highWaterMark: sbuf });
                return this.video_fs;
            },headers);
    }

    smile_video({delay=1, code=200, quality=""} = {}){
        const file_path = `${__dirname}/data/sm${this.id}.mp4`;
        const stat = fs.statSync(file_path);
        const headers = {
            "Content-Type": "audio/mp4 ",
            "content-length": stat.size
        };
        this.smile_video_nock = nock("https://smile-cls20.sl.nicovideo.jp");
        this.smile_video_nock
            .get("/smile")
            .query({ m: `${this.id}.67759${quality}`})
            .delay(delay)
            .times(Infinity)
            .reply(code, (uri, requestBody) => {
                const sbuf = Math.floor(stat.size/(1638000));
                this.video_fs = fs.createReadStream(file_path, { highWaterMark: sbuf });
                return this.video_fs;
            },headers);
    }
}

const createApiData = (id, is_smile) =>{
    const cp_data = JSON.parse(JSON.stringify(data_api_data));
    const video = cp_data.video;
    video.id = `sm${id}`;
    video.thumbnailURL = `https://tn.smilevideo.jp/smile?i=${id}`;
    video.largeThumbnailURL = `https://tn.smilevideo.jp/smile?i=${id}.L`;
    video.postedDateTime = "2018/01/01 01:00:00";
    if(is_smile===true){
        video.dmcInfo = null;
    }else{
        video.dmcInfo.video_id = `sm${id}`;
        video.dmcInfo.session_api.recipe_id = `nicovideo-sm${id}`;
    }
    video.smileInfo.url = `https://smile-cls20.sl.nicovideo.jp/smile?m=${id}.67759`;
    return cp_data;
};

const createSession = (id, is_low_quality) =>{
    const cp_data = JSON.parse(JSON.stringify(dmc_session));
    cp_data.session.id = id;
    cp_data.session.recipe_id = `nicovideo-sm${id}`;
    cp_data.session.content_uri = `https://pa0000.dmc.nico/hlsvod/ht2_nicovideo/nicovideo-sm${id}`;
    if(is_low_quality===true){
        cp_data.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux.video_src_ids[0] 
            = "archive_h264_600kbps_360p";
    }
    return cp_data;
};


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

    static getWatchHtml(id, is_smile){ 
        const data_api_data = MockNicoUitl._escapeHtml(JSON.stringify(createApiData(id, is_smile)));
        return `<!DOCTYPE html>
        <html lang="ja">
            <body>
            <div id="js-initial-watch-data" data-api-data="${data_api_data}"
            </body>
        </html>`;
    }
}

class NicoMylistMocks {
    constructor(){
        nock.disableNetConnect();
    }
    clean(){
        nock.cleanAll();
    }

    mylist({delay=1, code=200} = {}){
        const headers = {
            "Content-Type": "application/xml",
        };
        const host = "http://www.nicovideo.jp";
        this.myist_nock = nock(host);
        this.myist_nock
            .get(/mylist\/\d+/)
            .query({ rss: "2.0", numbers: 1, sort:1 })
            .delay(delay)
            .times(Infinity)
            .reply((uri, requestBody) => {
                const id = new URL(`${host}${uri}`).pathname.replace("/mylist/", "");
                const file_path = `${__dirname}/data/mylist${id}.xml`;
                try {
                    fs.statSync(file_path);
                    const xml = fs.readFileSync(file_path, "utf-8");
                    return [
                        200,
                        xml,
                        headers
                    ];
                } catch (error) {
                    return [
                        404,
                        "",
                        headers
                    ];                   
                }
            });
    }
}

const setupNicoDownloadNock = (target_nock, {
    watch_delay=1, watch_code=200, 
    dmc_session_delay=1, dmc_session_code=200, 
    comment_delay=1, comment_code=200, 
    thumbnail_delay=1, thumbnail_code=200, 
    hb_delay=1, hb_code=200, 
    video_delay=1, video_code=200}={}) => {

    target_nock.watch({ delay:watch_delay, code:watch_code });
    target_nock.dmc_session({delay:dmc_session_delay, code:dmc_session_code });
    target_nock.comment({ delay:comment_delay, code:comment_code });
    target_nock.thumbnail({ delay:thumbnail_delay, code:thumbnail_code });
    target_nock.dmc_hb({ options_delay:hb_delay, code:hb_code });
    target_nock.dmc_video({ delay:video_delay, code:video_code });  
    target_nock.smile_video({ delay:video_delay, code:video_code });  
};

module.exports = {
    NicoDownLoadMocks: NicoDownLoadMocks,
    NicoSearchMocks: NicoSearchMocks,
    setupNicoDownloadNock: setupNicoDownloadNock,
    NicoMylistMocks: NicoMylistMocks
};