const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("child_process");
const https = require("https");
const cheerio = require("cheerio");
const Hls = require("hls.js");
const { parseManifestM3u8, parseMediaM3u8 } = require('./nico-hls-parse-m3u8.js');

const user_agent = process.env["user_agent"];
const proxy_server = process.env["proxy_server"];

class NicoHls {
    constructor(tmp_dir){
        this._video_id = "";
        this._cancel = false;
        this._play_data_tmp_dir = path.join(tmp_dir, "_nicoview_tmp", "play_data");
        this._download_tmp_dir = path.join(tmp_dir, "_nicoview_tmp", "download");
    }

    async getHlsData(video_id, domand, watchTrackId, on_progress=(msg) => {}){
        this._video_id = video_id;
        // on_progress("start getDataApiData");
        // const data_api_data = await this.getDataApiData();
        on_progress("ContentUrl, Cookie取得");
        const {content_url, cookie} = await this.getContentUrlCookie(domand, watchTrackId);
        on_progress("M3u8取得");
        const hls_data = await this.getM3u8Data(content_url, cookie);
        return hls_data;
    }

    cancel(){
        this._cancel = true;
    }

    async download(video_id, domand, watchTrackId, 
        ffmpeg_path, dist_file_path, on_progress=(msg) => {}){
        on_progress("start setupDowloadDir");
        this.setupDowloadDir();
        
        const  {
            content_url,
            cookie,
            manifest_m3u8_map,
            video_m3u8_map,
            audio_m3u8_map,
            /** @type {Map} */
            key_data_map
        } = await this.getHlsData(video_id, domand, watchTrackId);

        if(this._cancel){
            return false;
        }

        on_progress("manifest m3u8取得");
        const work_dir = this._download_tmp_dir;
        const m = path.join(work_dir, "manifest.m3u8");
        await fs.promises.writeFile(m, manifest_m3u8_map.get("rep_text"));
        
        if(this._cancel){
            return false;
        }

        on_progress("video m3u8取得");
        const v = path.join(work_dir, 
            manifest_m3u8_map.get("video")[0].filename);
        await fs.promises.writeFile(v, video_m3u8_map.get("rep_text"));

        if(this._cancel){
            return false;
        }

        on_progress("audio m3u8取得");
        const a = path.join(work_dir, 
            manifest_m3u8_map.get("audio").filename);
        await fs.promises.writeFile(a, audio_m3u8_map.get("rep_text"));
        
        for (const key of key_data_map.keys()){
            if(this._cancel){
                return false;
            }
            const k = path.join(work_dir, key);
            await fs.promises.writeFile(k, key_data_map.get(key));
        }

        if(this._cancel){
            return false;
        }

        const video_keys = Array.from(video_m3u8_map.keys()).filter(key => {
            return key != "key" && key != "rep_text";
        });

        const audio_keys = Array.from(audio_m3u8_map.keys()).filter(key => {
            return key != "key" && key != "rep_text";
        });

        if(this._cancel){
            return false;
        }

        const filenum = video_keys.length + audio_keys.length;
        let download_count = 0;
        on_progress(`download ${download_count}/${filenum}`);

        for (const key of video_keys){
            if(this._cancel){
                return false;
            }

            const value = video_m3u8_map.get(key);
            const ret = await nicoHlsGet(value.uri, false, cookie);
            const f = path.join(work_dir, value.filename);
            await fs.promises.writeFile(f, ret.data);
            await new Promise(resolve => setTimeout(resolve, 500));

            download_count++;
            on_progress(`download ${download_count}/${filenum}`);
        }
        for (const key of audio_keys){
            if(this._cancel){
                return false;
            }

            const value = audio_m3u8_map.get(key);
            const ret = await nicoHlsGet(value.uri, false, cookie);
            const f = path.join(work_dir, value.filename);
            await fs.promises.writeFile(f, ret.data);
            await new Promise(resolve => setTimeout(resolve, 500));

            download_count++;
            on_progress(`download ${download_count}/${filenum}`);
        }

        on_progress("ffmpeg");
        await this.ffmpeg(ffmpeg_path, m, dist_file_path);

        return true;
    }
        
    async ffmpeg(ffmpeg_path, manifest_filepath, dist_file_path){
        return new Promise((resolve, reject) => {
            const pocess = spawn(`"${ffmpeg_path}"`, [
                "-allowed_extensions", "ALL", 
                "-protocol_whitelist", "file,http,https,tcp,tls,crypto",
                "-i", `"${path.basename(manifest_filepath)}"`, 
                "-c", "copy", `"${dist_file_path}"`
            ],
            { 
                cwd: path.dirname(manifest_filepath),
                shell: true
            });
            // pocess.stdout.on('data', function(chunk){
            //     const textChunk = chunk.toString('utf8');
            //     console.log(textChunk);
            // });
            // pocess.stderr.on('data', function(chunk){
            //     const textChunk = chunk.toString('utf8');
            //     console.error(textChunk);
            // });
            pocess.on("error", (error)=>{
                reject(error);
            });
            pocess.on("close", async (code) => { // eslint-disable-line no-unused-vars
                resolve();        
            });
        });
    }

