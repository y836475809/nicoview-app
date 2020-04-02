const EventEmitter = require("events");
const { NicoWatch, NicoVideo, NicoComment, 
    getCookies, getThumbInfo } = require("./niconico");
const NicoDataParser = require("./nico-data-parser");

class NicoPlay extends EventEmitter {
    constructor(heart_beat_rate=0.9){
        super();
        this.heart_beat_rate = heart_beat_rate;
        this.force_smile = false;
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

    setForceSmile(force_smile){
        this.force_smile = force_smile;
    }
    
    play(video_id){
        this.cancel();
        return new Promise(async (resolve, reject) => {  
            try {
                this.emit("changeState", "startWatch");
                this.nico_watch = new NicoWatch();
                const { cookie_jar, api_data } = await this.nico_watch.watch(video_id); 
                const is_deleted = api_data.video.isDeleted;
                this.emit("changeState", "finishWatch");

                this.emit("changeState", "startComment");
                this.nico_comment = new NicoComment(api_data);
                const comments = await this.nico_comment.getComment();
                const cnved_comments = NicoDataParser.makeComments(comments);
                this.emit("changeState", "finishComment");

                this.nico_video = new NicoVideo(api_data, this.heart_beat_rate);

                if(this.force_smile || !this.nico_video.isDmc())
                {
                    this.emit("changeState", "startPlaySmile");
                    const nico_cookies = getCookies(cookie_jar);
                    const thumb_info = getThumbInfo(api_data); 
                    const video_url = this.nico_video.SmileUrl;
                    resolve({
                        is_deleted: is_deleted,
                        nico_cookies: nico_cookies,
                        comments: cnved_comments,
                        thumb_info: thumb_info,
                        video_url: video_url
                    });
                    return;                    
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
                const nico_cookies = getCookies(cookie_jar);
                const thumb_info = getThumbInfo(api_data); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                resolve({
                    is_deleted: is_deleted,
                    nico_cookies: nico_cookies,
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
    NicoPlay: NicoPlay
};