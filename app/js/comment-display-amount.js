// vpos 100ms

// time=sec
// time<1:00 100
// time<5:00 250
// time<10:00 500
// time>10:00 1000

// 100comment/1minute
// 10minute => 1000+900=1900

class CommentDisplayAmount {
    constructor(num_per_min=100){
        this.num_per_min = num_per_min;
    }

    getDisplayed(comments, play_time_sec){
        const cp_comments = comments.map(value=>{
            return Object.assign({}, value);
        });
        this._sortDescByPostDate(cp_comments);
        const start_post_date = cp_comments[cp_comments.length-1].post_date;

        const max_num = this._getMaxNum(play_time_sec);
        const { main, rest } = this._split(cp_comments, max_num);
        const comments_par_min = this._getNumEach(
            this._splitParMinute(rest, start_post_date, play_time_sec), 
            this.num_per_min);
        const result = main.concat(comments_par_min);
        this._sortByVPos(result);
        return result;
    }

    _sortByVPos(comments){
        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
    }

    _sortDescByPostDate(comments){
        comments.sort((a, b) => {
            if (a.post_date < b.post_date) return 1;
            if (a.post_date > b.post_date) return -1;
            return 0;
        });
    }

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

    _split(comments, num){
        if(comments.length <= num){
            return { main:comments, rest:[] };
        }
        const main = comments.slice(0, num);
        const rest = comments.slice(num);
        return { main, rest };
    }

    _splitParMinute(comments, start_post_date, play_time_sec){
        const end_msec = start_post_date + play_time_sec*1000;
        let ary = [];
        const num = Math.floor(play_time_sec/60) + 1;
        for (let index = 0; index < num; index++) {
            const e1 = end_msec - index*60*1000;
            const e2 = e1 - 60*1000;
            const dc = comments.filter(value=>{
                const post_date = value.post_date;
                return (e2 < post_date && post_date <= e1);
            });
            if(dc.length > 0){
                ary.push(dc);
            }
        }
        return ary;
    }

    /**
     * 
     * @param {Array<Array>} comments_list 
     * @param {Number} num 
     */
    _getNumEach(comments_list, num){
        return comments_list.map(comments => {
            return comments.slice(0, num);
        }).flat();
    }
}

module.exports = {
    CommentDisplayAmount
};