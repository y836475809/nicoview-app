const fs = require("fs");
const path = require("path");
const request = require("request");
const { NicoWatch, NicoVideo, NicoComment, getVideoType, filterCommnets } = require("./niconico");

const validateStatus = (status) => {
    return status >= 200 && status < 300;
};

class DownloadRequest {
    constructor(url, cookie){
        this.url = url;
        this.cookie = cookie;
        this.req = null;
        this.canceled = false;
    }

    cancel(){
        if(this.req){
            this.canceled = true;
            this.req.abort();
        }
    }

    download(stream, on_progress=(state)=>{}){
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            let content_len = 0;
            let current = 0 ;
            const options = {
                method: "GET",
                uri: this.url, 
                jar: this.cookie,
                timeout: 5 * 1000
            };
            this.req = request(options, (error, res, body) => {
                if(error){
                    reject(error);
                }
                else if(validateStatus(res.statusCode)){
                    reject(new Error(`${res.statusCode}:${this.url}`));
                }
            }).on("error", (error) => {
                reject(error);
            }).on("response", (res) => {
                if(validateStatus(res.statusCode)){
                    content_len = res.headers["content-length"];

                    stream.on("error", (error) => { 
                        reject(error);
                    }).on("close", () => {
                        on_progress("finish");
                        resolve();
                    });
                }else{
                    reject(new Error(`${res.statusCode}:${this.url}`));
                }
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
            });

            this.req.pipe(stream);
        });
    }
}

