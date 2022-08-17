class SyncCommentScroll {
    /**
     * 
     * @param {CommentItem[]} comments 
     */
    setComments(comments){
        this.comments = comments;
        this.reset();
    }

    reset(){
        this.play_time_ms = 0;
        this.comment_index = 0;
    }
    
    /**
     * 
     * @param {number} current_sec 
     * @returns {number}
     */
    getCommentIndex(current_sec){
        if(!this.comments){
            return 0;
        }
        if(this.comments.length==0){
            return 0;
        }

        const current_ms = current_sec * 1000;
        const len = this.comments.length;
        const is_foward = this.play_time_ms <= current_ms;
        this.play_time_ms = current_ms;

        if(is_foward){
            for (let index = this.comment_index; index < len; index++) {
                const comment = this.comments[index];
                if(comment.vpos*10 >= current_ms){
                    this.comment_index = index;
                    return this.comment_index;
                }
            }
            return len-1;
        }else{
            for (let index = this.comment_index; index >= 0; index--) {
                const comment = this.comments[index];
                if(comment.vpos*10 <= current_ms){
                    this.comment_index = index;
                    return this.comment_index;
                }
            } 
            return 0;
        }       
    }
}

module.exports = {
    SyncCommentScroll
};