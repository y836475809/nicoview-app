const fs = require("fs");
const path = require("path");
const request = require("request");
const { NicoWatch, NicoVideo, NicoComment, getVideoType } = require("./niconico");

class DownlodRequest {
    constructor(){
        this.request = null;
        this.canceled = false;
    }

    cancel(){
        if(this.request){
            this.canceled = true;
            this.request.abort();
        }
    }

    download(url, cookie, dist_path, on_progress=(state)=>{}){
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            let content_len = 0;
            let current = 0 ;
            const options = {
                method: "GET",
                uri: url, 
                timeout: 5 * 1000
            };
            if(cookie){
                options.jar = cookie;
            }
            this.request = request(options, (error, res, body) => {
                if(error){
                    reject(error);
                }
            }).on("response", (res) => {
                content_len = res.headers["content-length"];
            }).on("data", (chunk) => {
                if(content_len > 0){
                    const pre_per = Math.floor((current/content_len)*100);
                    current += chunk.length;
                    const cur_per = Math.floor((current/content_len)*100);
                    if(cur_per > pre_per){
                        // console.log("progress: ", cur_per, "%");
                        on_progress(`${cur_per}%`);
                    }
                }
            }).on("abort", () => {
                if(this.canceled){
                    const error = new Error("cancel");
                    error.cancel = true;
                    reject(error);
                }
            }).pipe(fs.createWriteStream(dist_path))
                .on("error", (error) => { 
                    reject(error);
                })
                .on("close", () => {
                    on_progress("finish");
                    resolve();
                });
        });
    }

    download2(url, cookie, stream, on_progress=(state)=>{}){
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            let content_len = 0;
            let current = 0 ;
            const options = {
                method: "GET",
                uri: url, 
                timeout: 5 * 1000
            };
            if(cookie){
                options.jar = cookie;
            }
            this.request = request(options, (error, res, body) => {
                if(error){
                    reject(error);
                }
            }).on("response", (res) => {
                content_len = res.headers["content-length"];
            }).on("data", (chunk) => {
                if(content_len > 0){
                    const pre_per = Math.floor((current/content_len)*100);
                    current += chunk.length;
                    const cur_per = Math.floor((current/content_len)*100);
                    if(cur_per > pre_per){
                        // console.log("progress: ", cur_per, "%");
                        on_progress(`${cur_per}%`);
                    }
                }
            }).on("abort", () => {
                if(this.canceled){
                    const error = new Error("cancel");
                    error.cancel = true;
                    reject(error);
                }
            }).pipe(stream)
                .on("error", (error) => { 
                    reject(error);
                })
                .on("close", () => {
                    on_progress("finish");
                    resolve();
                });
        });
    }
}

