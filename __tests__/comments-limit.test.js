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

class Ct {
    constructor(comments){
        this.comments = comments.map(value=>{
            return Object.assign({}, value);
        });
        this._sortDescBypPostDate();
    }
    
    _sortDescBypPostDate(){
        this.comments.sort((a, b) => {
            if (a.post_date < b.post_date) return 1;
            if (a.post_date > b.post_date) return -1;
            return 0;
        });
    }

    _getMaxnNum(time_sec){
        let limit_num = 0;
        if(time_sec<1*60){
            limit_num = 100;
        }
        else if(time_sec<5*60){
            limit_num = 250;
        }
        else if(time_sec<10*60){
            limit_num = 500;
        }else{
            limit_num = 1000;
        }
        return limit_num;
    }

    _divcmt(comments, limit_num){
        if(comments.length <= limit_num){
            return { main:comments, rest:[] };
        }
        /**
         * @type {Array}
         */
        const main = comments.slice(0, limit_num);
        const rest = comments.slice(limit_num);
        return { main, rest };
    }

    _getcmtbymin(comments, time_sec){
        const start_msec = time_sec*1000;
        let aaa = [];
        const num = Math.floor(time_sec/60) + 1;
        for (let index = 0; index < num; index++) {
            const msec1 = start_msec - index*60*1000;
            const msec2 = msec1 - 60*1000;
            const dc = comments.filter(value=>{
                const post_date = value.post_date;
                return (msec2<post_date && post_date <= msec1);
            });
            if(dc.length>0){
                aaa.push(dc);
            }
        }
        return aaa;
    }
}

test("comments sort", t => {
    const time = 30;
    const comments = mkComments(time);

    const ct = new Ct(comments);
    const last = ct.comments[0].post_date;
    t.is((time-1)*1000, last);
});

test("comments maxnum", t => {
    const ct = new Ct([]);
    t.is(100, ct._getMaxnNum(30));
    t.is(100, ct._getMaxnNum(59));
    t.is(250, ct._getMaxnNum(60));
    t.is(250, ct._getMaxnNum(299));
    t.is(500, ct._getMaxnNum(300));
    t.is(500, ct._getMaxnNum(599));
    t.is(1000, ct._getMaxnNum(600));
    t.is(1000, ct._getMaxnNum(800));
});

test("comments div", t => {
    const time = 30;
    const comments = mkComments(time);

    const ct = new Ct([]);
    const { main, rest } = ct._divcmt(comments, 100);
    t.is(30, main.length);
    t.is(0, rest.length);
});

test("comments div2", t => {
    const time = 30;
    const comments = mkComments(time);

    const ct = new Ct([]);
    const { main, rest } = ct._divcmt(comments, 10);
    t.is(10, main.length);
    t.is(20, rest.length);
});

test("comments by min", t => {
    const time = 100;
    const comments = mkComments(time);

    const ct = new Ct(comments);
    const cmts= ct._getcmtbymin(ct.comments, 100);
    t.is(2, cmts.length);
    t.is(59, cmts[0].length);
    t.is(41, cmts[1].length);
});

test("comments by min2", t => {
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
    const ct = new Ct([]);
    const cmts= ct._getcmtbymin(comments, time_sec);

    t.is(5, cmts.length);
    t.is(3, cmts[0].length);
    t.is(1, cmts[1].length);
    t.is(1, cmts[2].length);
    t.is(4, cmts[3].length);
    t.is(1, cmts[4].length);
});
