
class nico_comment {
    constructor(lane_num) {
        this.lanes = []
        for (let i = 0; i < lane_num; i++) {
            this.lanes.push({ no: -1, nokori: 0 })
        }
    }

    set comments(val) {
        this._comments = val

        this.m = new Map()
        this._comments.forEach((c, index) => {
            this.m.set(c.no, index)
        })
    }

    get comments() {
        return this._comments
    }

    set width(val) {
        this._width = val
    }

    calc_comment() {
        this._comments.forEach((c) => {
            this._update_lane(c.vpos)

            const index = this._get_index_of_priority_lane()
            c.lane_index = index;

            this.lanes[index].no = c.no
            this.lanes[index].nokori = this._width + c.width
        })
    }

    _update_lane(cu_vpos) {
        this.lanes.forEach((lane, index) => {
            if (lane.no !== -1) {
                const no = lane.no
                const index = this.m.get(no)
                const vpos = this._comments[index].vpos
                const time = cu_vpos - vpos
                const pos =
                    this._width
                    + this._comments[index].width
                    - time * this._comments[index].speed
                if (pos <= 0) {
                    lane.no = -1
                    lane.nokori = 0
                } else {
                    lane.nokori = pos
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
        let rems = this.lanes.map(function (o) { return o.nokori })
        let index = rems.indexOf(Math.min.apply(null, rems))
        return index
    }
}

module.exports = nico_comment