
class FixedComment{
    constructor(row_num){
        this.row_num = row_num;
    }

    getRowIndex(comment) {
        return this.id_row_map.get(`${comment.no}:${comment.user_id}`);
    }

    /**
     * 
     * @param {Array} comments 
     */
    createRowIndexMap(comments){
        this.id_row_map = new Map();

        this.rows = [];
        for (let i = 0; i < this.row_num; i++) {
            this.rows.push([]);
        }
        
        comments.forEach((comment)=>{
            this._update(comment.vpos);
            const index = this._getEmptyIndex();
            let row_index = 0;
            if(index>=0){
                row_index = index;
            }else{
                row_index = this._getMin();
            }
            this.id_row_map.set(`${comment.no}:${comment.user_id}`, row_index);
            this.rows[row_index].push(comment);
        });
    }

    _update(cur_vpos) {
        for (let i = 0; i < this.rows.length; i++) {
            if(this.rows[i].length>0){
                const array = this.rows[i];
                this.rows[i] = this._fill(array, cur_vpos);
            }
        }
    }

    _getEmptyIndex(){
        for (let i = 0; i < this.rows.length; i++) {
            if(this.rows[i].length===0){
                return i;
            }
        }
        return -1;
    }

    _getMin(){
        for (let i = 0; i < this.rows.length-1; i++) {
            const cur = this.rows[i].length;
            const next = this.rows[i+1].length;
            if(cur > next){
                return i+1;
            }
        }
        return 0;       
    }

    /**
     * 
     * @param {Array} ary 
     * @param {number} cur_vpos 
     */  
    _fill(ary, cur_vpos) {
        return ary.filter(n => 
        {
            return cur_vpos < (n.vpos + n.duration);
        });
    }
}

module.exports = FixedComment;