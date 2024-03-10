const fs = require("fs");
const path = require("path");
const { NicoWatch, NicoComment } = require("./niconico");
const { NicoClientRequest } = require("./nico-client-request");
const { NicoJsonFile } = require("./nico-data-file");
const  NicoDataParser = require("./nico-data-parser");
const  NicoHls = require("./nico-hls-request");
const { logger } = require("./logger");

const DonwloadProgMsg =  Object.freeze({   
    start_watch: "watch取得",
    start_thumbinfo: "thumbinfo取得",
    start_comment: "コメント取得",
    start_thumbimg: "サムネイル取得",
    start_dmc: "DMC取得",
    write_data: "データ書き込み",
    complete: "完了",
    rename_video_file: "動画ファイルリネーム",
    stop_hb: "HB停止",
});

const DownloadResultType = Object.freeze({
    complete: "complete",
    cancel: "cancel",
    skip: "skip",
    error: "error"
});

class NicoDownloader {
    constructor(video_id, dist_dir, tmp_dir, ffmpeg_path, only_max_quality=true){
        this.video_id = video_id;
        this.dist_dir = dist_dir;
        this.tmp_dir = tmp_dir;
        this.ffmpeg_path = ffmpeg_path;
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
        if(this.nico_hls){
            this.nico_hls.cancel();
        }   
        if(this.nico_comment){
            this.nico_comment.cancel();
        }  
        if(this.img_request){
            this.img_request.cancel();
        }         
    }

    async download(on_progress){
        try {
            if(this.ffmpeg_path == ""){
                throw new Error("ffmpeg_pathが設定されていない");
            }
            if(!fs.existsSync(this.ffmpeg_path)){
                throw new Error(`ffmpeg_path=${this.ffmpeg_path}が見つからない`);
            }

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
            const thumbInfo_data = NicoDataParser.json_thumb_info(this._nico_api);

            on_progress(DonwloadProgMsg.start_comment);
            const comment_data = await this._getComment();


            on_progress(DonwloadProgMsg.start_thumbimg);
            const { thumbImg_data, thumbnail_size } = await this._getThumbImg();
            this.nico_json.thumbnailSize = thumbnail_size;

            on_progress(DonwloadProgMsg.start_dmc);
            this.nico_hls = new NicoHls.NicoHls(this.tmp_dir);
            await this.nico_hls.download(
                this.video_id, 
                this._nico_api.getDomand(), 
                this._nico_api.getwatchTrackId(),
                this.ffmpeg_path,
                path.join(this.tmp_dir, "_nicview-download-tmp"),
                this.nico_json.videoPath,
                on_progress);

            on_progress(DonwloadProgMsg.write_data);
            this._writeJson(this.nico_json.thumbInfoPath, thumbInfo_data);
            this._writeJson(this.nico_json.commentPath, comment_data);
            this._writeBinary(this.nico_json.thumbImgPath, thumbImg_data);

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
        const watch_data = await this.nico_watch.watch(video_id);
        this._nico_api = watch_data.nico_api;
    }

    async _getVideoInfo(){
        const quality = NicoHls.getQuality(this._nico_api.getDomand());
        this.videoinfo = {
            server: "hls",
            maxQuality: quality.is_max_quality
        };
    }

    async _getComment(){
        this.nico_comment = new NicoComment(this._nico_api);
        return await this.nico_comment.getComment();
    }

    _getThumbnailData(large_url){
        return { 
            thumbnail_url: large_url, 
            thumbnail_size: "L" 
        };
    }

    async _getThumbImg(){
        const large_url = this._nico_api.getVideo().thumbnail.largeUrl;
        const { thumbnail_url, thumbnail_size } = this._getThumbnailData(large_url);

        this.img_request = new NicoClientRequest();
        const body = await this.img_request.get(thumbnail_url, {encoding:"binary"});
        return { thumbImg_data: body, thumbnail_size: thumbnail_size };
    }

    /**
     * 
     * @returns {DownloadedItem}
     */
    getDownloadedItem(){
        const video = this._nico_api.getVideo();
        const tags = this._nico_api.getTags().map((value) => {
            return value.name;
        });
        const { thumbnail_url, thumbnail_size } =  // eslint-disable-line no-unused-vars
            this._getThumbnailData(video.thumbnail.largeUrl);
        
        return {
            data_type:"json", 
            dirpath: this.dist_dir,
            video_id: video.id,
            title: video.title,
            video_type: video.videoType,
            is_economy: !this.videoinfo.maxQuality,
            play_time: video.duration,
            pub_date: new Date(video.registeredAt).getTime(),
            tags: tags,
            is_deleted: video.isDeleted,
            thumbnail_size: thumbnail_size,
        };
    }

    _setupNicoFilePath(){
        const video = this._nico_api.getVideo();

        this.nico_json.dirPath = this.dist_dir;
        this.nico_json.commonFilename = video.title;
        this.nico_json.videoType = video.videoType;
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
}

module.exports = {
    DonwloadProgMsg,
    NicoDownloader
};