const NGType = Object.freeze({
    Text:"text",
    UserId:"user_id"
});

class NGComment {
    constructor(){
        /** @type {NGCommentItem[]} */
        this._ng_commnet_items = [];
        /** @type {string[]} */
        this._ng_texts = [];
        /** @type {string[]} */
        this._ng_user_ids = [];
    }

    /**
     * 
     * @param {NGCommentItem[]} ng_commnet_items 
     */
    setNGCommentItems(ng_commnet_items){
        this._ng_commnet_items = ng_commnet_items;
        this._updateItem();
    }

    /**
     * 
     * @param {string} ng_type NGType
     * @returns {string[]}
     */
    _getNGItems(ng_type){
        const items = this._ng_commnet_items.filter(item => {
            return item.type == ng_type;
        }).map(item => {
            return item.value;
        });
        return items;
    }

    _updateItem(){
        const ng_texts = this._getNGItems(NGType.Text);
        this._ng_texts = [...new Set(ng_texts)];

        const ng_user_ids = this._getNGItems(NGType.UserId);
        this._ng_user_ids = [...new Set(ng_user_ids)];
    }

    /**
     * 
     * @returns {NGCommentItem[]}
     */
    getNGCommentItems(){
        return this._ng_commnet_items;
    }

    /**
     * 
     * @param {CommentItem[]} comments 
     * @returns {CommentItem[]}
     */
    getComments(comments){
        return comments.filter(comment=>{
            const has_ng_text = this._ng_texts.includes(comment.content);
            if(has_ng_text){
                return false;
            }
            const has_ng_user_id = this._ng_user_ids.includes(comment.user_id);
            if(has_ng_user_id){
                return false;
            }
            return true;
        });
    }

    /**
     * 
     * @param {string[]} items 
     * @param {string} ng_type 
     */
    _addNGItems(items, ng_type){
        items.forEach(value => {
            this._ng_commnet_items.push({
                type:ng_type,
                value:value
            });
        });
        this._updateItem();
    }

    /**
     * 
     * @param {string[]} texts 
     */
    addNGTexts(texts){
        this._addNGItems(texts, NGType.Text);
    }

    /**
     * 
     * @param {string[]} user_ids 
     */
    addNGUserIDs(user_ids){
        this._addNGItems(user_ids, NGType.UserId);
    }

    /**
     * 
     * @param {string[]} items 
     * @param {string} ng_type 
     */
    _deleteNGItems(items, ng_type){
        this._ng_commnet_items = this._ng_commnet_items.filter(item => {
            if(item.type!=ng_type){
                return true;
            }
            return !items.includes(item.value);
        });
        this._updateItem(); 
    }

    /**
     * 
     * @param {string[]} texts 
     */
    deleteNGTexts(texts){
        this._deleteNGItems(texts, NGType.Text);
    }

    /**
     * 
     * @param {string[]} user_ids 
     */
    deleteNGUserIDs(user_ids){
        this._deleteNGItems(user_ids, NGType.UserId);
    }
}



/**
 * 表示するコメントを選択する(コメント数制限)
 * vpos 100ms
 * time=sec
 * time<1:00 100
 * time<5:00 250
 * time<10:00 500
 * time>10:00 1000
 * 100comment/1minute
 * 10minute => 1000+900=1900
 */
class CommentNumLimit {
    /**
     * 
     * @param {Number} num_per_min 1分につき新着順に取得されるコメント数
     */
    constructor(num_per_min=100){
        this.num_per_min = num_per_min;
    }

    /**
     * 
     * @param {CommentItem[]} comments 
     * @param {number} play_time_sec 
     * @returns {CommentItem[]} 
     */
    getComments(comments, play_time_sec){
        if(comments.length === 0){
            return [];
        }
        
        this._sortDescByPostDate(comments);
        const {owner_comments, user_comments} = this._splitByUserID(comments);

        const max_num = this._getMaxNum(play_time_sec);
        const { main, rest } = this._split(user_comments, max_num);
        const comments_par_min = this._getNumEach(
            this._splitParMinute(rest, play_time_sec), 
            this.num_per_min);
        const result = main.concat(comments_par_min).concat(owner_comments);
        this._sortByVPos(result);
        return result;
    }

