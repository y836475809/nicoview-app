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
        { user_id: "a", no: 1, vpos: 0 },
        { user_id: "a", no: 2, vpos: 5 },
        { user_id: "a", no: 3, vpos: 10 },
        { user_id: "a", no: 4, vpos: 15 }
    ];

    const num = 3;
    const duration = 100;
    let fixed_cmt = new FixedComment(num, duration);
    fixed_cmt.createRowIndexMap(comments);
    const id_row_map = fixed_cmt.id_row_map;

    t.is(id_row_map.size, 4);
    t.is(id_row_map.get("1:a"), 0);
    t.is(id_row_map.get("2:a"), 1);
    t.is(id_row_map.get("3:a"), 2);
    t.is(id_row_map.get("4:a"), 0);
});

test("calc fix2 ", (t) => {
    let comments = [
        { user_id: "a", no: 1, vpos: 0 },
        { user_id: "a", no: 2, vpos: 5 },
        { user_id: "a", no: 3, vpos: 10 },
        { user_id: "a", no: 4, vpos: 15 }
    ];

    const num = 3;
    const duration = 10;
    let fixed_cmt = new FixedComment(num, duration);
    fixed_cmt.createRowIndexMap(comments);
    const id_row_map = fixed_cmt.id_row_map;

    t.is(id_row_map.size, 4);
    t.is(id_row_map.get("1:a"), 0);
    t.is(id_row_map.get("2:a"), 1);
    t.is(id_row_map.get("3:a"), 0);
    t.is(id_row_map.get("4:a"), 1);
});

test("calc fix sort by vpos", (t) => {
    let comments = [
        { user_id: "a", no: 1, vpos: 0 },
        { user_id: "a", no: 2, vpos: 15 },
        { user_id: "a", no: 3, vpos: 10 },
        { user_id: "a", no: 4, vpos: 5 },
    ];
    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    const num = 3;
    const duration = 10;
    let fixed_cmt = new FixedComment(num, duration);
    fixed_cmt.createRowIndexMap(comments);
    const id_row_map = fixed_cmt.id_row_map;

    t.is(id_row_map.size, 4);
    t.is(id_row_map.get("1:a"), 0);
    t.is(id_row_map.get("4:a"), 1);
    t.is(id_row_map.get("3:a"), 0);
    t.is(id_row_map.get("2:a"), 1);
});


test("calc row index, no is duplicated", (t) => {
    let comments = [
        { user_id: "owner", no: 1, vpos: 0 },
        { user_id: "a", no: 1, vpos: 5 },
        { user_id: "a", no: 2, vpos: 10 },
        { user_id: "a", no: 3, vpos: 15 }
    ];

    const num = 3;
    const duration = 100;
    let fixed_cmt = new FixedComment(num, duration);
    fixed_cmt.createRowIndexMap(comments);
    const id_row_map = fixed_cmt.id_row_map;

    t.is(id_row_map.size, 4);
    t.is(id_row_map.get("1:owner"), 0);
    t.is(id_row_map.get("1:a"), 1);
    t.is(id_row_map.get("2:a"), 2);
    t.is(id_row_map.get("3:a"), 0);
});