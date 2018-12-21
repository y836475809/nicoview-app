const rp = require("request-promise");
const request = require("request");
// const fs = require("fs");
const { JSDOM } = require("jsdom");

class NicoNico {
    constructor(nico_url, proxy) {
        this.cookieJar = request.jar();
        this.nico_url = nico_url !== undefined ? nico_url : "http://www.nicovideo.jp";
        this.watch_url = `${this.nico_url}/watch`;
        this.heart_beat_rate = 0.9;
        this.req = null;
        this.is_canceled = false;

        const option = proxy !== undefined ? { proxy: proxy } : {};
        this.def_rp = request.defaults(option);
    }

    cancel() {
        if (this.req) {
            this.req.cancel();
            this.is_canceled = true;
        }
    }

    watch(video_id) {
        this.is_canceled = false;

        return new Promise(async (resolve, reject) => {
            this.dmcInfo = null;

            const options = {
                uri: `${this.watch_url}/${video_id}`,
                method: "GET",
                jar: this.cookieJar,
                timeout: 10 * 1000
            };
            //try {
            this.req = this.def_rp(options);
            this.req.then((body) => {
                try {
                    const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
                    this.api_data = JSON.parse(data_elm.getAttribute("data-api-data"));
                    this.dmcInfo = this.api_data.video.dmcInfo;                
                } catch (error) {
                    reject(error);
                }
                resolve(this.api_data);
            }).catch((error)=>{
                reject(error);
            });
            // console.log(this.dmcInfo.session_api.urls[0].url);
            //resolve(this.api_data);
            // } catch (error) {
            //     reject(error);
            // }
        });
    }