class NicoNicoDownloder {
    constructor(){
    }

    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        }
        if(this.nico_comment){
            this.nico_watch.cancel();
        }  
        if(this.img_request){
            this.img_reuqest_canceled = true;
            this.img_request.cancel();
        }  
        if(this.nico_video){
            this.nico_video.cancel();
        }              
        if(this.video_download){
            this.video_download.cancel();
        }
    }

    async download(video_id, dist_dir, on_progress){
        try {
            this.nico_watch = new NicoWatch();
            const { cookie_jar, api_data } = await this.nico_watch.watch(video_id);

            this.nico_video = new NicoVideo(api_data);
            if(this.nico_video.isDmc()){
                const dmc_session = await this.nico_video.postDmcSession();
                if(!this._isDMCMaxQuality(api_data, dmc_session)){
                    return {
                        state: "skip",
                        reason: "low",
                        data: null
                    };
                }

                const fname = this._getName(api_data.video.title);
                await this._down1(dist_dir, fname, video_id, api_data);
                const db_data = await this._downloadDmc(fname, dist_dir, on_progress);
                return {
                    state: "ok",
                    reason: "",
                    data: db_data
                };
            }else{
                if(!this._isSmileMaxQuality(api_data)){
                    return {
                        state: "skip",
                        reason: "low",
                        data: null
                    };
                }
                const fname = this._getName(api_data.video.title);
                this._down1(dist_dir, fname, video_id, api_data);
                const db_data = await this._downloadSmile(api_data, cookie_jar, dist_dir);
                return {
                    state: "ok",
                    reason: "",
                    data: db_data
                };
            }
        } catch (error) {
            if(error.cancel){
                return {
                    state: "cancel",
                    reason: "",
                    data: null
                };
            }else{
                return {
                    state: "error",
                    reason: error,
                    data: null
                };
            }
        }
    }

    async _downloadDmc(name, dist_dir, on_progress){
        //cancel
        await this.nico_video.optionsHeartBeat();
        this.nico_video.postHeartBeat((error)=>{
            console.log("hb error=", error);
            //cancel
        });

        const api_data = this.nico_video.api_data;
        const video_id = api_data.video.id;
        const video_type = getVideoType(api_data.video.smileInfo.url);

        const video_url = this.nico_video.DmcContentUri;
        const video_filename = this._getVideoFilename(name, video_id, video_type);
        const video_filepath = path.join(dist_dir, video_filename);

        this.video_download = new DownlodRequest();
        // await this.video_download.download(video_url, null, video_filepath, on_progress);
        let ws = fs.createWriteStream(video_filepath);
        await this.video_download.download2(video_url, null, ws, on_progress);
        this.nico_video.stopHeartBeat();

        const current_time = new Date().getTime();
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        return {
            _data_type: "video",
            _db_type: "json",
            video_id: api_data.video.id,
            dirpath_id:1,
            video_name: api_data.video.title,
            video_filename: video_filename,
            video_type:`video/${video_type}`,
            is_economy:0,
            modification_date: current_time,
            creation_date: current_time,
            play_count:0,
            time: api_data.video.duration,
            last_play_date:-1,
            yet_reading:0,
            pub_date: new Date(api_data.video.postedDateTime).getTime(),
            tags:tags
        };
    }

    async _downloadSmile(api_data, cookie, dist_dir, on_progress){
        //cancel
        const url = api_data.video.smileInfo.url;
        const video_id = api_data.video.id;
        const video_type = getVideoType(url);
        const video_filename = this._getVideoFilename(name, video_id, video_type);
        const video_filepath = path.join(dist_dir, video_filename);

        this.video_download = DownlodRequest();
        await this.video_download.download(url, cookie, video_filepath, on_progress);

        const current_time = new Date().getTime();
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        return {
            _data_type: "video",
            _db_type: "json",
            video_id: api_data.video.id,
            dirpath_id:1,
            video_name: api_data.video.title,
            video_filename: video_filename,
            video_type:`video/${video_type}`,
            is_economy:0,
            modification_date: current_time,
            creation_date: current_time,
            play_count:0,
            time: api_data.video.duration,
            last_play_date:-1,
            yet_reading:0,
            pub_date: new Date(api_data.video.postedDateTime).getTime(),
            tags:tags
        };
    }

    async _down1(dist_dir, fname, video_id, api_data){
        this._writeJson(
            path.join(dist_dir, this._getThumbInfoFilename(fname, video_id)), 
            api_data);

        this.nico_comment = new NicoComment(api_data);
        const comments = await this.nico_comment.getComment();
        this._writeJson(
            path.join(dist_dir, this._getCommnetFilename(fname, video_id)), 
            comments);

        const thumbimg_data = await this._getThumbImg(api_data.video.largeThumbnailURL); 
        this._writeThumbImg(path.join(dist_dir, this._getThumbImgFilename(fname, video_id)), thumbimg_data);
    }

    /**
     * 
     * @param {string} filename 
     */
    _getName(title){
        // \/:?*"<>|
        return title
            .replace(/\\/g, "＼")
            .replace(/\//g, "／")
            .replace(/:/g, "：")
            .replace(/\?/g, "？")
            .replace(/\*/g, "＊")
            .replace(/</g, "＜")
            .replace(/>/g, "＞")
            .replace(/\|/g, "｜");
    }

    _writeJson(file_path, data){
        const json = JSON.stringify(data);
        fs.writeFileSync(file_path, json, "utf-8");
    }

    _getThumbImg(url){
        this.img_reuqest_canceled = false;
        return new Promise(async (resolve, reject) => {
            const options = {
                method: "GET", 
                uri: url, 
                encoding: null
            };

            this.img_request = request(options, (error, response, body)=>{
                if(error){
                    reject(error);
                }else if(response.statusCode === 200){
                    // fs.writeFileSync('a.png', body, 'binary');
                    resolve(body);
                } else {
                    reject(new Error(`statusCode=${response.statusCode}`));
                }
            }).on("abort", () => {
                if(this.img_reuqest_canceled){
                    const error = new Error("cancel");
                    error.cancel = true;
                    reject(error);
                }
            });
        });
    }
    
    _writeThumbImg(dist_path, data){
        // this.img_download = new DownlodRequest();
        // await this.img_download.download(url, null, dist_path);
        fs.writeFileSync(dist_path, data, "binary");
    }

    _getVideoFilename(name, id, video_type){
        return `${name} - [${id}].${video_type}`;
    }

    _getCommnetFilename(name, id){
        return `${name} - [${id}].json`;
    }

    _getThumbInfoFilename(name, id){
        return `${name} - [${id}][ThumbInfo].json`;
    }

    _getThumbImgFilename(name, id){
        return `${name} - [${id}][ThumbImg].jpeg`;
    }

    _isSmileMaxQuality(api_data){
        const url = api_data.video.smileInfo.url;
        return !/low/.test(url);
    }

    _isDMCMaxQuality(api_data, dmc_session){
        const quality = api_data.video.dmcInfo.quality;
        const max_quality = { 
            video: quality.videos[0].id,
            audio: quality.audios[0].id
        };
    
        const src_id_to_mux = 
            dmc_session.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux;
        const session_quality = { 
            video: src_id_to_mux.video_src_ids[0],
            audio: src_id_to_mux.audio_src_ids[0]
        };
    
        return max_quality.video == session_quality.video
            && max_quality.audio == session_quality.audio;
    }
}

module.exports = {
    NicoNicoDownloder: NicoNicoDownloder
};