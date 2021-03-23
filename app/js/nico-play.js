const EventEmitter = require("events");
const { NicoWatch, NicoVideo, NicoComment } = require("./niconico");
const NicoDataParser = require("./nico-data-parser");

class NicoPlay extends EventEmitter {
    constructor(heart_beat_rate=0.9){
        super();
        this.heart_beat_rate = heart_beat_rate;
    }

    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        }
        if(this.nico_comment){
            this.nico_comment.cancel();
        }
        if(this.nico_video){
            this.nico_video.cancel();
        }      
    }

    stopHB(){
        this.nico_video.stopHeartBeat();
    }

    play(video_id){
        this.cancel();
        return new Promise(async (resolve, reject) => {  
            try {
                this.emit("changeState", "startWatch");
                this.nico_watch = new NicoWatch();
                const { nico_cookie, nico_api } = await this.nico_watch.watch(video_id); 
                const is_deleted = nico_api.getVideo().isDeleted;
                this.emit("changeState", "finishWatch");

                this.emit("changeState", "startComment");
                this.nico_comment = new NicoComment(nico_api);
                const comments = await this.nico_comment.getComment();
                const cnved_comments = NicoDataParser.makeComments(comments);
                this.emit("changeState", "finishComment");

                this.nico_video = new NicoVideo(nico_api, this.heart_beat_rate);

                if(!this.nico_video.isDmc()){
                    throw new Error("nico play, Dmc is nill");                  
                }
                
                await this.nico_video.postDmcSession();
                await this.nico_video.optionsHeartBeat();

                this.emit("changeState", "startHeartBeat");
                this.nico_video.postHeartBeat((error)=>{
                    if(error.cancel){
                        this.emit("cancelHeartBeat");
                    }else{
                        this.emit("errorHeartBeat", error);
                    }
                });

                this.emit("changeState", "startPlayVideo");
                const cookies = nico_cookie.getSesstionCookies();
                const thumb_info = NicoDataParser.json_thumb_info(nico_api); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                const is_economy = !this.nico_video.isDMCMaxQuality();
                resolve({
                    is_economy: is_economy,
                    is_deleted: is_deleted,
                    cookies: cookies,
                    comments: cnved_comments,
                    thumb_info: thumb_info,
                    video_url: dmc_video_url
                });                                
            } catch (error) {
                reject(error);
            }
        });      
    }
}

module.exports = {
    NicoPlay
};