    getNicoHistory() {
        const cookies = this.cookieJar.getCookies(this.nico_url);
        const nicohistory = cookies.find((item) => {
            return item.key == "nicohistory";
        });
        if (!nicohistory) {
            throw new Error("not find session");
        }

        return {
            // url: this.nico_url,
            name: nicohistory.key,
            value: nicohistory.value,
            domain: nicohistory.domain,
            path: nicohistory.path,
            secure: nicohistory.secure
        };
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
                timeout: 10 * 1000
            };
            //try {
            this.req = rp(options);
            this.req.then((body) => {
                // console.log(body.data.session.content_uri);
                // this.dmc_session = JSON.parse(body); 
                this.dmc_session = body.data;
                // console.log(body.data.session.content_uri);
                resolve(this.dmc_session);
            }).catch((error)=>{
                reject(error);
            });
            // .catch(errors.StatusCodeError, (reason)=> {
            //     reject(errors);
            // });
            //     resolve(this.dmc_session);
            // } catch (error) {
            //     reject(error);
            // }
        });
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    heartBeat(url) {
        const session = this.dmc_session;
        const options = {
            uri: url,
            method: "POST",
            // jar: this.cookieJar,
            headers: { "content-type": "application/json" },
            json: session,
            timeout: 10 * 1000
        };
        // rp(options);
        rp(options).catch((error) => {
            // console.log("heartBeat error: ", error);
            throw new Error(error);
        });
    }

    startHeartBeat(on_error_heartbeat) {
        return new Promise(async (resolve, reject) => {
            this.heart_beat_id = null;
            // const session = this.dmc_session;
            const id = this.dmc_session.session.id;
            const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;

            const options = {
                uri: url,
                method: "OPTIONS",
                timeout: 10 * 1000
                // headers: { "content-type": "application/json" },     
                // jar: this.cookieJar,
            };
            const session = this.dmc_session;
            const options2 = {
                uri: url,
                method: "POST",
                // jar: this.cookieJar,
                headers: { "content-type": "application/json" },
                json: session,
                timeout: 10 * 1000
            };
            try {
                await rp(options);

                const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;
                // const interval_ms = 2 * 1000;
                console.log("HeartBeat interval_ms=", interval_ms);
                this.stopHeartBeat();
                this.heart_beat_id = setInterval(() => {
                    rp(options2).catch((error) => {
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
    // constructor(cookie_jar, api_data) {
    //     this.cookie_jar = cookie_jar;
    //     this.api_data = api_data;
    //     this.r_no = 0;
    //     this.p_no = 0;
    //     this.req = null;
    // }
    constructor() {
        this.cookie_jar = null;
        this.api_data = null;
        this.r_no = 0;
        this.p_no = 0;
        this.req = null;
        this.is_canceled = false;
    }

    setParams(cookie_jar, api_data){
        this.cookie_jar = cookie_jar;
        this.api_data = api_data;
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
        const josn = this.hasOwnerComment() ? 
            this.makeJsonOwner(this.r_no, this.p_no):this.makeJsonNoOwner(this.r_no, this.p_no); 
        this.r_no += 1;
        this.p_no += josn.length;

        return this._post(josn);
    }

    getCommnetDiff(res_from) {
        const josn = this.makeJsonDiff(this.r_no, this.p_no, res_from);
        this.r_no += 1;
        this.p_no += josn.length;

        return this._post(josn);
    }

    _post(post_data){
        this.is_canceled = false;

        return new Promise(async (resolve, reject) => {
            const url = "http://nmsg.nicovideo.jp/api.json/";
            const json = post_data;
            const options = {
                uri: url,
                method: "POST",
                headers: { "content-type": "application/json" },
                jar: this.cookie_jar,
                json: json,
                timeout: 10 * 1000
            };
            // try {
            //     const comment_data = await rp(options);
            //     resolve(comment_data);
            // } catch (error) {
            //     reject(error);
            // }
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
        this._addCommand(cmds, p_no++, {
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
        this._addCommand(cmds, p_no++, {
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
        this._addCommand(cmds, p_no++, {
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

function ConvertApiDataToThumbInfo(api_data){
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
        // first_retrieve: first_retrieve,
        length: video.duration,
        movie_type: video_type,
        // size_high: size_high,
        // size_low: size_low,
        view_counter: video.viewCount,
        comment_num: thread.commentCount,
        mylist_counter: video.mylistCount,
        // last_res_body: last_res_body,
        // watch_url: watch_url,
        // thumb_type: thumb_type,
        // embeddable: embeddable,
        // no_live_play: no_live_play,
        tags: tags,
        user_id: owner.id,
        user_nickname: owner.nickname,
        user_icon_url: owner.iconURL
    };    
}

// const url = "http://www.nicovideo.jp/watch/sm29316071";
// const url = "http://www.nicovideo.jp/watch/sm32951089";
async function main() {
    const niconico = new NicoNico("http://localhost:8084");
    try {
        await niconico.watch("sm32951089");
        await niconico.postDmcSession();
        niconico.startHeartBeat((error) => {
            niconico.stopHeartBeat();
            console.log("HeartBeat error: ", error);
        });

        console.log("session_api.urls[0].url = ", niconico.dmcInfo.session_api.urls[0].url);
        console.log("DmcContentUri = ", niconico.DmcContentUri);
        // console.log("dmcInfo = ", niconico.dmcInfo);    
    } catch (error) {
        console.log("error: ", error);
    }
    console.log("watch finish");
}

// main();


module.exports = NicoNico;
module.exports = {
    NicoNico: NicoNico,
    NicoCommnet: NicoCommnet
};
//video.isOfficial=true で公式
//get xml comment
//url = video.thread.serverUrl
//thread_id = commentComposite.threads[0?1].id
//comment {url}thread?thread={thread_id}&version=20061206&res_from=-1000&scores=1
//owner comment {url}thread?thread={thread_id}&version=20061206&res_from=-1000&scores=1&fork=1

//video.dmcInfo.session_api.urlsのurl
//{url}?_format=json
//に下のjsonをpost
// session: {
//     recipe_id: dmcInfo.recipe_id,
//     content_id: dmcInfo.content_id,
//     content_type: "movie",
//     content_src_id_sets: [{
//         content_src_ids: [{
//             src_id_to_mux: {
//                 video_src_ids: dmcInfo.videos, audio_src_ids: dmcInfo.audios
//             }
//         }]
//     }],
//     timing_constraint: "unlimited",
//     keep_method: { heartbeat: { lifetime: dmcInfo.heartbeat_lifetime } },
//     protocol: hls ? this.protocolHLS() : this.protocolHTTP(),
//     content_uri: "",
//     session_operation_auth: {
//         session_operation_auth_by_signature: {
//             token: dmcInfo.token, signature: dmcInfo.signature
//         }
//     },
//     content_auth: {
//         auth_type: dmcInfo.auth_types.http,
//         content_key_timeout: dmcInfo.content_key_timeout,
//         service_id: "nicovideo",
//         service_user_id: dmcInfo.service_user_id
//     },
//     client_info: { player_id: dmcInfo.player_id },
//     priority: dmcInfo.priority
// }