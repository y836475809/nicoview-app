const cheerio = require("cheerio");
const { NicoRequest } = require("./nico-request");
const logger = require("./logger");

const nicovideo_url = "https://www.nicovideo.jp";
const niconmsg_url = "https://nmsg.nicovideo.jp/api.json/";


const getNicoURL = (video_id) => {
    return `${nicovideo_url}/watch/${video_id}`;
};

class NicoWatch extends NicoRequest{
    constructor() { 
        super();
        this.watch_url = `${nicovideo_url}/watch`;
        this.req = null;
    }

    cancel(){   
        if (this.req) {
            this._cancel();
            this.req.abort();
        }
    }

    watch(video_id){
        return new Promise((resolve, reject) => {
            const uri = `${this.watch_url}/${video_id}`;
            const options = {
                method: "GET",
                uri: uri, 
                timeout: 5 * 1000
            };
            this.req = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                    return;
                }

                const cookie_jar = this.getCookie(res.headers, uri);
                let $ = cheerio.load(body);
                const data_json = $("#js-initial-watch-data").attr("data-api-data");
                // const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
                // const data_json = data_elm.getAttribute("data-api-data");
                if(!data_json){
                    reject(new Error("not find data-api-data")); 
                }else{                     
                    const api_data = JSON.parse(data_json);
                    resolve({ cookie_jar, api_data }); 
                }
            });       
        });
    }
}

class NicoVideo extends NicoRequest {
    constructor(api_data, heart_beat_rate=0.9) {
        super();
        this.api_data = api_data;  
        this.dmcInfo = api_data.video.dmcInfo;

        this.heart_beat_rate = heart_beat_rate;
        this.heart_beat_id = null;

        this.req_session = null;
        this.req_hb_options = null;
        this.req_hb_post = null;
    }

    cancel() {
        if (this.req_session) {
            this._cancel();
            this.req_session.abort();
        }
        
        if (this.req_hb_options) {
            this._cancel();
            this.req_hb_options.abort();
        }

        if (this.req_hb_post) {
            this._cancel();
            this.req_hb_post.abort();
        }

        this.stopHeartBeat();
    }

    get SmileUrl() {
        return this.api_data.video.smileInfo.url;
    }

    isDmc() {
        return this.dmcInfo != null;
    }

    get DmcSession() {
        if (!this.isDmc()) {
            return null;
        }
        const session_api = this.dmcInfo.session_api;
        return {
            session: {
                recipe_id: session_api.recipe_id,
                content_id: session_api.content_id,
                content_type: "movie",
                content_src_id_sets: [{
                    content_src_ids: [{
                        src_id_to_mux: {
                            video_src_ids: session_api.videos,
                            audio_src_ids: session_api.audios
                        }
                    }]
                }],
                timing_constraint: "unlimited",
                keep_method: {
                    heartbeat: {
                        lifetime: session_api.heartbeat_lifetime
                    }
                },
                protocol: {
                    name: "http",
                    parameters: {
                        http_parameters: {
                            parameters: {
                                http_output_download_parameters: {
                                    use_well_known_port: "yes",
                                    use_ssl: "yes",
                                    transfer_preset: ""
                                }
                            }
                        }
                    }
                },
                content_uri: "",
                session_operation_auth: {
                    session_operation_auth_by_signature: {
                        token: session_api.token,
                        signature: session_api.signature
                    }
                },
                content_auth: {
                    auth_type: "ht2",
                    content_key_timeout: session_api.content_key_timeout,
                    service_id: "nicovideo",
                    service_user_id: session_api.service_user_id
                },
                client_info: {
                    player_id: session_api.player_id
                },
                priority: session_api.priority
            }
        };
    }

    postDmcSession() {
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            if (!this.DmcSession) {
                const error = new Error("dmc info is null");
                reject(error);
                return;
            }

            const url = `${this.dmcInfo.session_api.urls[0].url}?_format=json`;
            const json = this.DmcSession;
            
            const options = {
                method: "POST",
                uri: url, 
                headers: { "content-type": "application/json" },
                json: json,
                timeout: 5 * 1000
            };
            this.req_session = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                    return;
                }
                this.dmc_session = body.data;
                resolve(this.dmc_session);
            });
        });
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    optionsHeartBeat() {
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            this.stopHeartBeat();

            const id = this.dmc_session.session.id;
            const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;

            const options = {
                method: "OPTIONS",
                uri: url, 
                timeout: 5 * 1000
            };
            this.req_hb_options = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    
    postHeartBeat(on_error) {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
        const session = this.dmc_session;
        const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;   
        this.canceled = false;
        const options = {
            method: "POST",
            uri: url, 
            headers: { "content-type": "application/json" },
            json: session,
            timeout: 5 * 1000
        };
        this.heart_beat_id = setInterval(() => {  
            this.req_hb_post = this._reuqest(options, (error, res, body)=>{
                if(error){
                    this.stopHeartBeat();
                    on_error(error);
                }
            });

            logger.debug("nico video HeartBeat");
        }, interval_ms);
    }

    stopHeartBeat() {
        if (this.heart_beat_id) {
            logger.debug("nico video stop HeartBeat");
            clearInterval(this.heart_beat_id);
            this.heart_beat_id = null;
        }
    }
}

class NicoComment extends NicoRequest {
    constructor(api_data) {
        super();
        this.nmsg_ur = `${niconmsg_url}`;
        this.api_data = api_data;
        this.r_no = 0;
        this.p_no = 0;
        this.req = null;
    }

