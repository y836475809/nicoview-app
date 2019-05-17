const { NicoWatch, NicoComment, getThumbInfo, filterComments } = require("./niconico");

class NicoUpdate {
    constructor(video_id){
        this.video_id = video_id;
        this.nico_watch = null;
        this.nico_comment = null;
    }
    
    /**
     * 
     * @param {String} video_id 
     * @param {Array} comments 
     */
    async getInfo(){
        this.nico_watch = new NicoWatch();
        const watch_data = await this.nico_watch.watch(this.video_id);
        const thumbInfo_data = getThumbInfo(watch_data.api_data);
    }

    /**
     * 
     * @param {Array} comments 
     */
    async getCommnets(comments){
        this.nico_watch = new NicoWatch();
        const watch_data = await this.nico_watch.watch(this.video_id);
        const thumbInfo_data = getThumbInfo(watch_data.api_data);
        
        this.nico_comment = new NicoComment(watch_data.api_data);
        const res_from = this._getMaxCommentNo(comments) + 1;
        const comments_diff = await this.nico_comment.getCommentDiff(res_from);
        const result = comments.concat(comments_diff);

        
    }

    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        } 
        if(this.nico_comment){
            this.nico_comment.cancel();
        }        
    }
    /**
     * 
     * @param {Array} comments 
     */
    _getMaxCommentNo(comments){
        return Math.max.apply(null, comments.map(comment=>{
            return comment.no;
        }));
    }
    _getWatch(){

    }

    _getThumbInfo(){

    }
    _getComment(){

    }
}