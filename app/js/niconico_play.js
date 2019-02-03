const { NicoWatch, NicoVideo, NicoComment, 
    getCookies, getThumbInfo } = require("./niconico");

class NicoPlay{
    constructor(heart_beat_rate=0.9){
        this.heart_beat_rate = heart_beat_rate;
    }

    cancel(){
        if(this.nico_watch){
            console.log("############ cancel nico_watch");
            this.nico_watch.cancel();
        }
        if(this.nico_comment){
            console.log("############ cancel nico_comment");
            this.nico_comment.cancel();
        }
        if(this.nico_video){
            console.log("############ cancel nico_video");
            this.nico_video.cancel();
        }      
    }

    stopHB(){
        this.nico_video.stopHeartBeat();
    }

    play(video_id, on_progress, on_hb_error){
        this.cancel();
        return new Promise(async (resolve, reject) => {  
            try {
                on_progress("start watch");

                this.nico_watch = new NicoWatch();
                const { cookie_jar, api_data } = await this.nico_watch.watch(video_id); 

                on_progress("finish watch");
                // MockNicoUitl.tohttp(api_data);
                // console.log("############ cookie_jar=", cookie_jar);
                // const nico_cookies = getCookies(cookie_jar);

                on_progress("start comment");

                this.nico_comment = new NicoComment(api_data);
                const comments = await this.nico_comment.getComment();
                // if(this.is_canceled){
                //     console.log("############ cancel=2");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                on_progress("finish comment");
                // const thumb_info = getThumbInfo(api_data);        

                on_progress("start video");
                this.nico_video = new NicoVideo(api_data, this.heart_beat_rate);
                // const smile_video_url = this.nico_video.SmileUrl;

                if(!this.nico_video.isDmc())
                {
                    on_progress("finish smile");
                    const thumb_info = getThumbInfo(api_data); 
                    const video_url = this.nico_video.SmileUrl;
                    resolve({
                        nico_cookies: nico_cookies,
                        comments: comments,
                        thumb_info: thumb_info,
                        video_url: video_url
                    });
                    return;                    
                }
                
                // on_progress("start dmc session");
                await this.nico_video.postDmcSession();
                await this.nico_video.optionsHeartBeat();

                // this.nico_video.dmcInfo.session_api.heartbeat_lifetime = 1000;
                on_progress("start HeartBeat");
                this.nico_video.postHeartBeat(on_hb_error);
                // if(this.is_canceled){
                //     console.log("############ cancel=3");
                //     resolve({ state:"cancel" });
                //     return;
                // }
                on_progress("finish video");

                const nico_cookies = getCookies(cookie_jar);
                const thumb_info = getThumbInfo(api_data); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                resolve({
                    nico_cookies: nico_cookies,
                    comments: comments,
                    thumb_info: thumb_info,
                    video_url: dmc_video_url
                });
                // on_progress("start dmc hb");
                // this.nico_video.dmcInfo.session_api.heartbeat_lifetime = 1*1000;
                // this.nico_video.startHeartBeat((error)=>{
                //     this.nico_video.stopHeartBeat();
                //     on_hb_error(error);
                // });                                
            } catch (error) {
                console.log("############ err=1");
                reject(error);
            }
        });      
    }
}

module.exports = {
    NicoPlay: NicoPlay
};