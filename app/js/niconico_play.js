const { NicoWatch, NicoVideo, NicoComment, 
    getCookies, getThumbInfo, filterCommnets } = require("./niconico");

class NicoPlay{
    constructor(heart_beat_rate=0.9){
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
    
    play(video_id, on_progress, on_hb_error){
        this.cancel();
        return new Promise(async (resolve, reject) => {  
            try {
                on_progress("start watch");
                this.nico_watch = new NicoWatch();
                const { cookie_jar, api_data } = await this.nico_watch.watch(video_id); 
                on_progress("finish watch");

                on_progress("start comment");
                this.nico_comment = new NicoComment(api_data);
                const comments = await this.nico_comment.getComment();
                const filter_comments = filterCommnets(comments);
                on_progress("finish comment");

                on_progress("start video");
                this.nico_video = new NicoVideo(api_data, this.heart_beat_rate);

                if(this.force_smile || !this.nico_video.isDmc())
                {
                    on_progress("finish smile");
                    const nico_cookies = getCookies(cookie_jar);
                    const thumb_info = getThumbInfo(api_data); 
                    const video_url = this.nico_video.SmileUrl;
                    resolve({
                        nico_cookies: nico_cookies,
                        comments: filter_comments,
                        thumb_info: thumb_info,
                        video_url: video_url
                    });
                    return;                    
                }
                
                await this.nico_video.postDmcSession();
                await this.nico_video.optionsHeartBeat();

                on_progress("start HeartBeat");
                this.nico_video.postHeartBeat(on_hb_error);
                on_progress("finish video");

                const nico_cookies = getCookies(cookie_jar);
                const thumb_info = getThumbInfo(api_data); 
                const dmc_video_url = this.nico_video.DmcContentUri;
                resolve({
                    nico_cookies: nico_cookies,
                    comments: filter_comments,
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