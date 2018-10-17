var FixedComment = require("../app/js/fixed_comment");

test("calc fix fill", () => {
    let comments = [
        { no: 1, vpos: 0 },
        { no: 2, vpos: 5 },
        { no: 3, vpos: 10 },
        { no: 4, vpos: 15 }
    ];

    const num = 3;
    const duration = 100;
    let fixed_cmt = new FixedComment(num, duration);

    let ret = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 0);
    expect(ret.length).toBe(3);
    expect(ret[0].vpos).toBe(0);
    expect(ret[1].vpos).toBe(20);
    expect(ret[2].vpos).toBe(50);

    let ret2 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 100);
    expect(ret2.length).toBe(2);
    expect(ret2[0].vpos).toBe(20);
    expect(ret2[1].vpos).toBe(50);

    let ret3 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 130);
    expect(ret3.length).toBe(1);
    expect(ret3[0].vpos).toBe(50);

    let ret4 = fixed_cmt.fill([{ vpos: 0 }, { vpos: 20 }, { vpos: 50 }], 200);
    expect(ret4.length).toBe(0);
});

test("calc fix ", () => {
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

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
    expect(no_row_map.get(3)).toBe(2);
    expect(no_row_map.get(4)).toBe(0);
});

test("calc fix2 ", () => {
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

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
    expect(no_row_map.get(3)).toBe(0);
    expect(no_row_map.get(4)).toBe(1);
});

test("calc fix sort by vpos", () => {
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

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(4)).toBe(1);
    expect(no_row_map.get(3)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
});