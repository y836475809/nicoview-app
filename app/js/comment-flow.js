const { TweenMax, TimelineMax } = require("gsap");
const FlowComment = require("./flow_comment");
const FixedComment = require("./fixed_comment");

class CommentFlow {
    constructor(duration_msec, row_num){
        this.duration = duration_msec;
        this.row_num = row_num;
        this.ctx = null;
    }

    createCanvas(){
        if(this.ctx){
            return;
        }
        const mem_canvas = document.createElement("canvas");
        this.ctx = mem_canvas.getContext("2d");
    }

    getTextWidth(text, fontSize){
        this.ctx.font = fontSize + "px Verdana, Geneva, Tahoma, sans-serif";
        return this.ctx.measureText(text).width;
    }

    /**
     * 
     * @param {Array} comments 
     */
    create(parent_elm, comments) {
        this.createCanvas();
        this.mm = new Map();
        this.area_size = {
            height: parent_elm.clientHeight,
            width: parent_elm.clientWidth
        };
        const view_width = this.area_size.width;

        const [flow_comments,
            fixed_top_comments,
            fixed_bottom_comments] = this._getEachComments(comments);

        const flow_cmt = new FlowComment(this.row_num, view_width, this.duration);
        const flow_no_row_map = flow_cmt.getNoRowIndexMap(flow_comments);

        let flixed_cmt = new FixedComment(this.row_num, this.duration);
        const fixed_top_row_map = flixed_cmt.getNoRowIndexMap(fixed_top_comments);
        const fixed_bottom_row_map = flixed_cmt.getNoRowIndexMap(fixed_bottom_comments);

        const fragment = document.createDocumentFragment();

        const infos = this._createmm(flow_comments, flow_no_row_map, fragment);
        parent_elm.appendChild(fragment);
        
        // this.tws = this._createTimeLine(infos);
        this._ccline(infos);
        // flow_comments.forEach((cmt) => {
        //     let elm = this.createCommentElm(cmt);
        //     elm.classList.add("flow");
        //     elm.setAttribute("data-rowindex", flow_no_row_map.get(cmt.no).toString());

        //     fragment.appendChild(elm);
        // });


        // fixed_top_comments.forEach((cmt) => {
        //     let elm = this.createCommentElm(cmt);
        //     elm.classList.add("fixed");
        //     elm.setAttribute("data-rowindex", fixed_top_no_row_map.get(cmt.no).toString());

        //     fragment.appendChild(elm);
        // });


        // fixed_bottom_comments.forEach((cmt) => {
        //     let elm = this.createCommentElm(cmt);
        //     elm.classList.add("fixed");
        //     elm.setAttribute("data-rowindex", fixed_bottom_no_row_map.get(cmt.no).toString());

        //     fragment.appendChild(elm);
        // });
        // parent_elm.appendChild(fragment);
    }

    clear(){
        // TweenMax.killAll();
        
    }

    play(){
        // TweenMax.resumeAll();
        this.timeLine.play();
        // this.timeLine.resume();
    }

    pause(){
        // TweenMax.pauseAll();
        this.timeLine.pause();
    }

    seek(seek_sec, curent_sec){
        this.timeLine.time(seek_sec, false);
        // this.timeLine.seek(seek_sec, false);
        // this.timeLine.seek(seek_sec, true);
        return;
        const is_tweening = TweenMax.isTweening();
        TweenMax.pauseAll();
        // CSSPlugin.defaultForce3D = false;
        let c1 = 0;
        let c2=0;
        this.tws.forEach(value=>{
           

            const elm = value.target[0];
            // TweenMax.set(elm, {force3D:false});
            const delay = parseFloat(elm.getAttribute("data-delay"))/1000;
            
            const dd = curent_sec - seek_sec;
            const ss = seek_sec - delay; 
            if(ss<0){
                // value.totalProgress(1, false);
                // value.delay(0);
                // value.progress(1);
                // value.play(1.001);
                // value.resume(1);
                // value.startTime(0);
                // value.invalidate();
                // value.time(seek_sec);
                // elm.style.display = "none";
                c1++;
            }else{
                c2++;
                value.delay(0);
                // value.startTime(ss);
                // value.time(ss);
            }
            // if(this.mm.has(elm.id)){
            //     if(this.mm.get(elm.id)==true){
            //         if(ss<0){
            //             // value.delay(delay-seek_sec);
            //             // value.restart(true,true);
            //             // value.seek(seek_sec, true);
            //             value.startTime(delay+seek_sec);
            //         }else{
            //             elm.style.display = "block";
            //             value.time(ss);
            //         }
            //     }else{
            //         if(ss<0){
            //             elm.style.display = "none";
            //             // value.delay(delay-seek_sec);
            //             // value.restart(true,true);
            //             // value.seek(seek_sec, true);
            //             value.startTime(delay+seek_sec);
            //         }else{
            //             value.time(ss);
            //         }
            //     }
            // }else{
            //     if(ss<0){
                   
            //         // value.delay(0);
            //         // value.seek(seek_sec);
            //         // value.restart(false,false);
            //         // value.play(delay-seek_sec);
            //         // value.seek(delay-seek_sec);
            //         // value.time(delay-seek_sec);
            //         // value.set(elm, {}, seek_sec);
            //         value.startTime(delay);
            //         // value.delay(delay-seek_sec);
            //         // value.time(seek_sec, true);
            //         // value.seek(seek_sec, true);
            //     }else{
            //         // elm.style.display = "block";
            //         value.time(ss);
            //     }
            // }
            // TweenMax.set(elm, {force3D:true});
        });

        // CSSPlugin.defaultForce3D = true;
        console.log("c1=", c1);
        console.log("c2=", c2);
        if(is_tweening==true){
            TweenMax.resumeAll();
        }else{
            TweenMax.pauseAll();
        }
    }

