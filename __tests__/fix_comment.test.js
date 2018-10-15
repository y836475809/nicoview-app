var FixComment = require("../app/js/fix_comment");

test("calc fix fill", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 20, speed: 1, row_index: 0 },
        { no: 2, vpos: 5, width: 20, speed: 1, row_index: 0 },
        { no: 3, vpos: 10, width: 20, speed: 1, row_index: 0 },
        { no: 4, vpos: 15, width: 20, speed: 1, row_index: 0 }
    ];

    const num = 3;
    const duration = 100;
    let cm = new FixComment(num, duration);

    let ret = cm.fill([{vpos: 0}, {vpos: 20}, {vpos: 50}], 0);
    expect(ret.length).toBe(3);
    expect(ret[0].vpos).toBe(0);
    expect(ret[1].vpos).toBe(20);
    expect(ret[2].vpos).toBe(50);

    let ret2 = cm.fill([{vpos: 0}, {vpos: 20}, {vpos: 50}], 100);
    expect(ret2.length).toBe(2);
    expect(ret2[0].vpos).toBe(20);
    expect(ret2[1].vpos).toBe(50);

    let ret3 = cm.fill([{vpos: 0}, {vpos: 20}, {vpos: 50}], 130);
    expect(ret3.length).toBe(1);
    expect(ret3[0].vpos).toBe(50);

    let ret4 = cm.fill([{vpos: 0}, {vpos: 20}, {vpos: 50}], 200);
    expect(ret4.length).toBe(0);
});

test("calc fix ", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 20, speed: 1, row_index: 0 },
        { no: 2, vpos: 5, width: 20, speed: 1, row_index: 0 },
        { no: 3, vpos: 10, width: 20, speed: 1, row_index: 0 },
        { no: 4, vpos: 15, width: 20, speed: 1, row_index: 0 }
    ];

    const num = 3;
    const duration = 100;
    let cm = new FixComment(num, duration);
    cm.calc(comments);
    console.log(comments);
    expect(comments[0].row_index).toBe(0);
    expect(comments[1].row_index).toBe(1);
    expect(comments[2].row_index).toBe(2);
    expect(comments[3].row_index).toBe(0);
});

test("calc fix2 ", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 20, speed: 1, row_index: 0 },
        { no: 2, vpos: 5, width: 20, speed: 1, row_index: 0 },
        { no: 3, vpos: 10, width: 20, speed: 1, row_index: 0 },
        { no: 4, vpos: 15, width: 20, speed: 1, row_index: 0 }
    ];

    const num = 3;
    const duration = 10;
    let cm = new FixComment(num, duration);
    cm.calc(comments);
    console.log(comments);
    expect(comments[0].row_index).toBe(0);
    expect(comments[1].row_index).toBe(1);
    expect(comments[2].row_index).toBe(0);
    expect(comments[3].row_index).toBe(1);
});