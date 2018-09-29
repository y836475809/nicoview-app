var nico_comment = require("../nico_comment");

test("is init", ()=> {
    let m = new nico_comment(5);
    expect(m.lanes.length).toBe(5);
    for (let i = 0; i < 5; i++) {
        expect(m.lanes[i].no).toBe(-1);
        expect(m.lanes[i].nokori).toBe(0);
    }
});

test("calc", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 20, speed: 1, lane_index: 0 },
        { no: 2, vpos: 5, width: 20, speed: 1, lane_index: 0 },
        { no: 3, vpos: 10, width: 20, speed: 1, lane_index: 0 },
        { no: 4, vpos: 15, width: 20, speed: 1, lane_index: 0 }
    ];

    const num = 3;
    let cm = new nico_comment(num);
    cm.width = 100;
    cm.comments = comments;
    cm.calc_comment();

    let calc_cm = cm.comments;
    //console.log(calc_cm);
    expect(calc_cm[0].lane_index).toBe(0);
    expect(calc_cm[1].lane_index).toBe(1);
    expect(calc_cm[2].lane_index).toBe(2);
    expect(calc_cm[3].lane_index).toBe(0);
});

test("calc2", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 10, speed: 1, lane_index: 0 },
        { no: 2, vpos: 1, width: 2, speed: 1, lane_index: 0 },
        { no: 3, vpos: 2, width: 3, speed: 1, lane_index: 0 },
        { no: 4, vpos: 3, width: 10, speed: 1, lane_index: 0 },
        { no: 5, vpos: 4, width: 10, speed: 1, lane_index: 0 }
    ];

    const num = 3;
    let cm = new nico_comment(num);
    cm.width = 10;
    cm.comments = comments;
    cm.calc_comment();

    let calc_cm = cm.comments;
    expect(calc_cm[0].lane_index).toBe(0);
    expect(calc_cm[1].lane_index).toBe(1);
    expect(calc_cm[2].lane_index).toBe(2);
    expect(calc_cm[3].lane_index).toBe(1);
    expect(calc_cm[4].lane_index).toBe(2);
});


test("calc3", ()=> {
    let comments = [
        { no: 1, vpos: 0, width: 10, speed: 1, lane_index: 0 },
        { no: 2, vpos: 1, width: 2, speed: 1, lane_index: 0 },
        { no: 3, vpos: 2, width: 3, speed: 1, lane_index: 0 },
        { no: 4, vpos: 300, width: 10, speed: 1, lane_index: 0 }
    ];

    const num = 3;
    let cm = new nico_comment(num);
    cm.width = 10;
    cm.comments = comments;
    cm.calc_comment();

    let calc_cm = cm.comments;
    expect(calc_cm[0].lane_index).toBe(0);
    expect(calc_cm[1].lane_index).toBe(1);
    expect(calc_cm[2].lane_index).toBe(2);
    expect(calc_cm[3].lane_index).toBe(0);
});

test("calc sort by vpos", ()=> {
    let comments = [
        { no: 1, vpos: 10, width: 20, speed: 1, lane_index: 0 },
        { no: 2, vpos: 15, width: 20, speed: 1, lane_index: 0 },
        { no: 3, vpos: 5, width: 20, speed: 1, lane_index: 0 },
        { no: 4, vpos: 0, width: 20, speed: 1, lane_index: 0 }
    ];
    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    const num = 3;
    let cm = new nico_comment(num);
    cm.width = 100;
    cm.comments = comments;
    cm.calc_comment();

    let calc_cm = cm.comments;
    //console.log(calc_cm);
    expect(calc_cm[0].lane_index).toBe(0);
    expect(calc_cm[1].lane_index).toBe(1);
    expect(calc_cm[2].lane_index).toBe(2);
    expect(calc_cm[3].lane_index).toBe(0);
});