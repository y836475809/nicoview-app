const rp = require("request-promise");
const request = require("request");
// const fs = require("fs");
const { JSDOM } = require("jsdom");

class NicoNico{
    constructor(nico_url){
        this.cookieJar = request.jar();
        this.nico_url = nico_url !== undefined ?  nico_url : "http://www.nicovideo.jp";
        this.watch_url = `${this.nico_url}/watch`;
        this.heart_beat_rate = 0.9;
        this.req = null;
    }

    cancel(){
        if(this.req){
            this.req.abort();
        }
    }

    watch(video_id){
        return new Promise(async (resolve, reject) => {
            this.dmcInfo = null;

            const options = {
                uri: `${this.watch_url}/${video_id}`,
                method: "GET",    
                jar: this.cookieJar,
                timeout: 10 * 1000
            };
            try {
                this.req = rp(options);
                await this.req.then((body) => {
                    const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
                    this.api_data = JSON.parse(data_elm.getAttribute("data-api-data"));
                    this.dmcInfo = this.api_data.video.dmcInfo;    
                }); 
                // console.log(this.dmcInfo.session_api.urls[0].url);
                resolve(this.api_data);            
            } catch (error) {
                reject(error);
            }
        });
    }

    getSession(){
        const cookies = this.cookieJar.getCookies(this.nico_url);
        const nicohistory = cookies.find((item)=>{
            return item.key == "nicohistory";
        });
        const nicosid = cookies.find((item)=>{
            return item.key == "nicosid";
        });
        if(!nicohistory || !nicosid){
            throw new Error("not find session");
        }

        return [
            {
                url: this.nico_url,
                name: nicohistory.key,
                value: nicohistory.value,
                domain: nicohistory.domain,
                path: nicohistory.path,
                secure: nicohistory.secure
            }, {
                url: this.nico_url,
                name: nicosid.key,
                value: nicosid.value,
                domain: nicosid.domain,
                path: nicosid.path,
                secure: nicosid.secure
            }
        ];
    }

    get SmileUrl(){
        return this.api_data.video.smileInfo.url;
    }

    isDmc(){
        return this.dmcInfo!=null;
    }

    get DmcSession(){
        if(!this.isDmc()){
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

    postDmcSession(){ 
        return new Promise(async (resolve, reject) => {
            if(!this.DmcSession){
                return reject("dmc info is null");
            }
            
            const options = {
                uri: `${this.dmcInfo.session_api.urls[0].url}?_format=json`,
                method: "POST",
                headers: { "content-type": "application/json" },   
                // jar: this.cookieJar,
                json: this.DmcSession
            };
            try {
                this.req = rp(options);
                await this.req.then((body) => {
                    // console.log(body.data.session.content_uri);
                    // this.dmc_session = JSON.parse(body); 
                    this.dmc_session = body.data;
                    // console.log(body.data.session.content_uri);
                });
                // .catch(errors.StatusCodeError, (reason)=> {
                //     reject(errors);
                // });
                resolve(this.dmc_session);
            } catch (error) {
                reject(error);
            } 
        });     
    }

    get DmcContentUri(){
        return this.dmc_session.session.content_uri;
    }

    heartBeat(url){
        const session = this.dmc_session;
        const options = {
            uri: url,
            method: "POST",
            // jar: this.cookieJar,
            headers: { "content-type": "application/json" },
            json: session
        };
        // rp(options);
        rp(options).catch((error)=>{
            // console.log("heartBeat error: ", error);
            throw new Error(error);
        });
    }

    startHeartBeat(on_error_heartbeat){
        return new Promise(async (resolve, reject) => {
            this.heart_beat_id = null;
            // const session = this.dmc_session;
            const id = this.dmc_session.session.id;
            const url = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
            
            const options = {
                uri: url,
                method: "OPTIONS",
                // headers: { "content-type": "application/json" },     
                // jar: this.cookieJar,
            };
            const session = this.dmc_session;
            const options2 = {
                uri: url,
                method: "POST",
                // jar: this.cookieJar,
                headers: { "content-type": "application/json" },
                json: session
            };
            try {
                await rp(options);

                const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;
                // const interval_ms = 2 * 1000;                
                this.heart_beat_id = setInterval(()=>{
                    rp(options2).catch((error)=>{
                        on_error_heartbeat(error);
                    });
                    // request(options2, (error, response, body) => {
                    //     console.log("statusCode=", response.statusCode);
                    //     if(response.statusCode===200 || response.statusCode===201){
                    //         console.log("HeartBeat");
                    //     }else{
                    //         //response.statusCode!==200 && response.statusCode!==201){
                    //         console.log("HeartBeat error");
                    //         on_error_heartbeat(new Error(response.statusCode));
                    //     }
                    //     if(error){
                    //         console.log("HeartBeat error");
                    //         on_error_heartbeat(error);
                    //     }
                    // });
                }, interval_ms);          
            } catch (error) {
                console.log("startHeartBeat errors=", error);
                reject(error);
            }
        });
    }

    stopHeartBeat(){
        if(this.heart_beat_id){
            console.log("stopHeartBeat");
            clearInterval(this.heart_beat_id);
        }
    }
}

// const url = "http://www.nicovideo.jp/watch/sm29316071";
// const url = "http://www.nicovideo.jp/watch/sm32951089";
async function main() {
    const niconico = new NicoNico("http://localhost:8084");
    try{
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