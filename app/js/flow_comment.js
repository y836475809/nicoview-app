
class FlowComment {
    constructor(row_num, view_width, duration=3000) {
        this.row_num = row_num;
        this.view_width = view_width;
        this.duration = duration;
    }

    getNoRowIndexMap(comments) {
        let params = this._getParams(comments, this.duration);
        return this._getNoRowIndexMap(params);
    }

    _getNoRowIndexMap(params) {
        let no_row_map = new Map();

        this.params = params;
        this.rows = [];
        for (let i = 0; i < this.row_num; i++) {
            this.rows.push({ no: -1, nokori: 0 });
        }

        this.no_index_map = new Map();
        this.params.forEach((p, index) => {
            this.no_index_map.set(p.no, index);
        });

        this.params.forEach((param) => {
            this._update_lane(param.vpos);
            const row_index = this._get_index_of_priority_lane();
            no_row_map.set(param.no, row_index);

            this.rows[row_index].no = param.no;
            this.rows[row_index].nokori = this.view_width + param.width;
        });

        return no_row_map;
    }

    _getParams(comments, duration) {
        const scale_map = new Map([["big", 1.3],["middle", 1], ["small", 0.8]]);

        return comments.map((comment) => {
            const text = comment.text;
            // const scale = comment.font_scale;
            const scale = scale_map.get(comment.font_size);

            let half_num = 0;
            const half = text.match(/[\w\d !"#$%&'()*+\-.,/:;<=>?@[\\\]^`{|}~]/g);
            if (half) {
                half_num = half.length;
            }
            const zen_num = text.length - half_num;
            const text_width = (half_num + 2 * zen_num) * scale;

            const len = this.view_width + text_width;
            const speed = len / duration;

            return {
                no: comment.no,
                vpos: comment.vpos,
                width: text_width,
                speed: speed
            };
        });
    }

    _update_lane(cu_vpos) {
        this.rows.forEach((lane) => {
            if (lane.no !== -1) {
                const no = lane.no;
                const index = this.no_index_map.get(no);
                const vpos = this.params[index].vpos;
                const time = cu_vpos - vpos;
                const pos =
                    this.view_width
                    + this.params[index].width
                    - time * this.params[index].speed;
                if (pos <= 0) {
                    lane.no = -1;
                    lane.nokori = 0;
                } else {
                    lane.nokori = pos;
                }
            }
        });
    }

    _get_index_of_priority_lane() {
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].no === -1) {
                return i;
            }
        }
        let rems = this.rows.map(function (o) { return o.nokori; });
        let index = rems.indexOf(Math.min.apply(null, rems));
        return index;
    }
}

module.exports = FlowComment;