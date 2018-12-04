const { get, post, head } = require("request-promise");
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
    constructor(url, watch_url){
        this.cookieJar = request.jar();
        this.url = url | "http://www.nicovideo.jp/";
        this.watch_url = watch_url | "http://www.nicovideo.jp/watch/";
    }

    watch(video_id){
        return async ()=>{
            const url = `${this.watch_url}${video_id}`;
            const body = await get(url, {
                jar: this.cookieJar,
            });
            const data_elm = new JSDOM(body).window.document.getElementById("js-initial-watch-data");
            this.api_data = JSON.parse(data_elm.getAttribute("data-api-data"));
        }; 
    }

    isDmc(){
        return this.api_data.video.dmcInfo!=null;
    }

    getSmileUrl(){
        return this.api_data.video.smileInfo.url;
    }

    getSession(){
        const cookies = this.cookieJar.getCookies(this.url);
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
            url: this.url, 
            nicohistory: nicohistory.value, 
            nicosid: nicosid.value
        };
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