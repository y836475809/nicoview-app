
class nico_comment {
    constructor(lane_num) {
        this.lanes = []
        for (let i = 0; i < lane_num; i++) {
            this.lanes.push({ no: -1, nokori: 0 })
        }
    }

    set comments(comments) {
        this.comments = comments
    }

    calc_comment() {
        this.comments.forEach((c) => {
            _update_lane(c.vpos)
            const index = _get_index_of_priority_lane()
            c.lane_index = index;
            lanes[index].no = c.no
            lanes[index].nokori = window_w + c.width
        })
    }

    _update_lane(cu_vops) {
        this.lanes.forEach((lane, index) => {
            if (lane.no !== -1) {
                const no = lane.no
                const vops = comments[no].vpos
                const time = vops - cu_vops
                const pos = window_w + comments[no].width - time * comments[no].speed
                if (ops <= 0) {
                    lane.no = -1
                    lane.nokori = 0
                } else {
                    lane.nokori = ops
                }
            }
        })
    }

    _get_index_of_priority_lane() {
        for (let i = 0; i < this.lanes.length; i++) {
            if (this.lanes[i].no === -1) {
                return i
            }
        }
        return this.lanes.indexOf(Math.min.apply(null, this.lanes.map(function (o) { return o.nokori })))
    }


}

module.exports = nico_comment