const test = require("ava");
const FixedComment = require("../app/js/fixed-comment");

test("calc fix fill", (t) => {
    const num = 3;
    const duration = 100;
    let fixed_cmt = new FixedComment(num, duration);

    let ret = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 0);
    t.is(ret.length, 3);
    t.is(ret[0].vpos, 0);
    t.is(ret[1].vpos, 20);
    t.is(ret[2].vpos, 50);

    let ret2 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 100);
    t.is(ret2.length, 2);
    t.is(ret2[0].vpos, 20);
    t.is(ret2[1].vpos, 50);

    let ret3 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 130);
    t.is(ret3.length, 1);
    t.is(ret3[0].vpos, 50);

    let ret4 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 200);
    t.is(ret4.length, 0);
});

test("calc fix ", (t) => {
    let comments = [
        { no: 1, vpos: 0 },
        { no: 2, vpos: 5 },
        { no: 3, vpos: 10 },
        { no: 4, vpos: 15 }
    ];

    const num = 3;
    const duration = 100;
    let fixed_cmt = new FixedComment(num, duration);
    const no_row_map = fixed_cmt.getNoRowIndexMap(comments);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get(1), 0);
    t.is(no_row_map.get(2), 1);
    t.is(no_row_map.get(3), 2);
    t.is(no_row_map.get(4), 0);
});

test("calc fix2 ", (t) => {
    let comments = [
        { no: 1, vpos: 0 },
        { no: 2, vpos: 5 },
        { no: 3, vpos: 10 },
        { no: 4, vpos: 15 }
    ];

    const num = 3;
    const duration = 10;
    let fixed_cmt = new FixedComment(num, duration);
    const no_row_map = fixed_cmt.getNoRowIndexMap(comments);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get(1), 0);
    t.is(no_row_map.get(2), 1);
    t.is(no_row_map.get(3), 0);
    t.is(no_row_map.get(4), 1);
});

test("calc fix sort by vpos", (t) => {
    let comments = [
        { no: 1, vpos: 0 },
        { no: 2, vpos: 15 },
        { no: 3, vpos: 10 },
        { no: 4, vpos: 5 },
    ];
    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    const num = 3;
    const duration = 10;
    let fixed_cmt = new FixedComment(num, duration);
    const no_row_map = fixed_cmt.getNoRowIndexMap(comments);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get(1), 0);
    t.is(no_row_map.get(4), 1);
    t.is(no_row_map.get(3), 0);
    t.is(no_row_map.get(2), 1);
});