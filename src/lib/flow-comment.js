const { logger } = require("./logger");

class FlowComment {
    constructor(row_num, view_width, duration=3000) {
        this.row_num = row_num;
        this.view_width = view_width;
        this.duration = duration;
    }

    getRowIndex(comment) {
        return this.id_row_map.get(`${comment.no}:${comment.user_id}`);
    }

    createRowIndexMap(comments) {
        let params = this._getParams(comments, this.duration);
        this.id_row_map = this._createRowIndexMap(params);
    }

    _createRowIndexMap(params) {
        let no_row_map = new Map();

        this.params = params;
        this.rows = [];
        for (let i = 0; i < this.row_num; i++) {
            this.rows.push({ id: null, nokori: 0 });
        }

        this.id_index_map = new Map();
        this.params.forEach((p, index) => {
            this.id_index_map.set(p.id, index);
        });

        this.params.forEach((param) => {
            this._update_lane(param.vpos);
            const row_index = this._get_index_of_priority_lane();
            no_row_map.set(param.id, row_index);

            this.rows[row_index].id = param.id;
            this.rows[row_index].nokori = this.view_width + param.width;
        });

        return no_row_map;
    }

    _getParams(comments, duration) {
        const scale_map = new Map([["big", 1.3],["middle", 1], ["small", 0.8]]);

        return comments.map((comment) => {
            const text = comment.content;
            // const scale = comment.font_scale;
            let scale = scale_map.get("middle");
            if(scale_map.has(comment.font_size)){
                scale = scale_map.get(comment.font_size);
            }else{
                logger.error(`scale_mapにfont_size=${comment.font_size}が存在しない。middleを使用する`)
            }

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
                id: `${comment.no}:${comment.user_id}`,
                no: comment.no,
                vpos: comment.vpos,
                width: text_width,
                speed: speed
            };
        });
    }

    _update_lane(cu_vpos) {
        this.rows.forEach((lane) => {
            if (lane.id !== null) {
                const id = lane.id;
                const index = this.id_index_map.get(id);
                const vpos = this.params[index].vpos;
                const time = cu_vpos - vpos;
                const pos =
                    this.view_width
                    + this.params[index].width
                    - time * this.params[index].speed;
                if (pos <= 0) {
                    lane.id = null;
                    lane.nokori = 0;
                } else {
                    lane.nokori = pos;
                }
            }
        });
    }

    _get_index_of_priority_lane() {
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].id === null) {
                return i;
            }
        }
        let rems = this.rows.map(function (o) { return o.nokori; });
        let index = rems.indexOf(Math.min.apply(null, rems));
        return index;
    }
}

module.exports = {
    FlowComment
};