    async setupDowloadDir(){
        if(fs.existsSync(this._download_tmp_dir)){
            await fs.promises.rmdir(this._download_tmp_dir, { recursive: true });
        }
        await fs.promises.mkdir(this._download_tmp_dir, { recursive: true });
    }

    async getDataApiData(){
        const url = `https://www.nicovideo.jp/watch/${this._video_id}`;
        const ret = await nicoHlsGet(url, true);
        const $ = cheerio.load(ret.data);
        const data_text = $("#js-initial-watch-data").attr("data-api-data");
        if(!data_text){
            throw new Error("not find data-api-data");
        }
        return JSON.parse(data_text);
    }

    async getContentUrlCookie(domand, watchTrackId){
        const right_key = domand.accessRightKey;
        const quality = getQuality(domand);
        // console.log("right_key=", right_key);
        // console.log("outputs=", quality.outputs);
        const wtid = watchTrackId;
        const url = `https://nvapi.nicovideo.jp/v1/watch/${this._video_id}/access-rights/hls?actionTrackId=${wtid}`;
        const {data, cookies} = await nicoHlsPost(url, right_key, 
            {
                "outputs": quality.outputs
            });
        // console.log("getContentUrlCookie data=", data);
        // console.log("cookies=", cookies);
        const content_url = JSON.parse(data).data.contentUrl;
        const cookie = cookies[0];
        return {
            content_url,
            cookie
        };
    }

    async getM3u8Data(content_url, cookie){
        const manifest_m3u8_res = await nicoHlsGet(content_url, true, cookie);
        const manifest_m3u8_map = parseManifestM3u8(manifest_m3u8_res.data);
        const video_m3u8_uri = manifest_m3u8_map.get("video")[0].uri;
        const audio_m3u8_uri = manifest_m3u8_map.get("audio").uri;

        const video_m3u8_ret = await nicoHlsGet(video_m3u8_uri, true, cookie);
        const video_m3u8_map = parseMediaM3u8(video_m3u8_ret.data);

        const audio_m3u8_ret = await nicoHlsGet(audio_m3u8_uri, true, cookie);
        const audio_m3u8_map = parseMediaM3u8(audio_m3u8_ret.data);

        const video_key_uri = video_m3u8_map.get("key").uri;
        const video_key_res = await nicoHlsGet(video_key_uri, false, cookie);

        const audio_key_uri = audio_m3u8_map.get("key").uri;
        const audio_key_res = await nicoHlsGet(audio_key_uri, false, cookie);

        const key_data_map = new Map();
        const video_key_fname = video_m3u8_map.get("key").filename;
        const audio_key_fname = audio_m3u8_map.get("key").filename;
        key_data_map.set(video_key_fname, video_key_res.data);
        key_data_map.set(audio_key_fname, audio_key_res.data);

        const file_map = await this.make_empyt_file(
            [
                "dummy.txt", 
                video_key_fname, 
                audio_key_fname
            ]);
        const dummy_url = file_map.get("dummy.txt");
        return  {
            content_url,
            cookie,
            manifest_m3u8_map,
            video_m3u8_map,
            audio_m3u8_map,
            key_data_map,
            dummy_url
        };
    }

    /**
     * 
     * @param {Array} filenames 
     */
    async make_empyt_file(filenames){
        if(!fs.existsSync(this._play_data_tmp_dir)){
            await fs.promises.mkdir(this._play_data_tmp_dir, { recursive: true });
        }
        const dict = new Map();
        filenames.forEach(fname => {
            const filepath = path.join(this._play_data_tmp_dir, fname);
            dict.set(fname, `file:///${filepath}`);
            if(!fs.existsSync(filepath)){
                fs.openSync(filepath, "w");
            }
        });
        return dict;
    }
}

const getQuality = (domand) => {
    // const domand = data_api_data.media.domand;
    /** @type {Array}  */
    const videos = domand.videos;
    videos.sort((a, b) => b.qualityLevel - a.qualityLevel);
    
    let is_max_quality = videos[0].isAvailable;

    const avai_videos = videos.filter(v => v.isAvailable);
    const video = avai_videos[0];
    if(video.label.includes("720")){
        // 720pなら最高画質とする
        is_max_quality = true;
    }

    /** @type {Array}  */
    const avai_audios = domand.audios.filter(v => v.isAvailable);
    avai_audios.sort((a, b) => b.qualityLevel - a.qualityLevel);
    const audio = avai_audios[0];

    return {
        is_max_quality: is_max_quality,
        label: video.label,
        outputs: [[video.id, audio.id]]
    };
};

