const { CommentTimeLine } = require("./comment-timeline");


class TimeLine {
    constructor(area_width, duration_ms){
        this._area_width = area_width;
        this._duration_ms = duration_ms;

        /** @type {Animation[]} */
        this._comments = [];

        /** @type {Map<string, HTMLElement>} */
        this._em_map = new Map();

        this._current_time_ms = 0;
        this._last_time_ms = 0;
        this._interval_id = null;
        this._interval_ms = 100;
        this._start_index = 0;  
        
    }

    get current_time_ms(){
        return this._current_time_ms;
    } 
    
    set last_time_ms(value){
        this._last_time_ms = value;
    } 

    onComplete(on_complete){
        this._on_complete = on_complete;
    }

    clear(){
        this._clearInterval();
        this._current_time_ms = 0;
        this._start_index = 0;
        this._comments.forEach(ani=>{
            ani.cancel();
        });
        this._comments = [];
        this._em_map.clear();
    }

    play(){
        if(this._interval_id){
            return;
        }
        this._interval_id = setInterval(() => {
            this._updateAnimetion();   
            if(this._current_time_ms >= this._last_time_ms + 100){
                this._clearInterval();
                if(this._on_complete){
                    this._on_complete();
                }
            }
            this._current_time_ms += this._interval_ms;
        }, this._interval_ms);
    }

    _updateAnimetion(){
        for(let i=this._start_index; i< this._comments.length; i++){
            const ani = this._comments[i];
            const delay = ani.effect.getTiming().delay;
            const pre = delay + this._duration_ms + 500;
            if(this._current_time_ms > pre){
                this._start_index = i;
                const em = this._em_map.get(ani.id);
                if(em.style.display == "block"){
                    em.style.display = "none";
                }
                continue;
            }    
            if(this._current_time_ms + 1000 < delay){
                break;
            }
            const em = this._em_map.get(ani.id);
            if(em.style.display == "none"){
                em.style.display = "block";
            }
            ani.currentTime = this._current_time_ms;
        } 
    }

    _clearInterval(){
        clearInterval(this._interval_id);
        this._interval_id = null;
    }

    pause(){
        this._clearInterval();
    }

    seek(seek_sec){
        const seek_ms = seek_sec*1000;
        this._current_time_ms = seek_ms;
        this._start_index = 0;
        this._comments.forEach(ani=>{
            this._em_map.get(ani.id).style.display = "none";
        }); 
        this._updateAnimetion();
    }

    createFlow(params){
        params.forEach((param)=>{
            const { elm, left, delay } = param;
            this._em_map.set(elm.id, elm);
            const move = elm.animate(
                [
                    { transform: `translateX(${left}px)` }
                ],
                {
                    duration: this._duration_ms,
                    delay: delay*1000,
                }
            );
            move.id = elm.id;
            move.cancel();
            this._comments.push(move);
        });
    }

    createFix(params){
        params.forEach((param)=>{
            const { elm, delay, pos } = param;
            this._em_map.set(elm.id, elm);
            const move = elm.animate(
                [
                    { transform: `translateX(${-pos}px)` },
                ],
                {
                    duration: this._duration_ms,
                    easing: "step-start",
                    delay: delay*1000,
                }
            );
            move.id = elm.id;
            move.cancel();
            this._comments.push(move);
        });
    }

    sortComments(){
        this._comments.sort((a, b) => {
            const a_delay = a.effect.getTiming().delay;
            const b_delay = b.effect.getTiming().delay;
            if (a_delay < b_delay) return -1;
            if (a_delay > b_delay) return 1;
            return 0;
        });
    }
}

class NicoCommentTimeLine extends CommentTimeLine {
    constructor(parent_elm, duration_sec, row_num, comment_font_family){
        super(parent_elm, duration_sec, row_num, comment_font_family);

        this._duration_ms = duration_sec*1000;
        /** @type {TimeLine} */
        this._timeLine = new TimeLine(
            this.area_size.width, this._duration_ms);
    }

    setFPS(fps){
    }

