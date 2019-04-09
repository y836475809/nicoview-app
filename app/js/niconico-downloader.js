const fs = require("fs");
const util = require("util");
const path = require("path");
const request = require("request");
const { NicoWatch, NicoVideo, NicoComment, getVideoType, filterCommnets } = require("./niconico");
const { NicoJsonFile } = require("./nico-data-file");

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
            let error_obj = null;
            const closeWithError = (error) => {
                error_obj = error;
                stream.close();
            };
            const options = {
                method: "GET",
                uri: this.url, 
                jar: this.cookie,
                timeout: 5 * 1000
            };
            this.req = request(options, (error, res, body) => {
                if(error){
                    closeWithError(error);
                }
                else if(!validateStatus(res.statusCode)){
                    closeWithError(new Error(`${res.statusCode}:${this.url}`));
                }
            }).on("error", (error) => {
                closeWithError(error);
            }).on("response", (res) => {
                if(validateStatus(res.statusCode)){
                    content_len = res.headers["content-length"];
                }else{
                    closeWithError(new Error(`${res.statusCode}:${this.url}`));
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
                    closeWithError(error);
                }
            });

            stream.on("error", (error) => { 
                reject(error);
            }).on("close", () => {
                if(error_obj!=null){
                    reject(error_obj);
                }else{
                    on_progress("finish");
                    resolve();
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

        this.nico_json = new NicoJsonFile();
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

    async _renameTmp(oldname, newname){
        const promisify_rename = util.promisify(fs.rename);
        await promisify_rename(oldname, newname);
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

            this._setupNicoFilePath();

            on_progress("start getting thumbinfo");
            const thumbInfo_data = this._getThumbInfo();

            on_progress("start getting commnet");
            const comment_data = await this._getCommnet();


            on_progress("start getting thumbimg");
            const thumbImg_data = await this._getThumbImg();

            const tmp_video_path = this._getTmpVideoPath();
            const stream = this._createStream(tmp_video_path);
            if(this.videoinfo.server=="dmc"){
                on_progress("start getting dmc");
                await this._getVideoDmc(stream, on_progress);
            }else{
                on_progress("start getting smile");
                await this._getVideoSmile(stream, on_progress);
            }

            on_progress("writting data");
            this._writeJson(this.nico_json.thumbInfoPath, thumbInfo_data);
            this._writeJson(this.nico_json.commentPath, comment_data);
            this._writeBinary(this.nico_json.thumbImgPath, thumbImg_data);

            on_progress("rename video file");
            await this._renameTmp(tmp_video_path, this.nico_json.videoPath);

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
        const video = api_data.video;
        const thread = api_data.thread;
        const owner = api_data.owner;
        const tags = api_data.tags.map((value) => {
            return {
                id: value.id,
                name: value.name,
                isLocked: value.isLocked,
            };
        });
        return {
            video: {
                id: video.id,
                title: video.title, 
                description: video.description, 
                thumbnailURL: video.thumbnailURL, 
                largeThumbnailURL: video.largeThumbnailURL, 
                postedDateTime: video.postedDateTime, 
                duration: video.duration, 
                viewCount: video.viewCount, 
                mylistCount: video.mylistCount, 
                movieType: video.movieType,
            },
            thread: {
                commentCount: thread.commentCount
            },
            tags: tags,
            owner: {
                id: owner.id, 
                nickname: owner.nickname,
                iconURL: owner.iconURL,
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
        try {
            await this.video_download.download(stream, on_progress);
        } catch (error) {
            throw error;
        }finally{
            this.nico_video.stopHeartBeat();
            on_progress("stop HB");
        }
    }

    async _getVideoSmile(stream, on_progress){
        //cancel
        const { cookie_jar, api_data } = this.watch_data;
        const url = api_data.video.smileInfo.url;

        this.video_download = new DownloadRequest(url, cookie_jar);
        await this.video_download.download(stream, on_progress);
    }   

    getDownloadedItem(){
        const { api_data } = this.watch_data;
        const video_id = api_data.video.id;
        const video_type = getVideoType(api_data.video.smileInfo.url);
        const video_filename = this.nico_json.videoFilename;
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        return {
            _data_type:"video", 
            _db_type:"json", 
            dirpath: this.dist_dir,
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

    _setupNicoFilePath(){
        const { api_data } = this.watch_data;
        const video_type = getVideoType(api_data.video.smileInfo.url);

        this.nico_json.dirPath = this.dist_dir;
        this.nico_json.videoID = this.video_id;
        this.nico_json.videoType = video_type;
    }

    _getTmpVideoPath(){
        return path.join(this.dist_dir, "_video.tmp");
    }

    _writeJson(file_path, data){
        const json = JSON.stringify(data);
        fs.writeFileSync(file_path, json, "utf-8");
    }

    _writeBinary(file_path, data){
        fs.writeFileSync(file_path, data, "binary");
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