const nicoHlsGet = (url, is_text, cookie) => {
    const data = [];
    return new Promise((resolve, reject) => {
        const _url = new URL(url);
        let options = {
            hostname: _url.hostname,
            path: `${_url.pathname}${_url.search}`,
            method: "GET",
            headers: {
                "User-Agent": user_agent,
            }
        };
        if(cookie !== undefined){
            options["headers"] = {
                "User-Agent": user_agent,
                "Cookie": cookie,
            };
        }
        if(proxy_server){
            const proxy_url = new URL(proxy_server);
            options = {
                hostname: proxy_url.hostname,
                port: proxy_url.port,
                path: url,
                method: "GET",
                headers: {
                    "User-Agent": user_agent,
                    "Cookie": cookie
                }
            };
        }

        const request = https.request(options, (response) => {
            const cookies = response.headers["set-cookie"];
            response.on("data", (chunk) => {
                data.push(chunk);
            });
            response.on("end", () => {
                if(is_text){
                    const str = data.join("");
                    resolve({ 
                        data: str, 
                        cookies : cookies
                    });
                }else{
                    const buffer = Buffer.concat(data);
                    resolve({
                        data: buffer, 
                        cookies : cookies
                    });
                }
            });
        });
        request.on("error", (e) => {
            reject(e);
        });
        request.end();
    });
};

const nicoHlsPost = (url, right_key, json_data) => {
    let data = "";
    return new Promise((resolve, reject) => {
        const headers = {
            "User-Agent": user_agent,
            "Content-Type": "application/json",
            "X-Access-Right-Key": right_key,
            "x-frontend-id": "6",
            "x-frontend-version": "0",
            "x-request-with": "https://www.nicovideo.jp",
        };
        const _url = new URL(url);
        let options = {
            hostname: _url.hostname,
            path: `${_url.pathname}${_url.search}`,
            method: "POST",
            headers: headers,
        };
        if(proxy_server){
            const proxy_url = new URL(proxy_server);
            options = {
                hostname: proxy_url.hostname,
                port: proxy_url.port,
                path: url,
                method: "POST",
                headers: headers
            };
        }
        const request = https.request(options, response => {
            const cookies = response.headers['set-cookie'];
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                resolve({ data, cookies });
            });
            response.on("error", (e) => {
                reject(e);
            });
        });
        request.write(JSON.stringify(json_data));
        request.end();
    });
};

class CustomLoader extends Hls.DefaultConfig.loader {
    constructor(config) {
        super(config);
        this.my_loader_data = config.my_loader_data;
        // TODO 再読み込みなどで破棄している最中にエラーになるので対応
        this.destroying = false;

        const load = this.load.bind(this);
        this.load = async (context, config, callbacks) => {
            if (context.type == 'manifest') {
                context.url = this.my_loader_data.dummy_url;
                const onSuccess = callbacks.onSuccess;
                callbacks.onSuccess = async (response, stats, context) => {
                    response.data = this.my_loader_data.manifest_m3u8_text;
                    onSuccess(response, stats, context);
                };
            } else if (context.type == 'level' || context.type == 'audioTrack') {
                context.url = this.my_loader_data.dummy_url;
                const onSuccess = callbacks.onSuccess;
                callbacks.onSuccess = async (response, stats, context) => {
                    if(context.type == 'level'){
                        response.data = this.my_loader_data.video_m3u8_map.get("rep_text");
                    }
                    if(context.type == 'audioTrack'){
                        response.data = this.my_loader_data.audio_m3u8_map.get("rep_text");
                    }
                    onSuccess(response, stats, context);
                };
            } else if(context.keyInfo !== undefined
                && context.keyInfo.decryptdata !== undefined
                && context.keyInfo.decryptdata.uri !== undefined){
                let key_data = undefined;
                /** @type {string} */
                const uri = context.keyInfo.decryptdata.uri;
                const fname = uri.split("/").pop();
                const key_data_map = this.my_loader_data.key_data_map;
                if(key_data_map.has(fname)){
                    key_data = key_data_map.get(fname);
                    const onSuccess = callbacks.onSuccess;
                    callbacks.onSuccess = function (response, stats, context) {
                        response.data = toArrayBuffer(key_data);
                        onSuccess(response, stats, context);
                    };
                }
            } else {
                let url = undefined;
                const fname = context.url.split("/").pop();
                const video_m3u8_map = this.my_loader_data.video_m3u8_map;
                const audio_m3u8_map = this.my_loader_data.audio_m3u8_map;
                if(video_m3u8_map.has(fname)){
                    url = video_m3u8_map.get(fname).uri;
                }
                if(audio_m3u8_map.has(fname)){
                    url = audio_m3u8_map.get(fname).uri;
                }
                if(url !== undefined){
                    context.url = this.my_loader_data.dummy_url;
                    const cookie = this.my_loader_data.cookie;
                    
                    const ret = await nicoHlsGet(url, false, cookie);
                    const buf = ret.data;
                    const onSuccess = callbacks.onSuccess;
                    callbacks.onSuccess = async (response, stats, context) => {
                        response.data = toArrayBuffer(buf);
                        onSuccess(response, stats, context);
                    };
                }
            }
            // TODO 破棄している最中の場合はそのまま抜ける
            if(this.destroying){
                return;
            }
            return load(context, config, callbacks);
        };
        // TODO destroyが呼ばれたらtrueにする
        const destroy = this.destroy.bind(this);
        this.destroy = () => {
            this.destroying = true;
            destroy();
        };

    }
}

const toArrayBuffer = (buffer) => {
    return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength);
};

module.exports = {
    getQuality,
    nicoHlsGet,
    toArrayBuffer,
    NicoHls,
    CustomLoader
};
