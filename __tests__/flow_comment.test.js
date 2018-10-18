
const FlowComment = require("../app/js/flow_comment");

test("calc", () => {
    let parames = [
        { no: 1, vpos: 0, width: 20, speed: 1 },
        { no: 2, vpos: 5, width: 20, speed: 1 },
        { no: 3, vpos: 10, width: 20, speed: 1 },
        { no: 4, vpos: 15, width: 20, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 100;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._getNoRowIndexMap(parames);

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
    expect(no_row_map.get(3)).toBe(2);
    expect(no_row_map.get(4)).toBe(0);
});

test("calc2", () => {
    let parames = [
        { no: 1, vpos: 0, width: 10, speed: 1 },
        { no: 2, vpos: 1, width: 2, speed: 1 },
        { no: 3, vpos: 2, width: 3, speed: 1 },
        { no: 4, vpos: 3, width: 10, speed: 1 },
        { no: 5, vpos: 4, width: 10, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 10;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._getNoRowIndexMap(parames);

    expect(no_row_map.size).toBe(5);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
    expect(no_row_map.get(3)).toBe(2);
    expect(no_row_map.get(4)).toBe(1);
    expect(no_row_map.get(5)).toBe(2);
});


test("calc3", () => {
    let parames = [
        { no: 1, vpos: 0, width: 10, speed: 1 },
        { no: 2, vpos: 1, width: 2, speed: 1 },
        { no: 3, vpos: 2, width: 3, speed: 1 },
        { no: 4, vpos: 300, width: 10, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 10;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._getNoRowIndexMap(parames);

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(1)).toBe(0);
    expect(no_row_map.get(2)).toBe(1);
    expect(no_row_map.get(3)).toBe(2);
    expect(no_row_map.get(4)).toBe(0);
});

test("calc sort by vpos", () => {
    let parames = [
        { no: 1, vpos: 10, width: 20, speed: 1 },
        { no: 2, vpos: 15, width: 20, speed: 1 },
        { no: 3, vpos: 5, width: 20, speed: 1 },
        { no: 4, vpos: 0, width: 20, speed: 1 }
    ];
    parames.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    const row_num = 3;
    const view_width = 100;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._getNoRowIndexMap(parames);

    expect(no_row_map.size).toBe(4);
    expect(no_row_map.get(4)).toBe(0);
    expect(no_row_map.get(3)).toBe(1);
    expect(no_row_map.get(1)).toBe(2);
    expect(no_row_map.get(2)).toBe(0);
});