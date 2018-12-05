const { get, post, head } = require("request-promise");
// const rp = require("request-promise");
const request = require("request");
const fs = require("fs");
const { JSDOM } = require("jsdom");

let cookieJar = request.jar();
// function asyncTest(url) {
//     return new Promise(async (resolve, reject) => {
//         const body = await get(url, {
//             jar: cookieJar,
//         });
//         // console.log(body);
//         resolve(body);
//     });
// }

class NicoNico{
    constructor(nico_url){
        this.cookieJar = request.jar();
        this.nico_url = nico_url | "http://www.nicovideo.jp";
        this.watch_url = `${nico_url}/watch`;
        this.heart_beat_rate = 0.9;
    }

    watch(video_id){
        return async ()=>{
            const url = `${this.watch_url}/${video_id}`;
            const body = await get(url, {
                jar: this.cookieJar,
            });
            const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
            this.api_data = JSON.parse(data_elm.getAttribute("data-api-data"));
            this.dmcInfo = this.api_data.video.dmcInfo;
        }; 
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
        return {
            url: this.nico_url, 
            nicohistory: nicohistory.value, 
            nicosid: nicosid.value
        };
    }

    isDmc(){
        return this.dmcInfo!=null;
    }

    getSmileUrl(){
        return this.api_data.video.smileInfo.url;
    }

    getDmcSession(){
        return {
            session: {
                recipe_id: this.dmcInfo.recipe_id,
                content_id: this.dmcInfo.content_id,
                content_type: "movie",
                content_src_id_sets: [{
                    content_src_ids: [{
                        src_id_to_mux: {
                            video_src_ids: this.dmcInfo.videos, audio_src_ids: this.dmcInfo.audios
                        }
                    }]
                }],
                timing_constraint: "unlimited",
                keep_method: { heartbeat: { lifetime: this.dmcInfo.heartbeat_lifetime } },
                protocol: {
                    name: this.dmcInfo.protocols[0],
                    parameters: {
                        http_parameters: {
                            parameters: {
                                hls_parameters: {
                                    segment_duration: 5000,
                                    transfer_preset: this.dmcInfo.transfer_presets[0],
                                    use_well_known_port: this.dmcInfo.urls[0].is_well_known_port ? "yes" : "no",
                                    use_ssl: this.dmcInfo.urls[0].is_ssl ? "yes" : "no"
                                }
                            }
                        }
                    }
                },
                content_uri: "",
                session_operation_auth: {
                    session_operation_auth_by_signature: {
                        token: this.dmcInfo.token, signature: this.dmcInfo.signature
                    }
                },
                content_auth: {
                    auth_type: this.dmcInfo.auth_types.http,
                    content_key_timeout: this.dmcInfo.content_key_timeout,
                    service_id: "nicovideo",
                    service_user_id: this.dmcInfo.service_user_id
                },
                client_info: { player_id: this.dmcInfo.player_id },
                priority: this.dmcInfo.priority
            } 
        };
    }

    postDmcSession(){
        return async ()=>{
            const uri = `${this.dmcInfo.session_api.urls[0].url}/?_format=json`;
            const options = {
                jar: this.cookieJar,
                headers: { "content-type": "application/json" },
                body: this.getDmcSessionRequest(),
                json: true
            };   
            const dmc_session_response = await post(uri, options);
            this.dmc_session_response = JSON.parse(dmc_session_response);
        }; 
    }

    getDmcContentUri(){
        return this.dmc_session_response.data.session.content_uri;
    }

    heartBeat(){
        const session = this.dmc_session_response.data.session;
        const id = session.id;
        const uri = `${this.dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
        const options = {
            jar: this.cookieJar,
            headers: { "content-type": "application/json" },
            body: session,
            json: true
        };   
        post(uri, options);       
    }

    startHeartBeat(){
        const interval_ms = this.dmcInfo.session_api.heartbeat_lifetime * this.heart_beat_rate;
        this.heart_beat_id = setInterval(()=>{
            this.heartBeat();
        }, interval_ms);
    }

    stopHeartBeat(){
        clearInterval(this.heart_beat_id);
    }
}

async function asyncTest(url) {
    const body = await get(url, {
        jar: cookieJar,
    });
    const ck = cookieJar.getCookies(url)[0];
    console.log("key=",ck.key);
    console.log("value=",ck.value);
    return body;
}

async function main(url) {
    const body = await asyncTest(url);
    const api_data = 
        new JSDOM(body).window.document.getElementById("js-initial-watch-data").getAttribute("data-api-data");
    const json = JSON.parse(api_data);
    fs.writeFile("./api_data.json", JSON.stringify(json), "utf-8", (err)=>{
        if(err){
            console.log(err);
        }
    });
    console.log("OK");
}


if(process.argv.length < 3)
{
    console.log("not find url");
    return;
}
const url = process.argv[2];
// const url = "http://www.nicovideo.jp/watch/sm29316071";
main(url);

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