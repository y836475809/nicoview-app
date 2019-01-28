const { JSDOM } = require("jsdom");
const axios = require("axios");
const tough = require("tough-cookie");
// const axiosCookieJarSupport = require("axios-cookiejar-support").default;
// axiosCookieJarSupport(axios);
const client = axios.create({});
// axiosCookieJarSupport(client);

const nicovideo_url = "http://www.nicovideo.jp";
const niconmsg_url = "http://nmsg.nicovideo.jp/api.json/";

const ErrorHandling = (error)=> {
    if(axios.isCancel(error)){
        error.cancel = true;
        return error;
    }else{
        if (error.response) {
            error.name = "ResponseError";
            return error;
        }else if(error.request){
            error.name = "RequestError";
            return error;
        }
        return error;
    }
};

class NicoWatch {
    constructor(proxy) { 
        this.watch_url = `${nicovideo_url}/watch`;
        this.req = null;
        this.is_canceled = false;
        this.proxy = proxy;
        this.cancel_token = axios.CancelToken;
        this.source = null;
    }

    cancel() {
        if (this.source) {
            this.source.cancel("watch cancel");
            this.is_canceled = true;
        }
    }

    watch(video_id) {
        this.is_canceled = false;
        this.source = this.cancel_token.source();
        return new Promise((resolve, reject) => {
            // let cookie_jar = new tough.CookieJar();
            client.get(`${this.watch_url}/${video_id}`, {
                // jar: cookie_jar,
                withCredentials: true,
                timeout: 10 * 1000,
                proxy: this.proxy,
                cancelToken: this.source.token
            }).then((response) => {
                const body = response.data;
                try {
                    const cookie_headers = response.headers["Set-Cookie"];
                    let cookies;
                    if (cookie_headers instanceof Array){
                        cookies = cookie_headers.map(tough.Cookie.parse);
                    }else{
                        cookies = [tough.Cookie.parse(cookie_headers)];
                    }
                    const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
                    const data_json = data_elm.getAttribute("data-api-data");
                    if(!data_json){
                        reject(ErrorHandling(new Error("not find data-api-data"))); 
                    }else{
                        const api_data = JSON.parse(data_json);
                        resolve({ cookies, api_data }); 
                    }   
                } catch (error) {
                    reject(ErrorHandling(error)); 
                } 
            }).catch((error)=>{
                reject(ErrorHandling(error)); 
            });
        });
    }    
}

class NicoVideo {
    constructor(cookie_jar, api_data, proxy) {
        this.cookie_jar = cookie_jar;
        this.api_data = api_data;  
        this.dmcInfo = api_data.video.dmcInfo;  
        this.heart_beat_rate = 0.9;
        this.is_canceled = false;
        this.proxy = proxy;
        this.cancel_token = axios.CancelToken;
        this.source = null;
        this.source_hb_options = null;
        this.source_hb_post = null;
        this.heart_beat_id = null;
    }

    cancel() {
        if (this.source) {
            this.source.cancel("video cancel");
            this.stopHeartBeat();
            this.is_canceled = true;
        }
        
        if (this.source_hb_options) {
            this.source_hb_options.cancel("hb_options cancel");
            this.stopHeartBeat();
            this.is_canceled = true;
        }

        if (this.source_hb_post) {
            this.source_hb_post.cancel("hb_post cancel");
            this.stopHeartBeat();
            this.is_canceled = true;
        }
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
        this.is_canceled = false;
        this.source = this.cancel_token.source();
        return new Promise(async (resolve, reject) => {
            if (!this.DmcSession) {
                const error = new Error("dmc info is null");
                reject(error);
                return;
            }

            const url = `${this.dmcInfo.session_api.urls[0].url}?_format=json`;
            const json = this.DmcSession;
            axios.post(url, json, {
                // jar: cookie_jar,
                withCredentials: true,
                timeout: 10 * 1000,
                proxy: this.proxy,
                cancelToken: this.source.token,
            }).then((response) => {
                this.dmc_session = response.data.data;
                resolve(this.dmc_session);
            }).catch((error)=>{
                reject(ErrorHandling(error)); 
            });
        });
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    optionsHeartBeat() {
        this.source_hb_options = this.cancel_token.source();
        return new Promise(async (resolve, reject) => {
            this.stopHeartBeat();

            const id = this.dmc_session.session.id;
            const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;

            axios.options(url, {     
                withCredentials: true,   
                timeout: 10 * 1000,
                proxy: this.proxy ,
                cancelToken: this.source_hb_options.token,  
            }).then((response) => {
                resolve();
            }).catch((error)=>{
                reject(ErrorHandling(error)); 
            });
        });
    }
    
    postHeartBeat() {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
        const session = this.dmc_session;

        const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;    
        this.heart_beat_id = setInterval(() => {
            this.source_hb_post = this.cancel_token.source();
            axios.post(url, session, {
                timeout: 10 * 1000,
                withCredentials: true,
                proxy: this.proxy,
                cancelToken: this.source_hb_post.token,  
            }).catch((error)=>{
                this.stopHeartBeat();
            });
            console.log("HeartBeat ", new Date());
        }, interval_ms);
    }

    stopHeartBeat() {
        if (this.heart_beat_id) {
            console.log("stopHeartBeat");
            clearInterval(this.heart_beat_id);
            this.heart_beat_id = null;
        }
    }
}

class NicoCommnet {
    constructor(cookie_jar, api_data, proxy) {
        this.cookie_jar = cookie_jar;
        this.api_data = api_data;
        this.proxy = proxy;
        this.r_no = 0;
        this.p_no = 0;
        this.req = null;
        this.cancel_token = axios.CancelToken;
        this.source = null;
        this.is_canceled = false;
    }

