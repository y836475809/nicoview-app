const { TweenMax, TimelineMax } = require("gsap");
const FlowComment = require("./flow_comment");
const FixedComment = require("./fixed_comment");

class CommentFlow {
    /**
     * 
     * @param {HTMLElement} parent_elm 
     * @param {Number} duration_sec 
     * @param {Number} row_num 
     */
    constructor(parent_elm, duration_sec, row_num){
        this.parent_elm = parent_elm;
        this.duration_sec = duration_sec;
        this.row_num = row_num;
        this.ctx = null;
        this.area_size = {
            height: parent_elm.clientHeight,
            width: parent_elm.clientWidth
        };
        this.timeLine = null;
    }

    /**
     * @param {Array} comments 
     */
    create(comments) {
        this._createCanvas();

        this.clear();
        this.timeLine = new TimelineMax({ paused: true });
        
        const [flow_comments,
            fixed_top_comments,
            fixed_bottom_comments] = this._getEachComments(comments);

        this._createFlowTL(flow_comments);
        this._createFixedTL(fixed_top_comments, fixed_bottom_comments);
    }

    /**
     * 
     * @param {Array} comments 
     */
    _createFlowTL(comments){
        const view_width = this.area_size.width;
        const duration_msec = this.duration_sec * 1000;

        const cmt = new FlowComment(this.row_num, view_width, duration_msec);
        const row_map = cmt.getNoRowIndexMap(comments);

        const fragment = document.createDocumentFragment();
        const params = this._createFlowParams(comments, row_map, fragment);
        this.parent_elm.appendChild(fragment);

        params.forEach((param)=>{
            const { elm, left, delay } = param; 
            const id = elm.id;
            this.timeLine.add(
                TweenMax.to(`#${id}`, this.duration_sec, {
                    x: left,
                    display : "block",
                    ease: Linear.easeNone,
                }), delay);
            this.timeLine.add(
                TweenMax.to(`#${id}`, 0.001, {
                    display : "none"
                }), delay + this.duration_sec);
        });
    }
    
    /**
     * 
     * @param {Array} top_comments 
     * @param {Array} bottom_comments 
     */
    _createFixedTL(top_comments, bottom_comments){
        const duration_msec = this.duration_sec * 1000;

        const cmt = new FixedComment(this.row_num, duration_msec);
        const top_row_map = cmt.getNoRowIndexMap(top_comments);
        const bottom_row_map = cmt.getNoRowIndexMap(bottom_comments);
        const row_map = new Map([...top_row_map, ...bottom_row_map]);
        const comments = top_comments.concat(bottom_comments);

        const fragment = document.createDocumentFragment();
        const params = this._createFixedParams(comments, row_map, fragment);
        this.parent_elm.appendChild(fragment);

        params.forEach((param)=>{
            const { elm, delay } = param; 
            const id = elm.id;
            this.timeLine.add(
                TweenMax.to(`#${id}`, this.duration_sec, {
                    alpha: 1, 
                    display : "block",
                }), delay);
            this.timeLine.add(
                TweenMax.to(`#${id}`, 0.001 , {
                    alpha: 0, 
                    display : "none"
                }), delay + this.duration_sec);
        });
    }

    clear(){
        if(!this.timeLine){
            return;
        }

        this.timeLine.kill();
        this.parent_elm.querySelectorAll(".comment").forEach(elm=>{
            this.parent_elm.removeChild(elm);
        });
        this.timeLine = null;
    }

    play(){
        this.timeLine.play();
    }

    pause(){
        this.timeLine.pause();
    }

    seek(seek_sec){
        this.timeLine.time(seek_sec, false);
    }

    _createCanvas(){
        if(this.ctx){
            return;
        }
        const canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
    }

    _getTextWidth(text, font_size){
        this.ctx.font = font_size + "px Verdana, Geneva, Tahoma, sans-serif";
        return this.ctx.measureText(text).width;
    }

    _createElm(comment, row_index, fragment){
        const elm = document.createElement("div");
        elm.classList.add("comment");

        elm.innerText = comment.text;

        elm.style.display = "none";
        elm.style.whiteSpace = "nowrap";
        elm.style.position = "absolute";
        
        fragment.appendChild(elm);

        const view_height = this.area_size.height;
        const view_width = this.area_size.width;
        const row_h = this.area_size.height/this.row_num;

        const font_size = comment.font_size;
        if(font_size=="big"){
            elm.style.fontSize =  Math.floor(view_height/15) + "px";
        }else if(font_size=="small"){
            elm.style.fontSize =  Math.floor(view_height/25) + "px";
        }else{
            elm.style.fontSize = Math.floor(view_height/20) + "px";
        } 
        const text_width = this._getTextWidth(comment.text, parseInt(elm.style.fontSize));
        
        elm.style.top = (row_index * row_h) + "px";
        elm.style.left = view_width + "px";

        return {elm, text_width};    
    }

    /**
     * 
     * @param {Array} comments 
     * @param {Map} row_index_map 
     * @param {DocumentFragment} fragment 
     */
    _createFlowParams(comments, row_index_map, fragment){
        return comments.map((comment, index)=>{
            const row_index = row_index_map.get(comment.no);
            const { elm, text_width } = 
                this._createElm(comment, row_index, fragment);
            const id = `flow-comment-id${index}`;
            elm.id = id;
            elm.classList.add("flow");
            const left = -(this.area_size.width + text_width);
            const delay = comment.vpos / 1000; //sec
            return { elm, left, delay };
        });
    }

    /**
     * 
     * @param {Array} comments 
     * @param {Map} row_index_map 
     * @param {DocumentFragment} fragment 
     */
    _createFixedParams(comments, row_index_map, fragment){
        const row_h = this.area_size.height / this.row_num;
        return comments.map((comment, index)=>{
            const row_index = row_index_map.get(comment.no);
            const { elm, text_width } = 
                this._createElm(comment, row_index, fragment);
            const id = `fixed-comment-id${index}`;
            elm.id = id;
            elm.classList.add("fixed");
            const delay = comment.vpos / 1000; //sec
            const type = comment.type;
            elm.style.left = (this.area_size.width / 2 - text_width / 2) + "px";

            if(type=="ue"){
                elm.style.top = (row_index * row_h) + "px";
            }else if(type=="shita"){
                elm.style.top = ((this.row_num - row_index - 1) * row_h) + "px";
            }

            return { elm, delay };
        });
    }

    /**
     * 
     * @param {Array} comments 
     */
    _getEachComments(comments) {
        const flow_comments = [];
        const fixed_top_comments = [];
        const fixed_bottom_comments = [];

        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });

        comments.forEach(comment=>{
            const p = {
                no:comment.no, 
                vpos:comment.vpos*10, 
                text:comment.text, 
                type:"naka", 
                font_size:"middle"
            };

            const m_type = comment.mail ? comment.mail.match(/ue|shita/gi) : null;
            const m_size = comment.mail ? comment.mail.match(/big|small/gi) : null;

            if(m_size!=null){
                p.font_size = m_size[0];
            }

            if(m_type!=null){
                p.type = m_type[0];
                if(p.type=="ue"){
                    fixed_top_comments.push(p);
                }else if(p.type=="shita"){
                    fixed_bottom_comments.push(p);
                }
            }else{
                flow_comments.push(p);
            }
        }); 
        
        return [
            flow_comments, 
            fixed_top_comments, 
            fixed_bottom_comments];
    }
}

module.exports = {
    CommentFlow: CommentFlow,
};