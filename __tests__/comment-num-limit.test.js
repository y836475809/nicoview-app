const test = require("ava");
const { CommentNumLimit } = require("../app/js/comment-filter");

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
            no: index, vpos: index, date: index*1000, user_id:"a"
        });
    }
    return comments;
};

const to_date = (min) => {
    return min*60*1000 + Math.pow(10, 10);
};

class TestCommentNumLimit extends CommentNumLimit{
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

    const cnl = new CommentNumLimit();
    cnl._sortDescByPostDate(comments);
    const last = comments[0].date;
    t.is(last, (time-1)*1000);
});

test("comments max num", t => {
    const cnl = new CommentNumLimit();
    t.is(100, cnl._getMaxNum(30));
    t.is(100, cnl._getMaxNum(59));
    t.is(250, cnl._getMaxNum(60));
    t.is(250, cnl._getMaxNum(299));
    t.is(500, cnl._getMaxNum(300));
    t.is(500, cnl._getMaxNum(599));
    t.is(1000, cnl._getMaxNum(600));
    t.is(1000, cnl._getMaxNum(800));
});

test("comments split rest0", t => {
    const time = 30;
    const comments = mkComments(time);

    const cnl = new CommentNumLimit();
    const { main, rest } = cnl._split(comments, 100);
    t.is(30, main.length);
    t.is(0, rest.length);
});

test("comments split", t => {
    const time = 30;
    const comments = mkComments(time);

    const cnl = new CommentNumLimit();
    const { main, rest } = cnl._split(comments, 10);
    t.is(main.length, 10);
    t.is(rest.length, 20);
});

test("comments split par min", t => {
    const comments = [
        {no: 0, vpos: 0, date: 15.0},
        {no: 1, vpos: 0, date: 14.5},
        {no: 2, vpos: 0, date: 14.1},

        {no: 3, vpos: 0, date: 14.0},

        {no: 4, vpos: 0, date: 12.0},

        {no: 5, vpos: 0, date: 10.8},
        {no: 6, vpos: 0, date: 10.7},
        {no: 7, vpos: 0, date: 10.6},
        {no: 8, vpos: 0, date: 10.5},

        {no: 9, vpos: 0, date: 7.0},
    ].map(value=>{
        value.date = to_date(value.date);
        return value;
    });

    const start_post_date = comments[comments.length-1].date;
    const time_sec = 20*60;
    const cnl = new CommentNumLimit();
    const cmts= cnl._splitParMinute(comments, start_post_date, time_sec);

    t.is(cmts.length, 5);
    t.is(cmts[0].length, 3);
    t.is(cmts[1].length, 1);
    t.is(cmts[2].length, 1);
    t.is(cmts[3].length, 4);
    t.is(cmts[4].length, 1);
});

test("comments get each", t => {
    const cnl = new CommentNumLimit();
    const ret = cnl._getNumEach([[0,1], [2,3,4,5,6], [7,8,9]], 3);
    t.deepEqual(ret, [
        0,1, 
        2,3,4, 
        7,8,9
    ]);
});

test("comments getComments", t => {
    const comments = [
        {no: 0, vpos: 10, date: 15.0},
        {no: 1, vpos: 9, date: 14.5},
        {no: 2, vpos: 8, date: 14.1},

        {no: 3, vpos: 7, date: 14.0},

        {no: 4, vpos: 6, date: 12.0},

        {no: 5, vpos: 5, date: 10.8},
        {no: 6, vpos: 4, date: 10.7},
        {no: 7, vpos: 3, date: 10.6},
        {no: 8, vpos: 2, date: 10.5},

        {no: 9, vpos: 1, date: 7.0},
    ].map(value=>{
        value.date = to_date(value.date);
        return value;
    });

    const time_sec = 20*60;
    const cnl = new TestCommentNumLimit(2, 3);
    const cmts = cnl.getComments(comments, time_sec);

    const exp_cmt = [
        {no: 9, vpos: 1, date: 7.0},
        {no: 6, vpos: 4, date: 10.7},
        {no: 5, vpos: 5, date: 10.8},
        {no: 4, vpos: 6, date: 12.0},
        {no: 3, vpos: 7, date: 14.0},
        {no: 2, vpos: 8, date: 14.1},
        {no: 1, vpos: 9, date: 14.5},
        {no: 0, vpos: 10, date: 15.0},
    ].map(value=>{
        value.date = to_date(value.date);
        return value;
    });
    t.deepEqual(cmts, exp_cmt);
});

test("comments splitByUserID", t => {
    const comments = [
        {no: 0, user_id:"a"},
        {no: 1, user_id:"owner"},
        {no: 2, user_id:"a"},
        {no: 3, user_id:"owner"},
    ];

    const cnl = new CommentNumLimit();
    const {owner_comments, user_comments} = cnl._splitByUserID(comments);

    t.deepEqual(owner_comments, [
        {no: 1, user_id:"owner"},
        {no: 3, user_id:"owner"},
    ]);
    t.deepEqual(user_comments, [
        {no: 0, user_id:"a"},
        {no: 2, user_id:"a"},
    ]);
});

test("comments getComments include owner", t => {
    const comments = [
        {no: 0, vpos: 10, date: 15.0},
        {no: 1, vpos: 9, date: 14.5},
        {no: 2, vpos: 8, date: 14.1, user_id:"owner"},

        {no: 3, vpos: 7, date: 14.0},

        {no: 4, vpos: 6, date: 12.0},

        {no: 5, vpos: 5, date: 10.8},
        {no: 6, vpos: 4, date: 10.7, user_id:"owner"},
        {no: 7, vpos: 3, date: 10.6},
        {no: 8, vpos: 2, date: 10.5},

        {no: 9, vpos: 1, date: 7.0},
    ].map(value=>{
        value.date = to_date(value.date);
        return value;
    });

    const time_sec = 20*60;
    const cnl = new TestCommentNumLimit(1, 1);
    const cmts = cnl.getComments(comments, time_sec);

    const exp_cmts = [
        {no: 9, vpos: 1, date: 7.0},
        {no: 6, vpos: 4, date: 10.7, user_id:"owner"},
        {no: 5, vpos: 5, date: 10.8},
        {no: 4, vpos: 6, date: 12.0},
        {no: 3, vpos: 7, date: 14.0},
        {no: 2, vpos: 8, date: 14.1, user_id:"owner"},
        {no: 1, vpos: 9, date: 14.5},
        {no: 0, vpos: 10, date: 15.0},
    ].map(value=>{
        value.date = to_date(value.date);
        return value;
    });

    t.deepEqual(cmts, exp_cmts);
});
