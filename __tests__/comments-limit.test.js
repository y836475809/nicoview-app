const test = require("ava");
// vpos 100ms

// time=sec
// time<1:00 100
// time<5:00 250
// time<10:00 500
// time>10:00 1000

// 100comment/1minute
// 10minute => 1000+900=1900

const mkComments = (time_sec) => {
    const comments = [];
    for (let index = 0; index < time_sec; index++) {
        comments.push({
            no: index, vpos: index, post_date: index*1000
        });
    }
    return comments;
};

class CommentDisplayAmount {
    constructor(num_per_min=100){
        this.num_per_min = num_per_min;
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

    _splitParMinute(comments, play_time_sec){
        const end_msec = play_time_sec*1000;
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

test("comments sort", t => {
    const time = 30;
    const comments = mkComments(time);

    const cda = new CommentDisplayAmount();
    cda._sortDescByPostDate(comments);
    const last = comments[0].post_date;
    t.is((time-1)*1000, last);
});

test("comments max num", t => {
    const cda = new CommentDisplayAmount();
    t.is(100, cda._getMaxNum(30));
    t.is(100, cda._getMaxNum(59));
    t.is(250, cda._getMaxNum(60));
    t.is(250, cda._getMaxNum(299));
    t.is(500, cda._getMaxNum(300));
    t.is(500, cda._getMaxNum(599));
    t.is(1000, cda._getMaxNum(600));
    t.is(1000, cda._getMaxNum(800));
});

test("comments split rest0", t => {
    const time = 30;
    const comments = mkComments(time);

    const cda = new CommentDisplayAmount();
    const { main, rest } = cda._split(comments, 100);
    t.is(30, main.length);
    t.is(0, rest.length);
});

test("comments split", t => {
    const time = 30;
    const comments = mkComments(time);

    const cda = new CommentDisplayAmount();
    const { main, rest } = cda._split(comments, 10);
    t.is(10, main.length);
    t.is(20, rest.length);
});

test("comments split par min", t => {
    const comments = [
        {no: 0, vpos: 0, post_date: 15.0},
        {no: 1, vpos: 0, post_date: 14.5},
        {no: 2, vpos: 0, post_date: 14.1},

        {no: 3, vpos: 0, post_date: 14.0},

        {no: 4, vpos: 0, post_date: 12.0},

        {no: 5, vpos: 0, post_date: 10.8},
        {no: 6, vpos: 0, post_date: 10.7},
        {no: 7, vpos: 0, post_date: 10.6},
        {no: 8, vpos: 0, post_date: 10.5},

        {no: 9, vpos: 0, post_date: 7.0},
    ].map(value=>{
        value.post_date *= 60*1000;
        return value;
    });

    const time_sec = 20*60;
    const cda = new CommentDisplayAmount();
    const cmts= cda._splitParMinute(comments, time_sec);

    t.is(5, cmts.length);
    t.is(3, cmts[0].length);
    t.is(1, cmts[1].length);
    t.is(1, cmts[2].length);
    t.is(4, cmts[3].length);
    t.is(1, cmts[4].length);
});

test("comments get each", t => {
    const cda = new CommentDisplayAmount();
    const ret = cda._getNumEach([[0,1], [2,3,4,5,6], [7,8,9]], 3);
    t.deepEqual([
        0,1, 
        2,3,4, 
        7,8,9
    ],ret);
});
