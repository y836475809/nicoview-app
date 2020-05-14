const fs = require("fs");
const util = require("util");
const path = require("path");
const { NicoWatch, NicoVideo, NicoComment } = require("./niconico");
const { NicoClientRequest } = require("./nico-client-request");
const { NicoJsonFile } = require("./nico-data-file");
const  NicoDataParser = require("./nico-data-parser");
const { logger } = require("./logger");

const convertMB = (size_byte) => {
    const mb = 1024**2;
    return (size_byte/mb).toFixed(1);
};

const DonwloadProgMsg =  Object.freeze({   
    start_watch: "watch取得",
    start_thumbinfo: "thumbinfo取得",
    start_comment: "コメント取得",
    start_thumbimg: "サムネイル取得",
    start_dmc: "DMC取得",
    start_smile: "smile取得",
    write_data: "データ書き込み",
    complete: "完了",
    rename_video_file: "動画ファイルリネーム",
    stop_hb: "HB停止",
});

class DownloadRequest {
    /**
     * 
     * @param {String} url 
     * @param {NicoCookie} nico_cookie 
     */
    constructor(url, nico_cookie){
        this._url = url;
        this._nico_cookie = nico_cookie;
        this._req = null;
    }

    cancel(){
        if(this._req){
            this._req.cancel();
        }
    }

    download(stream, on_progress=(state)=>{}){
        return new Promise(async (resolve, reject) => {
            this._req = new NicoClientRequest();
            try {
                await this._req.get(this._url, 
                    {
                        encoding:"binary",
                        nico_cookie:this._nico_cookie, 
                        stream:stream,
                        on_progress:(current, content_len)=>{
                            const cur_per = Math.floor((current/content_len)*100);
                            on_progress(`${convertMB(content_len)}MB ${cur_per}%`);
                        }
                    });
                on_progress(DonwloadProgMsg.complete);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

const DownloadResultType = Object.freeze({
    complete: "complete",
    cancel: "cancel",
    skip: "skip",
    error: "error"
});

class NicoDownloader {
    constructor(video_id, dist_dir, only_max_quality=true){
        this.video_id = video_id;
        this.dist_dir = dist_dir;
        this.only_max_quality = only_max_quality;

        this.nico_json = new NicoJsonFile(video_id);
    }

    static get ResultType(){
        return DownloadResultType;
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
            this.img_request.cancel();
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
            on_progress(DonwloadProgMsg.start_watch);
            await this._getWatchData(this.video_id);
            await this._getVideoInfo();

            if(this.only_max_quality){
                if(!this.videoinfo.maxQuality){
                    return {
                        type: DownloadResultType.skip,
                        reason: "最高画質でないため"
                    };
                }
            }

            this._setupNicoFilePath();

            on_progress(DonwloadProgMsg.start_thumbinfo);
            const thumbInfo_data = NicoDataParser.json_thumb_info(this.watch_data.api_data);

            on_progress(DonwloadProgMsg.start_comment);
            const comment_data = await this._getComment();


            on_progress(DonwloadProgMsg.start_thumbimg);
            const { thumbImg_data, thumbnail_size } = await this._getThumbImg();
            this.nico_json.thumbnailSize = thumbnail_size;

            const tmp_video_path = this._getTmpVideoPath();
            const stream = this._createStream(tmp_video_path);
            stream.setDefaultEncoding("binary");
            if(this.videoinfo.server=="dmc"){
                on_progress(DonwloadProgMsg.start_dmc);
                await this._getVideoDmc(stream, on_progress);
            }else{
                on_progress(DonwloadProgMsg.start_smile);
                await this._getVideoSmile(stream, on_progress);
            }

            on_progress(DonwloadProgMsg.write_data);
            this._writeJson(this.nico_json.thumbInfoPath, thumbInfo_data);
            this._writeJson(this.nico_json.commentPath, comment_data);
            this._writeBinary(this.nico_json.thumbImgPath, thumbImg_data);

            on_progress(DonwloadProgMsg.rename_video_file);
            await this._renameTmp(tmp_video_path, this.nico_json.videoPath);

            return {
                type: DownloadResultType.complete,
                reason: ""
            };
        } catch (error) {
            if(error.cancel){
                return {
                    type: DownloadResultType.cancel,
                    reason: "cancel"
                };
            }

            return {
                type: DownloadResultType.error,
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

    async _getComment(){
        const api_data = this.watch_data.api_data;
        this.nico_comment = new NicoComment(api_data);
        return await this.nico_comment.getComment();
    }

    _getThumbnailData(api_data){
        const video = api_data.video;
        return { 
            thumbnail_url: video.thumbnailURL + ".L", 
            thumbnail_size: "L" 
        };
    }

    _getThumbImg(){
        const api_data = this.watch_data.api_data;
        const { thumbnail_url, thumbnail_size } = this._getThumbnailData(api_data);

        return new Promise(async (resolve, reject) => {
            try {
                this.img_request = new NicoClientRequest();
                const body = await this.img_request.get(thumbnail_url, {encoding:"binary"});
                resolve({ thumbImg_data: body, thumbnail_size: thumbnail_size });    
            } catch (error) {
                reject(error);
            }
        });
    }

    _createStream(dist_path){
        return fs.createWriteStream(dist_path);
    }

    async _getVideoDmc(stream, on_progress){
        //cancel
        await this.nico_video.optionsHeartBeat();
        this.nico_video.postHeartBeat((error)=>{
            logger.error("video dmc HeartBeat: ", error);
            throw error;
        });

        const { nico_cookie } = this.watch_data;
        const video_url = this.nico_video.DmcContentUri;

        this.video_download = new DownloadRequest(video_url, nico_cookie);
        try {
            await this.video_download.download(stream, on_progress);
        } catch (error) {
            throw error;
        }finally{
            this.nico_video.stopHeartBeat();
            on_progress(DonwloadProgMsg.stop_hb);
        }
    }

    async _getVideoSmile(stream, on_progress){
        //cancel
        const { nico_cookie, api_data } = this.watch_data;
        const url = api_data.video.smileInfo.url;
        this.video_download = new DownloadRequest(url, nico_cookie);
        await this.video_download.download(stream, on_progress);
    }   

    getDownloadedItem(){
        const { api_data } = this.watch_data;
        const is_deleted = api_data.video.isDeleted;
        const video_id = api_data.video.id;
        const video_type = NicoDataParser.getVideoType(api_data.video.smileInfo.url);
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        const { thumbnail_url, thumbnail_size } = this._getThumbnailData(api_data);
        
        return {
            data_type:"json", 
            dirpath: this.dist_dir,
            id: video_id,
            video_name: api_data.video.title,
            video_type: video_type,
            is_economy: !this.videoinfo.maxQuality,
            play_time: api_data.video.duration,
            pub_date: new Date(api_data.video.postedDateTime).getTime(),
            tags: tags,
            is_deleted: is_deleted,
            thumbnail_size: thumbnail_size,
        };
    }

    _setupNicoFilePath(){
        const { api_data } = this.watch_data;
        const video_type = NicoDataParser.getVideoType(api_data.video.smileInfo.url);

        this.nico_json.dirPath = this.dist_dir;
        this.nico_json.commonFilename = api_data.video.title;
        this.nico_json.videoType = video_type;
    }

    _getTmpVideoPath(){
        return path.join(this.dist_dir, "_video.tmp");
    }

    _writeJson(file_path, data){
        const json = JSON.stringify(data, null, "  ");
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
    DonwloadProgMsg,
    NicoDownloader
};