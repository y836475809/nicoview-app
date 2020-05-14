const test = require("ava");
const { FlowComment } = require("../app/js/flow-comment");

test("calc", (t) => {
    let parames = [
        { id: "1:a", no: 1, vpos: 0, width: 20, speed: 1 },
        { id: "2:a", no: 2, vpos: 5, width: 20, speed: 1 },
        { id: "3:a", no: 3, vpos: 10, width: 20, speed: 1 },
        { id: "4:a", no: 4, vpos: 15, width: 20, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 100;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._createRowIndexMap(parames);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get("1:a"), 0);
    t.is(no_row_map.get("2:a"), 1);
    t.is(no_row_map.get("3:a"), 2);
    t.is(no_row_map.get("4:a"), 0);
});

test("calc2", (t) => {
    let parames = [
        { id: "1:a", no: 1, vpos: 0, width: 10, speed: 1 },
        { id: "2:a", no: 2, vpos: 1, width: 2, speed: 1 },
        { id: "3:a", no: 3, vpos: 2, width: 3, speed: 1 },
        { id: "4:a", no: 4, vpos: 3, width: 10, speed: 1 },
        { id: "5:a", no: 5, vpos: 4, width: 10, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 10;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._createRowIndexMap(parames);

    t.is(no_row_map.size, 5);
    t.is(no_row_map.get("1:a"), 0);
    t.is(no_row_map.get("2:a"), 1);
    t.is(no_row_map.get("3:a"), 2);
    t.is(no_row_map.get("4:a"), 1);
    t.is(no_row_map.get("5:a"), 2);
});


test("calc3", (t) => {
    let parames = [
        { id: "1:a", no: 1, vpos: 0, width: 10, speed: 1 },
        { id: "2:a", no: 2, vpos: 1, width: 2, speed: 1 },
        { id: "3:a", no: 3, vpos: 2, width: 3, speed: 1 },
        { id: "4:a", no: 4, vpos: 300, width: 10, speed: 1 }
    ];

    const row_num = 3;
    const view_width = 10;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._createRowIndexMap(parames);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get("1:a"), 0);
    t.is(no_row_map.get("2:a"), 1);
    t.is(no_row_map.get("3:a"), 2);
    t.is(no_row_map.get("4:a"), 0);
});

test("calc sort by vpos", (t) => {
    let parames = [
        { id: "1:a", no: 1, vpos: 10, width: 20, speed: 1 },
        { id: "2:a", no: 2, vpos: 15, width: 20, speed: 1 },
        { id: "3:a", no: 3, vpos: 5, width: 20, speed: 1 },
        { id: "4:a", no: 4, vpos: 0, width: 20, speed: 1 }
    ];
    parames.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    const row_num = 3;
    const view_width = 100;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._createRowIndexMap(parames);

    t.is(no_row_map.size, 4);
    t.is(no_row_map.get("4:a"), 0);
    t.is(no_row_map.get("3:a"), 1);
    t.is(no_row_map.get("1:a"), 2);
    t.is(no_row_map.get("2:a"), 0);
});

test("calc row index, no is duplicated", (t) => {
    let parames = [
        { id: "1:owner", no: 1, vpos: 0, width: 20, speed: 1 },
        { id: "1:a", no: 1, vpos: 0, width: 20, speed: 1 },
        { id: "2:a", no: 2, vpos: 5, width: 20, speed: 1 }
    ];

    const row_num = 4;
    const view_width = 100;
    let flow_cmt = new FlowComment(row_num, view_width);
    const no_row_map = flow_cmt._createRowIndexMap(parames);

    t.is(no_row_map.size, 3);
    t.is(no_row_map.get("1:owner"), 0);
    t.is(no_row_map.get("1:a"), 1);
    t.is(no_row_map.get("2:a"), 2);
});