    create(comments) {
        this._has_comment = comments.length > 0;
        this._ended = false;
        this._createCanvas();
        this.clear();
        
        if(!this._timeLine){
            this._timeLine = new TimeLine(
                this.area_size.width, this._duration_ms);
        }
        this._timeLine.onComplete(this._on_complete);

        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });

        this._last_time_sec = 0;
        if(comments.length>0){
            this._last_time_sec  = 
                comments[comments.length-1].vpos/100 + this.duration_sec;
        }
        this._timeLine.last_time_ms = this._last_time_sec * 1000;
        
        const {flow_comments,
            fixed_top_comments,
            fixed_bottom_comments} = this._getEachComments(comments);

        this._createFlowTL(flow_comments);
        this._createFixedTL(fixed_top_comments, fixed_bottom_comments);

        this._timeLine.sortComments();
    }

    _createFlowTweenMax(params){
        this._timeLine.createFlow(params);
    }

    _createFixedTweenMax(params){
        this._timeLine.createFix(params);
    }

    _createFlowParams(comments, flow_cmt, row_h, fragment){
        flow_cmt.createRowIndexMap(comments);

        return comments.map((comment, index) => {
            const row_index = flow_cmt.getRowIndex(comment);
            const { elm, text_width } = this._createElm(comment, fragment);
            const id = `flow-comment-id${index}`;
            elm.id = id;
            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            elm.style.top = (row_index * row_h + margin) + "px";

            const left = -(this.area_size.width + text_width);
            const delay = comment.vpos / 1000; //sec
            return { elm, left, delay };
        });
    }

    _createFixedParams(pos_type, comments, fixed_cmt, row_h, fragment){
        return comments.map((comment, index) => {
            const row_index = fixed_cmt.getRowIndex(comment);
            const { elm, text_width } = this._createElm(comment, fragment);
            const id = `fixed-${pos_type}-comment-id${index}`;
            elm.id = id;
            const delay = comment.vpos / 1000; //sec
            const pos = (this.area_size.width / 2 + text_width / 2);
            elm.style.left = (this.area_size.width + 5) + "px";

            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            if(pos_type=="ue"){
                elm.style.top = (row_index * row_h + margin) + "px";
            }else if(pos_type=="shita"){
                elm.style.top = ((this.row_num - row_index - 1) * row_h + margin) + "px";
            }

            return { elm, delay, pos };
        });
    }

    /**
     * fragmentにコメント要素を追加してその要素を返す
     * @param {CommentElm} comment 
     * @param {DocumentFragment} fragment 
     * @returns {{elm:HTMLDivElement, text_width:number}}
     */
    _createElm(comment, fragment){
        const elm = document.createElement("div");
        elm.classList.add("comment");

        // 半角空白が連続していたら一つにまとめられてしまうので
        // 2個連続している半角空白を全角空白に置き換える
        elm.innerText = comment.content.replace(/(\s)\1/g, "\u3000");

        elm.style.display = "none";
        elm.style.whiteSpace = "nowrap";
        elm.style.position = "absolute";
        
        fragment.appendChild(elm);

        const view_height = this.area_size.height;
        const view_width = this.area_size.width;

        let font_size = Math.floor(view_height/20);
        if(comment.font_size=="big"){
            font_size = Math.floor(view_height/15);
        }else if(comment.font_size=="small"){
            font_size = Math.floor(view_height/25);
        }
        
        const text_width = this._getTextWidth(comment.content, font_size);

        elm.style.fontSize = font_size + "px";
        elm.style.left = (view_width + 5) + "px";
        elm.style.color = comment.color;

        return {elm, text_width};    
    }

    clear(){
        if(this.enable!==true){
            return;
        }
        if(!this._timeLine){
            return;
        }

        this._timeLine.clear();
        this.parent_elm.querySelectorAll(".comment").forEach(elm=>{
            this.parent_elm.removeChild(elm);
        });
        this._timeLine = null;

        this._paused = true;
    }

    play(){
        if(this.enable!==true){
            return;
        }
        this._paused = false;
        this._timeLine.play();
    }

    pause(){
        if(this.enable!==true){
            return;
        }
        this._timeLine.pause();
        this._paused = true;
    }

    /**
     * 
     * @param {number} seek_sec 
     * @returns {void}
     */
    seek(seek_sec){
        if(seek_sec < this.lastTimeSec){
            this._ended = false;
        }else{
            this._ended = true;
        }   

        if(this.enable!==true){
            return;
        }
        this._timeLine.seek(seek_sec);
    }

    /**
     * 現在の再生時刻を返す
     * @returns {number}
     */
    getCurrentTime(){
        return this._timeLine.current_time_ms / 1000;
    }
}

module.exports = {
    NicoCommentTimeLine,
};