    cancel() {
        if (this.req) {
            this._cancel();
            this.req.abort();
        }
    }

    isSuccess(response){
        return response[2].thread.resultcode===0;
    }

    getComment() {
        const josn = this._get_comment_json();
        return this._post(josn);
    }

    getCommentDiff(res_from) {
        const josn = this._get_comment_diff_json(res_from);
        return this._post(josn);
    }

    _get_comment_json(){
        const josn = this.hasOwnerComment() ? 
            this.makeJsonOwner(this.r_no, this.p_no):this.makeJsonNoOwner(this.r_no, this.p_no); 
        this.r_no += 1;
        this.p_no += josn.length;
        return josn;       
    }

    _get_comment_diff_json(res_from){
        const josn = this.makeJsonDiff(this.r_no, this.p_no, res_from);
        this.r_no += 1;
        this.p_no += josn.length;
        return josn;       
    }

    _post(post_data){
        return new Promise(async (resolve, reject) => {
            const uri = `${this.nmsg_ur}`;
            const json = post_data;
            const options = {
                method: "POST",
                uri: uri, 
                headers: { "content-type": "application/json" },
                json: json,
                timeout: 5 * 1000
            };
            this.req = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                    return;
                }
                const comment_data = body;
                resolve(comment_data);    
            });
        });
    }

    hasOwnerComment() {
        const comment_composite = this.api_data.commentComposite;
        return comment_composite.threads[0].isActive;
    }

    _getContentLen(duration) {
        return Math.ceil(duration / 60);
    }

    _getPing(name, value){
        return { ping: { content: `${name}:${value}` } };
    }

    _addCommand(cmds, p_no, cmd_obj){
        cmds.push(this._getPing("ps", p_no));
        cmds.push(cmd_obj);
        cmds.push(this._getPing("pf", p_no));
    }

    makeJsonNoOwner(r_no, p_no) {
        //no owner
        const comment_composite = this.api_data.commentComposite;
        const thread = comment_composite.threads[1].id;
        const fork = comment_composite.threads[1].fork;
        const content_len = this._getContentLen(this.api_data.video.duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread,
                version: "20090904",
                fork: fork,
                language: 0,
                user_id: "",
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });
        this._addCommand(cmds, ++p_no, {
            thread_leaves: {
                thread: thread,
                language: 0,
                user_id: "",
                content: `0-${content_len}:100,1000`,
                scores: 1,
                nicoru: 0
            }
        });
        cmds.push(this._getPing("rf", r_no));
        
        return cmds;
    }

    makeJsonOwner(r_no, p_no) {
        //owner
        const comment_composite = this.api_data.commentComposite;
        const thread0 = comment_composite.threads[0].id;
        const fork0 = comment_composite.threads[0].fork;
        const thread1 = comment_composite.threads[1].id;
        const fork1 = comment_composite.threads[1].fork;
        const content_len = this._getContentLen(this.api_data.video.duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread0,
                version: "20061206",
                fork: fork0,
                language: 0,
                user_id: "",
                res_from: -1000,
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });
        this._addCommand(cmds, ++p_no, {
            thread: {
                thread: thread1,
                version: "20090904",
                fork: fork1,
                language: 0,
                user_id: "",
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });   
        this._addCommand(cmds, ++p_no, {
            thread_leaves: {
                thread: thread0,
                language: 0,
                user_id: "",
                content: `0-${content_len}:100,1000`,
                scores: 1,
                nicoru: 0
            }
        });         
        cmds.push(this._getPing("rf", r_no));
        return cmds;
    }

    makeJsonDiff(r_no, p_no, res_from) {
        const comment_composite = this.api_data.commentComposite;
        const thread1 = comment_composite.threads[1].id;
        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread1,
                version: "20061206",
                fork: 0,
                language: 0,
                user_id: "",
                res_from: res_from,
                with_global: 1,
                scores: 0,
                nicoru: 0
            }
        });  
        cmds.push(this._getPing("rf", r_no));

        return cmds;
    }
}

class NicoThumbnail extends NicoRequest {
    constructor() { 
        super();
        this.req = null;
    }
    cancel(){
        if (this.req) {
            this._cancel();
            this.req.abort();
        }
    }  
    getThumbImg(uri){
        return new Promise((resolve, reject) => {
            const options = {
                method: "GET",
                uri: uri, 
                encoding: null,
                timeout: 5 * 1000
            };
            this.req = this._reuqest(options, (error, res, body)=>{
                if(error){
                    reject(error);
                    return;
                }
                resolve(body);
            });  
        });       
    }
}

function getCookies(cookie_jar) {  
    const cookies = cookie_jar.getCookies(`${nicovideo_url}`);
    const cookie_jsons = cookies.map(value=>{
        return value.toJSON();
    });  
    const keys = ["nicohistory", "nicosid"];
    const nico_cookies = keys.map(key=>{
        const cookie = cookie_jsons.find((item) => {
            return item.key == key;
        });
        if (!cookie) {
            throw new Error(`not find ${key}`);
        }
        // cookie.expires
        return {
            url: nicovideo_url,
            name: cookie.key,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure==undefined?false:true
        };        
    });
    return nico_cookies;
}

module.exports = {
    NicoWatch: NicoWatch,
    NicoVideo: NicoVideo,
    NicoComment: NicoComment,
    NicoThumbnail: NicoThumbnail,
    getCookies: getCookies,
    getNicoURL
};