class NicoNicoDownloader {
    constructor(video_id, dist_dir, only_max_quality=true){
        this.video_id = video_id;
        this.dist_dir = dist_dir;
        this.only_max_quality = only_max_quality;
    }

    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        }
        if(this.nico_video){
            this.nico_video.cancel();
        }   
        if(this.nico_comment){
            this.nico_comment.cancel();
        }  
        if(this.img_request){
            this.img_reuqest_canceled = true;
            this.img_request.abort();
        }         
        if(this.video_download){
            this.video_download.cancel();
        }
    }

    async download(on_progress){
        try {
            on_progress("start getting watch");
            await this._getWatchData(this.video_id);
            await this._getVideoInfo();

            if(this.only_max_quality){
                if(!this.videoinfo.maxQuality){
                    return {
                        state: "cancel",
                        reason: "low quality"
                    };
                }
            }

            on_progress("start getting thumbinfo");
            this._writeJson(this._getThumbInfoFilePath(), this._getThumbInfo());

            on_progress("start getting commnet");
            this._writeJson(this._getCommnetFilePath(), await this._getCommnet());

            on_progress("start getting thumbimg");
            this._writeBinary(this._getThumbImgFilePath(), await this._getThumbImg());

            const stream = this._createStream(this._getVideoFilePath());
            if(this.videoinfo.server=="dmc"){
                on_progress("start getting dmc");
                await this._getVideoDmc(stream, on_progress);
            }else{
                on_progress("start getting smile");
                await this._getVideoSmile(stream, on_progress);
            }

            return {
                state: "ok",
                reason: ""
            };
        } catch (error) {
            if(error.cancel){
                return {
                    state: "cancel",
                    reason: "cancel"
                };
            }

            return {
                state: "error",
                reason: error
            };
        }
    }

    async _getWatchData(video_id){
        this.nico_watch = new NicoWatch();
        this.watch_data = await this.nico_watch.watch(video_id);
    }

    async _getVideoInfo(){
        const api_data = this.watch_data.api_data;
        this.nico_video = new NicoVideo(this.watch_data.api_data);

        if(this.nico_video.isDmc()){
            const dmc_session = await this.nico_video.postDmcSession();
            this.videoinfo = {
                server: "dmc",
                maxQuality: this._isDMCMaxQuality(api_data, dmc_session)
            };
        }else{
            this.videoinfo = {
                server: "smile",
                maxQuality: this._isSmileMaxQuality(api_data)
            };
        }        
    }

    _getThumbInfo(){
        const api_data = this.watch_data.api_data;
        return {
            video: {
                id: api_data.video.id,
                title: api_data.video.title, 
                description: api_data.video.description, 
                thumbnailURL: api_data.video.thumbnailURL, 
                largeThumbnailURL: api_data.video.largeThumbnailURL, 
                postedDateTime: api_data.video.postedDateTime, 
                duration: api_data.video.duration, 
                viewCount: api_data.video.viewCount, 
                mylistCount: api_data.video.mylistCount, 
                movieType: api_data.video.movieType,
            },
            tags: api_data.tags,
            owner: {
                id: api_data.owner.id, 
                nickname: api_data.owner.nickname,
                iconURL: api_data.owner.iconURL,
            }
        };
    }
    async _getCommnet(){
        const api_data = this.watch_data.api_data;
        this.nico_comment = new NicoComment(api_data);
        const comments = await this.nico_comment.getComment();
        return filterCommnets(comments);
    }

    _getThumbImg(){
        const api_data = this.watch_data.api_data;
        const url = api_data.video.largeThumbnailURL;
        this.img_reuqest_canceled = false;

        return new Promise(async (resolve, reject) => {
            const options = {
                method: "GET", 
                uri: url, 
                timeout: 5 * 1000,
                encoding: null
            };

            this.img_request = request(options, (error, response, body)=>{
                if(error){
                    reject(error);
                }else if(validateStatus(response.statusCode)){
                    resolve(body);
                } else {
                    reject(new Error(`${response.statusCode}:${url}`));
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

    _createStream(dist_path){
        return fs.createWriteStream(dist_path);
    }

    async _getVideoDmc(stream, on_progress){
        //cancel
        await this.nico_video.optionsHeartBeat();
        this.nico_video.postHeartBeat((error)=>{
            console.log("hb error=", error);
            //cancel
        });

        const { cookie_jar } = this.watch_data;
        const video_url = this.nico_video.DmcContentUri;

        this.video_download = new DownloadRequest(video_url, cookie_jar);
        await this.video_download.download(stream, on_progress);
        this.nico_video.stopHeartBeat();
    }

    async _getVideoSmile(stream, on_progress){
        //cancel
        const { cookie_jar, api_data } = this.watch_data;
        const url = api_data.video.smileInfo.url;

        this.video_download = new DownloadRequest(url, cookie_jar);
        await this.video_download.download(stream, on_progress);
    }   

    getdd(){
        const { api_data } = this.watch_data;
        const video_id = api_data.video.id;
        const video_type = getVideoType(api_data.video.smileInfo.url);
        const video_filename = this._getVideoFilename();
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        return {
            video_id: video_id,
            video_name: api_data.video.title,
            video_filename: video_filename,
            video_type: video_type,
            max_quality: this.videoinfo.maxQuality,
            time: api_data.video.duration,
            pub_date: new Date(api_data.video.postedDateTime).getTime(),
            tags: tags
        };      
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

    _writeBinary(file_path, data){
        fs.writeFileSync(file_path, data, "binary");
    }

    _getVideoFilename(){
        const { api_data } = this.watch_data;
        const video_type = getVideoType(api_data.video.smileInfo.url);
        return `${this.video_id}.${video_type}`;
    }

    _getVideoFilePath(){
        const filename = this._getVideoFilename();
        return path.join(this.dist_dir, filename);
    }

    _getCommnetFilePath(){
        return path.join(this.dist_dir, `${this.video_id}[Comment].json`);
    }

    _getThumbInfoFilePath(){
        return path.join(this.dist_dir, `${this.video_id}[ThumbInfo].json`);
    }

    _getThumbImgFilePath(){
        return path.join(this.dist_dir, `${this.video_id}.jpeg`);
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
    NicoNicoDownloader: NicoNicoDownloader
};