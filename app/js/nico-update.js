const { NicoWatch, NicoComment, 
    getThumbInfo, filterComments } = require("./niconico");
const Library = require("./library");

class NicoUpdate {
    /**
     * 
     * @param {String} video_id 
     */
    constructor(video_id){
        this.video_id = video_id;
        this.nico_watch = null;
        this.nico_comment = null;
    }

    /**
     * 
     * @param {Library} library 
     */
    async isDeleted(library){
        const value = await library.getField(this.video_id, "is_deleted");
        return value;
    }

    /**
     * 
     * @param {Array} comments 
     */
    async get(cur_comments){
        const watch_data = await this._getWatchData();
        const thumbInfo = getThumbInfo(watch_data.api_data);
        const comments = await this._getComments(watch_data.api_data, cur_comments);
        return { thumbInfo, comments };
    }
    
    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        } 
        if(this.nico_comment){
            this.nico_comment.cancel();
        }        
    }

    async _getWatchData(){
        this.nico_watch = new NicoWatch();
        const watch_data = await this.nico_watch.watch(this.video_id);
        return watch_data;
    }

    async _getComments(api_data, cur_comments){
        this.nico_comment = new NicoComment(api_data);
        const res_from = this._getMaxCommentNo(cur_comments) + 1;
        const comments_diff = await this.nico_comment.getCommentDiff(res_from);
        return cur_comments.concat(filterComments(comments_diff));
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
}

module.exports = {
    NicoUpdate
};