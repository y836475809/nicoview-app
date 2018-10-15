// @ts-check

class FixComment{
    constructor(row_num, duration){
        this.duration = duration;
        this.row_num = row_num;
        this.rows = [];
        for (let i = 0; i < row_num; i++) {
            this.rows.push([]);
        }
    }

    /**
     * 
     * @param {Array} comments 
     */
    calc(comments){
        comments.forEach((cm)=>{
            this.update(cm.vpos);
            const index = this.getEmptyIndex();
            if(index>=0){
                cm.row_index = index;
            }else{
                cm.row_index = this.getMin();
            }
            this.rows[cm.row_index].push({no:cm.no, vpos:cm.vpos});
        });
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


};

module.exports = FixComment;