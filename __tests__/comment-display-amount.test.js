const test = require("ava");
const { CommentDisplayAmount } = require("../app/js/comment-filter");

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
            no: index, vpos: index, post_date: index*1000, user_id:"a"
        });
    }
    return comments;
};

const to_date = (min) => {
    return min*60*1000 + Math.pow(10, 10);
};

class TestCommentDisplayAmount extends CommentDisplayAmount{
    constructor(num_per_min, max_num){
        super(num_per_min);
        this.max_num = max_num;
    }
    
    _getMaxNum(play_time_sec){
        return this.max_num;
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
        value.post_date = to_date(value.post_date);
        return value;
    });

    const start_post_date = comments[comments.length-1].post_date;
    const time_sec = 20*60;
    const cda = new CommentDisplayAmount();
    const cmts= cda._splitParMinute(comments, start_post_date, time_sec);

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

test("comments getDisplayed", t => {
    const comments = [
        {no: 0, vpos: 10, post_date: 15.0},
        {no: 1, vpos: 9, post_date: 14.5},
        {no: 2, vpos: 8, post_date: 14.1},

        {no: 3, vpos: 7, post_date: 14.0},

        {no: 4, vpos: 6, post_date: 12.0},

        {no: 5, vpos: 5, post_date: 10.8},
        {no: 6, vpos: 4, post_date: 10.7},
        {no: 7, vpos: 3, post_date: 10.6},
        {no: 8, vpos: 2, post_date: 10.5},

        {no: 9, vpos: 1, post_date: 7.0},
    ].map(value=>{
        value.post_date = to_date(value.post_date);
        return value;
    });

    const time_sec = 20*60;
    const cda = new TestCommentDisplayAmount(2, 3);
    const cmts = cda.getDisplayed(comments, time_sec);

    const pre_cmt = [
        {no: 9, vpos: 1, post_date: 7.0},
        {no: 6, vpos: 4, post_date: 10.7},
        {no: 5, vpos: 5, post_date: 10.8},
        {no: 4, vpos: 6, post_date: 12.0},
        {no: 3, vpos: 7, post_date: 14.0},
        {no: 2, vpos: 8, post_date: 14.1},
        {no: 1, vpos: 9, post_date: 14.5},
        {no: 0, vpos: 10, post_date: 15.0},
    ].map(value=>{
        value.post_date = to_date(value.post_date);
        return value;
    });
    t.deepEqual(pre_cmt, cmts);
});

test("comments splitByUserID", t => {
    const comments = [
        {no: 0, user_id:"a"},
        {no: 1, user_id:"owner"},
        {no: 2, user_id:"a"},
        {no: 3, user_id:"owner"},
    ];

    const cda = new CommentDisplayAmount();
    const {owner_comments, user_comments} = cda._splitByUserID(comments);

    t.deepEqual(owner_comments, [
        {no: 1, user_id:"owner"},
        {no: 3, user_id:"owner"},
    ]);
    t.deepEqual(user_comments, [
        {no: 0, user_id:"a"},
        {no: 2, user_id:"a"},
    ]);
});

test("comments getDisplayed include owner", t => {
    const comments = [
        {no: 0, vpos: 10, post_date: 15.0},
        {no: 1, vpos: 9, post_date: 14.5},
        {no: 2, vpos: 8, post_date: 14.1, user_id:"owner"},

        {no: 3, vpos: 7, post_date: 14.0},

        {no: 4, vpos: 6, post_date: 12.0},

        {no: 5, vpos: 5, post_date: 10.8},
        {no: 6, vpos: 4, post_date: 10.7, user_id:"owner"},
        {no: 7, vpos: 3, post_date: 10.6},
        {no: 8, vpos: 2, post_date: 10.5},

        {no: 9, vpos: 1, post_date: 7.0},
    ].map(value=>{
        value.post_date = to_date(value.post_date);
        return value;
    });

    const time_sec = 20*60;
    const cda = new TestCommentDisplayAmount(1, 1);
    const cmts = cda.getDisplayed(comments, time_sec);

    const exp_cmts = [
        {no: 9, vpos: 1, post_date: 7.0},
        {no: 6, vpos: 4, post_date: 10.7, user_id:"owner"},
        {no: 5, vpos: 5, post_date: 10.8},
        {no: 4, vpos: 6, post_date: 12.0},
        {no: 3, vpos: 7, post_date: 14.0},
        {no: 2, vpos: 8, post_date: 14.1, user_id:"owner"},
        {no: 1, vpos: 9, post_date: 14.5},
        {no: 0, vpos: 10, post_date: 15.0},
    ].map(value=>{
        value.post_date = to_date(value.post_date);
        return value;
    });
    
    t.deepEqual(cmts, exp_cmts);
});