    createElm(comment, row_index, fragment){
        const elm = document.createElement("div");
        elm.classList.add("comment");

        elm.innerText = comment.text;

        const style = elm.style;
        style.display = "none";
        style.whiteSpace = "nowrap";
        style.position = "absolute";

        elm.setAttribute("data-delay", comment.vpos.toString());
        elm.setAttribute("data-type", comment.type);
        
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
        const text_width = this.getTextWidth(comment.text, parseInt(elm.style.fontSize));
        
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
    _createmm(comments, row_index_map, fragment){
        return comments.map((comment, index)=>{
            const row_index = row_index_map.get(comment.no);
            const { elm, text_width } = 
                this.createElm(comment, row_index, fragment);
            const id = `comment-id${index}`;
            elm.id = id;
            elm.classList.add("flow");
            const left = -(this.area_size.width + text_width);
            // const left = - text_width;
            const delay = comment.vpos / 1000; //sec
            return {
                elm, text_width, left, delay
            };
        });
    }

    _createfix(comments, row_index_map, fragment){
        const row_h = this.area_size.height / this.row_num;
        return comments.map((comment, index)=>{
            const row_index = row_index_map.get(comment.no);
            const { elm, text_width } = 
                this.createElm(comment, row_index, fragment);
            const id = `comment-id${index}`;
            elm.id = id;
            elm.classList.add("fixed");
            // const left = -(this.area_size.width + text_width);
            // const left = - text_width;
            const delay = comment.vpos / 1000; //sec
            const type = comment.type;
            elm.style.left = (this.area_size.area_width / 2 - parseInt(elm.getAttribute("data-width")) / 2) + "px";

            if(type=="ue"){
                elm.style.top = (row_index * row_h) + "px";
            }else if(type=="shita"){
                elm.style.top = ((this.row_num - row_index - 1) * row_h) + "px";
            }

            return {
                elm, text_width, left, delay
            };
        });
    }

    /**
     * 
     * @param {Array} infos 
     */
    _ccline(infos){
        const duration_sec = this.duration / 1000;
        this.timeLine = new TimelineMax();
        infos.forEach((info, index)=>{

            const { elm, text_width, left, delay } = info; 
            const id = elm.id;
            // elm.style.display = "block";
            this.timeLine.add(TweenMax.to(`#${id}` , duration_sec , 
                {
                    // force3D:true, 
                    // left:"0px",
                    x: left + "px",
                    // paused: true,
                    ease: Linear.easeNone,
                    onStart: function(){
                        // self.mm.set(this.target[0].id, false);
                        // console.log("onStart " + this.target[0].id);
                        this.target[0].style.display = "block";
                    },
                    onComplete: function(){
                        // self.mm.set(this.target[0].id, true);
                        // console.log("onComplete " + this.target[0].id);
                        this.target[0].style.display = "none";
                    }
                }), delay);
        });
        this.timeLine.pause();
    }
    /**
     * 
     * @param {Array} infos 
     */
    _createTimeLine(infos){
        // CSSPlugin.defaultForce3D = true;
        return infos.map((info, index)=>{
            const { elm, text_width, left, delay } = info; 
            const duration_sec = this.duration / 1000;
            const id = elm.id;
            const self = this;
            const tw = TweenMax.to(`#${id}` , duration_sec,
                {
                    force3D:true,
                    // force3D: false,
                    // rotation:0.01,
                    x: left + "px",
                    // left:left,
                    delay: delay,
                    paused: true,
                    // ease: Power0.easeNone,
                    ease: Linear.easeNone,
                    onStart: function(){
                        self.mm.set(this.target[0].id, false);
                        // console.log("onStart " + this.target[0].id);
                        this.target[0].style.display = "block";
                    },
                    onComplete: function(){
                        self.mm.set(this.target[0].id, true);
                        // console.log("onComplete " + this.target[0].id);
                        this.target[0].style.display = "none";
                    }
                },
            );
            return tw;  
        });
    }

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