var assert = require("power-assert"); // assertモジュールのinclude

var nico_comment = require("../nico_comment");

// var author = "hoo";
// it("is power-assert", function () {
//     //assert(author === 'hoo');
//     assert(author === 'hoo');  // ← 不一致エラー
// });

it("is init", function () {
    let m = new nico_comment(5)
    assert(m.lanes.length === 5)
    for (let i = 0; i < 5; i++) {
        assert(m.lanes[i].no === -1)
        assert(m.lanes[i].nokori === 0)
    }
})

// let comments = [
//     { no: 1, vpos: 0, width: 20, speed: 10, lane_index: 0 },
//     { no: 2, vpos: 5, width: 20, speed: 10, lane_index: 0 },
//     { no: 3, vpos: 20, width: 20, speed: 10, lane_index: 0 },
//     { no: 4, vpos: 25, width: 20, speed: 10, lane_index: 0 }
// ]

// let lanes = [
//     { no: -1, nokori: 0 },
//     { no: -1, nokori: 0 },
//     { no: -1, nokori: 0 }
// ]

// let window_w = 500

// const update_lane = (cu_vops) => {
//     lanes.forEach((lane, index) => {
//         if (lane.no !== -1) {
//             const no = lane.no
//             const vops = comments[no].vpos
//             const time = vops - cu_vops
//             const pos = window_w + comments[no].width - time * comments[no].speed
//             if (ops <= 0) {
//                 lane.no = -1
//                 lane.nokori = 0
//             } else {
//                 lane.nokori = ops
//             }
//         }
//     })
// }

// const get_index_of_priority_lane = () => {
//     for (let i = 0; i < lanes.length; i++) {
//         if (lanes[i].no === -1) {
//             return i
//         }
//     }
//     return lanes.indexOf(Math.min.apply(null, lanes.map(function (o) { return o.nokori })))
// }

// comments.forEach((c) => {
//     update_lane(c.vpos)
//     const index = get_index_of_priority_lane()
//     c.lane_index = index;
//     lanes[index].no = c.no
//     lanes[index].nokori = window_w + c.width
// })
