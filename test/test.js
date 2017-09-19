var assert = require("power-assert");
var nico_comment = require("../nico_comment");

it("is init", function () {
    let m = new nico_comment(5)
    assert(m.lanes.length === 5)
    for (let i = 0; i < 5; i++) {
        assert(m.lanes[i].no === -1)
        assert(m.lanes[i].nokori === 0)
    }
})

it("calc", function () {
    let comments = [
        { no: 1, vpos: 0, width: 20, speed: 1, lane_index: 0 },
        { no: 2, vpos: 5, width: 20, speed: 1, lane_index: 0 },
        { no: 3, vpos: 10, width: 20, speed: 1, lane_index: 0 },
        { no: 4, vpos: 15, width: 20, speed: 1, lane_index: 0 }
    ]

    const num = 3
    let cm = new nico_comment(num)
    cm.width = 100
    cm.comments = comments
    cm.calc_comment()

    let calc_cm = cm.comments
    console.log(calc_cm)
    assert(calc_cm[0].lane_index === 0)
    assert(calc_cm[1].lane_index === 1)
    assert(calc_cm[2].lane_index === 2)
    assert(calc_cm[3].lane_index === 0)


})

it("calc sort by vpos", function () {
    let comments = [
        { no: 1, vpos: 10, width: 20, speed: 1, lane_index: 0 },
        { no: 2, vpos: 15, width: 20, speed: 1, lane_index: 0 },
        { no: 3, vpos: 5, width: 20, speed: 1, lane_index: 0 },
        { no: 4, vpos: 0, width: 20, speed: 1, lane_index: 0 }
    ]
    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    })
    const num = 3
    let cm = new nico_comment(num)
    cm.width = 100
    cm.comments = comments
    cm.calc_comment()

    let calc_cm = cm.comments
    console.log(calc_cm)
    assert(calc_cm[0].lane_index === 0)
    assert(calc_cm[1].lane_index === 1)
    assert(calc_cm[2].lane_index === 2)
    assert(calc_cm[3].lane_index === 0)


})