    cancel() {
        if (this.source) {
            this.source.cancel("comment cancel");
            this.is_canceled = true;
        }
    }

    isSuccess(response){
        return response[2].thread.resultcode===0;
    }

    getCommnet() {
        const josn = this._get_commnet_json();
        return this._post(josn);
    }

    getCommnetDiff(res_from) {
        const josn = this._get_commnet_diff_json(res_from);
        return this._post(josn);
    }

    _get_commnet_json(){
        const josn = this.hasOwnerComment() ? 
            this.makeJsonOwner(this.r_no, this.p_no):this.makeJsonNoOwner(this.r_no, this.p_no); 
        this.r_no += 1;
        this.p_no += josn.length;
        return josn;       
    }

    _get_commnet_diff_json(res_from){
        const josn = this.makeJsonDiff(this.r_no, this.p_no, res_from);
        this.r_no += 1;
        this.p_no += josn.length;
        return josn;       
    }

    _post(post_data){
        this.is_canceled = false;
        this.source = this.cancel_token.source();
        return new Promise(async (resolve, reject) => {
            // const url = "http://nmsg.nicovideo.jp/api.json/";
            const json = post_data;
            axios.post(niconmsg_url, json, {
                // jar: cookie_jar,
                withCredentials: true,
                timeout: 10 * 1000,
                proxy: this.proxy,
                cancelToken: this.source.token,
            }).then((response) => {
                const comment_data = response.data;
                resolve(comment_data);
            }).catch((error)=>{
                reject(ErrorHandling(error)); 
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

function getCookies(cookies) {    
    const cookie_jsons = cookies.map(value=>{
        return value.toJSON();
    });
    const keys = ["nicohistory"];
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

/**
 * 
 * @param {Array} json 
 */
function ConvertJsonToComment(json){
    return json.filter((elm, index) => {
        return "chat" in json[index];
    }).map((elm) =>{
        return {
            no: elm.no,
            vpos: elm.vpos,
            date: elm.date,
            user_id: elm.user_id,
            mail: elm.mail ? elm.mail : "184",
            text: elm.content
        };
    });
}

function getVideoType(smile_url){
    //"https://smile-cls30.sl.nicovideo.jp/smile?v=XXXXXXX.XXXXX" => flv
    //"https://smile-cls30.sl.nicovideo.jp/smile?m=XXXXXXX.XXXXX" => mp4
    if(/.*\/smile\?v=.*/.test(smile_url)){
        return "flv";
    }
    if(/.*\/smile\?m=.*/.test(smile_url)){
        return "mp4";
    }

    throw new Error("not flv or mp4");
}

function getThumbInfo(api_data){
    const video = api_data.video;
    const thread = api_data.thread;
    const video_type = getVideoType(video.smileInfo.url);
    const owner = api_data.owner;
    const tags = api_data.tags.map((elm) => {
        return { 
            text: elm.name, 
            lock: elm.isLocked
        };
    });
    return {
        video_id: video.id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.largeThumbnailURL,
        length: video.duration,
        movie_type: video_type,
        view_counter: video.viewCount,
        comment_num: thread.commentCount,
        mylist_counter: video.mylistCount,
        tags: tags,
        user_id: owner.id,
        user_nickname: owner.nickname,
        user_icon_url: owner.iconURL
    };    
}

module.exports = {
    client: client,
    NicoWatch: NicoWatch,
    NicoVideo: NicoVideo,
    NicoCommnet: NicoCommnet,
    getCookies: getCookies,
    getThumbInfo: getThumbInfo
};