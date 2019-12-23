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
    _sortComments(comments){
        return comments.sort((a, b) => {
            if (a.post_date < b.post_date) return 1;
            if (a.post_date > b.post_date) return -1;
            return 0;
        });
    }
    filtertime(comments, time_sec){
        const src_comments = this._sortComments(comments.map(value=>{
            return Object.assign({}, value);
        }));
        const start_msec = src_comments[0].post_date;

        let limit_num = 0;
        if(time_sec<1*1){
            limit_num = 100;
        }
        else if(time_sec<1*5){
            limit_num = 250;
        }
        else if(time_sec<1*10){
            limit_num = 500;
        }else{
            limit_num = 1000;
        }
        if(comments.length <= limit_num){
            return src_comments;
        }
        /**
         * @type {Array}
         */
        const ti_comments = src_comments.slice(0, limit_num);
        const rest_comments = src_comments.slice(limit_num+1, 0);

        let aaa = [];
        const num = Math.floor(time_sec/60) + 1;
        for (let index = 0; index < num; index++) {
            const msec1 = start_msec + index*60*1000;
            const msec2 = msec1 + 60*1000;
            const dc = rest_comments.filter(value=>{
                const post_date = value.post_date;
                return (msec1<=post_date && post_date < msec2);
            });
            aaa = aaa.concat(dc);
        }

        return aaa.concat(ti_comments).sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });
    }
}

test.beforeEach(t => {
    const comments = [];
    for (let index = 0; index < 1000; index++) {
        comments.push({
            no: index, vpos: index, post_date: index
        });
    }
    t.context.comments = comments;
});

test("comments limit", t => {
    const time = 30;
    const comments = mkComments(time);
    const ct = new Ct();
    const f_comments =ct.filtertime(comments, time);
    t.is(30, f_comments.length);
});