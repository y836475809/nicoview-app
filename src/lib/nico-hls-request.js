const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("child_process");
const Hls = require("hls.js");
const { parseManifestM3u8, parseMediaM3u8 } = require('./nico-hls-parse-m3u8.js');
const { fetchGet, fetchContentUrl } = require("./nico-fetch");

async function getJson(url){
    const res = await fetchGet(url, null);
    return await res.json();
}
async function getText(url){
    const res = await fetchGet(url, null);
    return await res.text();
}
async function getBinary(url){
    const res = await fetchGet(url, null);
    const arrsyBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrsyBuf);
    const uint8Array = new Uint8Array(buf);
    return uint8Array;
}

class NicoHls {
    constructor(tmp_dir){
        this._video_id = "";
        this._cancel = false;
        this._play_data_tmp_dir = path.join(tmp_dir, "_nicoview_tmp", "play_data");
        this._download_tmp_dir = path.join(tmp_dir, "_nicoview_tmp", "download");
    }

    async getHlsData(video_id, domand, watchTrackId, accessRightKey, on_progress=(msg) => {}){
        this._video_id = video_id;
        // on_progress("start getDataApiData");
        // const data_api_data = await this.getDataApiData();
        on_progress("ContentUrl, Cookie取得");
        const content_url = await fetchContentUrl(video_id, watchTrackId, accessRightKey, domand);
        on_progress("M3u8取得");
        const hls_data = await this.getM3u8Data(content_url);
        return hls_data;
    }

    cancel(){
        this._cancel = true;
    }

    async download(video_id, domand, watchTrackId, accessRightKey,
        ffmpeg_path, dist_file_path, on_progress=(msg) => {}){
        on_progress("start setupDowloadDir");
        this.setupDowloadDir();
        
        const  {
            manifest_m3u8_map,
            video_m3u8_map,
            audio_m3u8_map,
            /** @type {Map} */
            key_data_map
        } = await this.getHlsData(video_id, domand, watchTrackId, accessRightKey);

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
            const data = await getBinary(value.uri);
            const f = path.join(work_dir, value.filename);
            await fs.promises.writeFile(f, data);
            await new Promise(resolve => setTimeout(resolve, 500));

            download_count++;
            on_progress(`download ${download_count}/${filenum}`);
        }
        for (const key of audio_keys){
            if(this._cancel){
                return false;
            }

            const value = audio_m3u8_map.get(key);
            const data = await getBinary(value.uri);
            const f = path.join(work_dir, value.filename);
            await fs.promises.writeFile(f, data);
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

    async getM3u8Data(content_url){
        const manifest_m3u8_res = await getText(content_url);
        const manifest_m3u8_map = parseManifestM3u8(manifest_m3u8_res);
        const video_m3u8_uri = manifest_m3u8_map.get("video")[0].uri;
        const audio_m3u8_uri = manifest_m3u8_map.get("audio").uri;

        const video_m3u8_ret = await getText(video_m3u8_uri);
        const video_m3u8_map = parseMediaM3u8(video_m3u8_ret);

        const audio_m3u8_ret = await getText(audio_m3u8_uri);
        const audio_m3u8_map = parseMediaM3u8(audio_m3u8_ret);

        const video_key_uri = video_m3u8_map.get("key").uri;
        const video_key_res = await getBinary(video_key_uri);

        const audio_key_uri = audio_m3u8_map.get("key").uri;
        const audio_key_res = await getBinary(audio_key_uri);

        const key_data_map = new Map();
        const video_key_fname = video_m3u8_map.get("key").filename;
        const audio_key_fname = audio_m3u8_map.get("key").filename;
        key_data_map.set(video_key_fname, video_key_res);
        key_data_map.set(audio_key_fname, audio_key_res);
        return  {
            manifest_m3u8_map,
            video_m3u8_map,
            audio_m3u8_map,
            key_data_map
        };
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

class NicoCustomLoader extends Hls.DefaultConfig.loader {
    load(context, config, callbacks) {
        context.url = context.url.replace('https://', 'my-app://');
        super.load(context, config, callbacks);
    }
}

module.exports = {
    getQuality,
    NicoHls,
    NicoCustomLoader
};
