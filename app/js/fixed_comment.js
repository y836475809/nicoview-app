
class FixedComment{
    constructor(row_num, duration){
        this.row_num = row_num;
        this.duration = duration;
    }

    /**
     * 
     * @param {Array} comments 
     */
    getNoRowIndexMap(comments){
        let no_row_map = new Map();

        this.rows = [];
        for (let i = 0; i < this.row_num; i++) {
            this.rows.push([]);
        }
        
        comments.forEach((comment)=>{
            this.update(comment.vpos);
            const index = this.getEmptyIndex();
            let row_index = 0;
            if(index>=0){
                row_index = index;
            }else{
                row_index = this.getMin();
            }
            no_row_map.set(comment.no, row_index);
            this.rows[row_index].push({no:comment.no, vpos:comment.vpos});
        });

        return no_row_map;
    }

    update(cur_vpos) {
        for (let i = 0; i < this.rows.length; i++) {
            if(this.rows[i].length>0){
                const array = this.rows[i];
                this.rows[i] = this.fill(array, cur_vpos);
            }
        }
    }

    getEmptyIndex(){
        for (let i = 0; i < this.rows.length; i++) {
            if(this.rows[i].length===0){
                return i;
            }
        }
        return -1;
    }

    getMin(){
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
    fill(ary, cur_vpos) {
        return ary.filter(n => 
        {
            return cur_vpos < (n.vpos+this.duration);
        });
    }
}

module.exports = FixedComment;