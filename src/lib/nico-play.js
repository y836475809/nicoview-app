const EventEmitter = require("events");
const { NicoWatch, NicoComment } = require("./niconico");
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
    }

    async play(video_id){
        this.cancel(); 

        this.emit("changeState", "startWatch");
        this.nico_watch = new NicoWatch();
        const { nico_api } = await this.nico_watch.watch(video_id); 
        const is_deleted = nico_api.getVideo().isDeleted;
        this.emit("changeState", "finishWatch");

        this.emit("changeState", "startComment");
        this.nico_comment = new NicoComment(nico_api);
        const comments = await this.nico_comment.getComment();
        const cnved_comments = NicoDataParser.makeComments(comments);
        this.emit("changeState", "finishComment");

        this.emit("changeState", "startPlayVideo");
        const thumb_info = NicoDataParser.json_thumb_info(nico_api); 
        const is_economy = !nico_api.isMaxQuality();
        return {
            is_economy: is_economy,
            is_deleted: is_deleted,
            comments: cnved_comments,
            thumb_info: thumb_info,
            nico_api: {
                domand: nico_api.getDomand(),
                watchTrackId: nico_api.getwatchTrackId()
            }
        };
    }
}

module.exports = {
    NicoPlay
};