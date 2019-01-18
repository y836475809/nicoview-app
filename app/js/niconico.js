const rp = require("request-promise");
const { JSDOM } = require("jsdom");
const axios = require("axios");
const tough = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
axiosCookieJarSupport(axios);
const CancelToken = axios.CancelToken;

const nicovideo_url = "http://www.nicovideo.jp";
const niconmsg_url = "http://nmsg.nicovideo.jp/api.json/";

class NicoWatch {
    constructor(proxy) {  
        this.watch_url = `${nicovideo_url}/watch`;
        this.req = null;
        this.is_canceled = false;
        this.proxy = proxy;
        this.cancel_token = axios.CancelToken;
        this.source = null;
        this.fcancel = { exec: null };
    }

    cancel() {
        if (this.source) {
            this.source.cancel("watch cancel");
            // this.source = null;
            // this.source = this.cancel_token.source();
            this.is_canceled = true;
        }
        // if (this.fcancel.exec) {
        //     console.log("cancel ##################")
        //     this.fcancel.exec("watch cancel");
        //     this.is_canceled = true;
        // }
    }

    watch(video_id, on_cancel) {
        this.is_canceled = false;
        this.source = this.cancel_token.source();
        return new Promise((resolve, reject) => {
            // let self = this;
            let cookie_jar = new tough.CookieJar();
            axios.get(`${this.watch_url}/${video_id}`, {
                jar: cookie_jar,
                withCredentials: true,
                timeout: 10 * 1000,
                proxy: {
                    host: this.proxy.host,
                    port: this.proxy.port
                },
                cancelToken: this.source.token
                // cancelToken: new CancelToken((c) => {
                //     // An executor function receives a cancel function as a parameter
                //     this.fcancel.exec = c;                    
                // })
            }).then((response) => {
                const body = response.data;
                try {
                    const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
                    const data_json = data_elm.getAttribute("data-api-data");
                    if(!data_json){
                        reject({error: {message:"not find data-api-data"}});
                    }else{
                        const api_data = JSON.parse(data_json);
                        resolve({ cookie_jar, api_data }); 
                    }   
                } catch (error) {
                    reject({error: error});
                } 
            }).catch((error)=>{
                if(axios.isCancel(error)){
                    if(on_cancel!=undefined){
                        // resolve(error.message);
                        on_cancel(error.message); 
                    }
                }else{
                    if (error.response) {
                        reject({
                            status: error.response.status,
                            data: error.response.data
                        });
                    }else if(error.request){
                        reject({
                            code: error.code,
                            message: error.message
                        });
                    }else{
                        reject({error: error});
                    }
                }
            });

            // let cookie_jar = rp.jar();
            // const options = {
            //     uri: `${this.watch_url}/${video_id}`,
            //     method: "GET",
            //     jar: cookie_jar,
            //     timeout: 10 * 1000,
            //     proxy: this.proxy
            // }; 
            // this.req = rp(options);  
            // this.req.then((body) => {
            //     let api_data = null;
            //     try {
            //         const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
            //         api_data = JSON.parse(data_elm.getAttribute("data-api-data"));               
            //     } catch (error) {
            //         reject(error);
            //     }
            //     resolve({ cookie_jar, api_data });
            // }).catch((error)=>{
            //     reject(error);
            // });
        });
    }    
}

class NicoVideo {
    constructor(cookie_jar, api_data, proxy) {
        this.cookie_jar = cookie_jar;
        this.api_data = api_data;  
        this.dmcInfo = api_data.video.dmcInfo;  
        this.heart_beat_rate = 0.9;
        this.req = null;
        this.is_canceled = false;
        this.proxy = proxy;
    }

    cancel() {
        if (this.req) {
            this.req.cancel();
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
        return new Promise(async (resolve, reject) => {
            if (!this.DmcSession) {
                return reject("dmc info is null");
            }

            const options = {
                uri: `${this.dmcInfo.session_api.urls[0].url}?_format=json`,
                method: "POST",
                headers: { "content-type": "application/json" },
                // jar: this.cookieJar,
                json: this.DmcSession,
                timeout: 10 * 1000,
                proxy: this.proxy
            };
            this.req = rp(options);  
            this.req.then((body) => {
                this.dmc_session = body.data;
                resolve();
            }).catch((error)=>{
                reject(error);
            });
        });
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    startHeartBeat(on_error_heartbeat) {
        return new Promise(async (resolve, reject) => {
            this.heart_beat_id = null;
            const id = this.dmc_session.session.id;
            const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;

            const options = {
                uri: url,
                method: "OPTIONS",
                timeout: 10 * 1000,
                proxy: this.proxy    
                // jar: this.cookieJar,
            };
            const session = this.dmc_session;
            const options2 = {
                uri: url,
                method: "POST",      
                headers: { "content-type": "application/json" },
                json: session,
                timeout: 10 * 1000,
                // jar: this.cookieJar,
                proxy: this.proxy
            };   
            try {
                await rp(options);

                const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;
                this.stopHeartBeat();
                this.heart_beat_id = setInterval(() => {
                    rp(options2).catch((error) => {
                        console.log("startHeartBeat errors=", error);
                        on_error_heartbeat(error);
                    });
                    console.log("HeartBeat ", new Date());
                }, interval_ms);
            } catch (error) {
                console.log("startHeartBeat errors=", error);
                reject(error);
            }
        });
    }

    stopHeartBeat() {
        if (this.heart_beat_id) {
            console.log("stopHeartBeat");
            clearInterval(this.heart_beat_id);
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
        this.is_canceled = false;
    }

    cancel() {
        if (this.req) {
            this.req.cancel();
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

        return new Promise(async (resolve, reject) => {
            // const url = "http://nmsg.nicovideo.jp/api.json/";
            const json = post_data;
            const options = {
                uri: niconmsg_url,
                method: "POST",
                headers: { "content-type": "application/json" },
                jar: this.cookie_jar,
                json: json,
                proxy: this.proxy,
                timeout: 10 * 1000
            };
            this.req = rp(options);
            this.req.then((comment_data) => {
                resolve(comment_data);
            }).catch((error)=>{
                reject(error);
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

function getCookies(cookie_jar) {
    // console.log("cookies cookies toJSON=", cookie_jar.toJSON());
    const cookies = cookie_jar.toJSON().cookies;
    // cookie_jar.getCookies("nicovideo.jp", function(err, cookies) {
    //     console.log("cookies cookies=", cookies);
    // });
    // const cookies = cookie_jar.getCookies(nicovideo_url);
    const keys = ["nicohistory", "nicosid"];
    const nico_cookies = keys.map(key=>{
        const cookie = cookies.find((item) => {
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
    NicoWatch: NicoWatch,
    NicoVideo: NicoVideo,
    NicoCommnet: NicoCommnet,
    getCookies: getCookies,
    getThumbInfo: getThumbInfo
};