    /**
     * 
     * @param {CommentItem[]} comments 
     * @returns {
     *      owner_comments:CommentItem[], 
     *      user_comments:CommentItem[]
     * }
     */
    _splitByUserID(comments){
        const owner_comments = [];
        const user_comments = [];
        comments.forEach(comment => {
            const cp = Object.assign({}, comment);
            if(comment.user_id == "owner"){
                owner_comments.push(cp);
            }else{
                user_comments.push(cp);
            }
        });
        return {owner_comments, user_comments};
    }

    /**
     * コメントをvposで昇順ソート
     * vposが同じの場合、noで昇順ソート
     * @param {CommentItem[]} comments 
     */
    _sortByVPos(comments){
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;

            if (a.no < b.no) return -1;
            if (a.no > b.no) return 1;    
            return 0;
        });
    }

    /**
     * コメントを最新の投稿日順にソート
     * @param {CommentItem[]} comments 
     */
    _sortDescByPostDate(comments){
        comments.sort((a, b) => {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
        });
    }

    /**
     * 動画の長さによる取得コメント数を返す
     * play_time_sec<1:00 -> 100
     * play_time_sec<5:00 -> 250
     * play_time_sec<10:00 -> 500
     * play_time_sec>10:00 -> 1000
     * @param {Number} play_time_sec 動画時間
     */
    _getMaxNum(play_time_sec){
        let max_num = 0;
        if(play_time_sec < 1*60){
            max_num = 100;
        }
        else if(play_time_sec < 5*60){
            max_num = 250;
        }
        else if(play_time_sec < 10*60){
            max_num = 500;
        }else{
            max_num = 1000;
        }
        return max_num;
    }

    /**
     * commentsをnumで分割して返す
     * (動画の長さによるコメントと残りのコメントに分割する)
     * @param {CommentItem[]} comments 
     * @param {Number} num 動画の長さによるコメント数
     */
    _split(comments, num){
        if(comments.length <= num){
            return { main:comments, rest:[] };
        }
        const main = comments.slice(0, num);
        const rest = comments.slice(num);
        return { main, rest };
    }

    /**
     * コメントをvposで動画時間の１分毎に分割して返す
     * @param {CommentItem[]} comments 
     * @param {Number} play_time_sec 
     */
    _splitParMinute(comments, play_time_sec){
        this._sortByVPos(comments);

        let ary = [];
        const num = Math.floor(play_time_sec/60) + 1;
        for (let index = 0; index < num; index++) {
            const e1 = index * 60;
            const e2 = e1 + 60;
            const dc = comments.filter(value=>{
                const pos_sec = value.vpos/100;
                return (e1 <= pos_sec && pos_sec < e2);
            });
            if(dc.length > 0){
                // 後で最新コメント順で取得する処理を行うので
                // 投稿日で降順ソートしておく
                this._sortDescByPostDate(dc);
                ary.push(dc);
            }
        }
        return ary;
    }

    /**
     * 
     * @param {Array<CommentItem[]>} comments_list 
     * @param {Number} num 
     */
    _getNumEach(comments_list, num){
        return comments_list.map(comments => {
            return comments.slice(0, num);
        }).flat();
    }
}

class CommentFilter {
    constructor(num_per_min=100){
        this.ng_comment = new NGComment();
        this._comment_num_limit = new CommentNumLimit(num_per_min);
        this._comments = [];
        this._do_limit = true;
    }

    /**
     * 
     * @param {CommentItem[]} commnets 
     */
    setComments(commnets){
        this._comments =  JSON.parse(JSON.stringify(commnets));
    }

    /**
     * 
     * @param {boolean} do_limit 
     */
    setLimit(do_limit){
        this._do_limit = do_limit;
    }

    /**
     * 
     * @param {NGCommentItem[]} ng_commnet_items 
     */
    setNGCommentItems(ng_commnet_items){
        this.ng_comment.setNGCommentItems(ng_commnet_items);
    }

    getNGCommentItems(){
        return this.ng_comment.getNGCommentItems();
    }

    /**
     * 
     * @param {number} play_time_sec 
     */
    setPlayTime(play_time_sec){
        this._play_time_sec = play_time_sec;
    }

    getCommnets(){
        if(this._do_limit===true){
            const limit_comments = 
                this._comment_num_limit.getComments(this._comments, this._play_time_sec); 
            return this.ng_comment.getComments(limit_comments); 
        }else{
            return this.ng_comment.getComments(this._comments); 
        }
    }
}

module.exports = {
    NGComment,
    NGType,
    CommentNumLimit,
    CommentFilter
};