// @ts-check

const FlowComment = require("./flow_comment");
const FixedComment = require("./fixed_comment");
const { FlowCommentTimeLine, FixedCommentTimeLine } = require("./comment_timeline");

class CommentTimeLineManager {
    constructor(parent_id, div_num, row_num, interval_ms, get_time_func) {
        this.parent_id = parent_id;

        this.div_num = div_num;
        this.row_num = row_num;

        this.timelines = [];
        this.interval_ms = interval_ms;
        this.get_time_func = get_time_func;
        this.play_timer = null;
    }

    create(commnets, duration) {
        console.log("commnets1=", performance.now());
        let parent_elm = document.getElementById(this.parent_id);
        const view_width = parent_elm.clientWidth;

        let [ flow_commnets, 
            fixed_top_commnets,
            fixed_bottom_commnets ] = this.getEachComments(commnets);
        console.log("commnets2=", performance.now());

        let flow_cmt = new FlowComment(this.row_num, view_width, duration);
        const flow_no_row_map = flow_cmt.getNoRowIndexMap(flow_commnets);
        
        console.log("commnets3=", performance.now());

        let flixed_cmt = new FixedComment(this.row_num, duration);
        const fixed_top_no_row_map = flixed_cmt.getNoRowIndexMap(fixed_top_commnets);
        const fixed_bottom_no_row_map = flixed_cmt.getNoRowIndexMap(fixed_bottom_commnets);

        console.log("commnets4=", performance.now());

        let fragment = document.createDocumentFragment();

        flow_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(cmt);
            elm.classList.add("flow");
            elm.setAttribute("data-rowindex", flow_no_row_map.get(cmt.no).toString());

            fragment.appendChild(elm);
        });

        console.log("commnets5=", performance.now());

        fixed_top_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(cmt);
            elm.classList.add("fixed");
            elm.setAttribute("data-rowindex", fixed_top_no_row_map.get(cmt.no).toString());

            fragment.appendChild(elm);
        });

        console.log("commnets6=", performance.now());

        fixed_bottom_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(cmt);
            elm.classList.add("fixed");
            elm.setAttribute("data-rowindex", fixed_bottom_no_row_map.get(cmt.no).toString()); 

            fragment.appendChild(elm);
        });

        console.log("commnets7=", performance.now());

        parent_elm.appendChild(fragment);

        console.log("commnets7-2=", performance.now());
        this.sizeSetting();

        console.log("commnets8=", performance.now());

        this.timelines = [];
        this.createTimeLine(flow_commnets, ".flow", duration, this.createFlowTimeLine);

        console.log("commnets9=", performance.now());

        this.createTimeLine(
            fixed_top_commnets.concat(fixed_bottom_commnets), 
            ".fixed", duration, this.createFixedTimeLine);

        console.log("commnets10=", performance.now());
    }

    delete() {
        let view = document.getElementById(this.parent_id);
        let elms = view.querySelectorAll(".comment");
        elms.forEach((elm) => {
            view.removeChild(elm);
        });
    }

    sizeSetting(){
        console.log("sizeSetting0=", performance.now());
        let parent_elm = document.getElementById(this.parent_id);
        const view_height = parent_elm.clientHeight;

        console.log("sizeSetting1=", performance.now());
        let clone = parent_elm.cloneNode(true);

        console.log("sizeSetting2=", performance.now());
    
        let elements = clone.querySelectorAll(".comment");
        for (let index = 0, len = elements.length; index < len; index++) {
            let elm = elements[index];
            const font_size = elm.getAttribute("data-fontsize");
            if(font_size=="big"){
                elm.style.fontSize =  Math.floor(view_height/15) + "px";
            }else if(font_size=="small"){
                elm.style.fontSize =  Math.floor(view_height/25) + "px";
            }else{
                elm.style.fontSize = Math.floor(view_height/20) + "px";
            }       
        }
        console.log("sizeSetting3=", performance.now());
    
        parent_elm.parentNode.replaceChild(clone, parent_elm);
        
        console.log("sizeSetting4=", performance.now());

        parent_elm = document.getElementById(this.parent_id);

        console.log("sizeSetting5=", performance.now());

        let elms = parent_elm.querySelectorAll(".comment");

        console.log("sizeSetting6=", performance.now());

        elms.forEach((elm) => {
            const width = elm.getBoundingClientRect().width;
            elm.setAttribute("data-width", width.toString());
        });
        console.log("sizeSetting7=", performance.now());

        // function sampleResolve() {
        //     return new Promise(resolve => {
        //         for (let index = 0, len = elements.length/2; index < len; index++) {
        //             let elm = elements[index];
        //             const width = elm.getBoundingClientRect().width;
        //             elm.setAttribute("data-width", width.toString());
        //         }
        //         resolve(1);
        //         // setTimeout(() => {
        //         //     resolve(value);
        //         // }, 2000);
        //     })
        // }
        
        // function sampleResolve2() {
        //     return new Promise(resolve => {
        //         for (let index = elements.length/2, len = elements.length; index < len; index++) {
        //             let elm = elements[index];
        //             const width = elm.getBoundingClientRect().width;
        //             elm.setAttribute("data-width", width.toString());
        //         }
        //         resolve(2);
        //         // setTimeout(() => {
        //         //     resolve(value * 2);
        //         // }, 1000);
        //     })
        // }
        // async function sample() {
        //     const [a] = await Promise.all([sampleResolve()]);
        //     const c = await sampleResolve2();
        
        //     return [a, c];
        // }
        // sample().then(([a, c]) => {
        //     console.log(a, c); // => 5 10 20
        // });
        // console.log("sizeSetting8=", performance.now());
    }

    getEachComments(comments) {
        let flow_commnets = [];
        let fixed_top_commnets = [];
        let fixed_bottom_commnets = [];

        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });

        comments.forEach(comment=>{
            const m_type = comment.mail.match(/ue|shita/gi);
            const m_size = comment.mail.match(/big|small/gi);
            let p = {
                no:comment.no, 
                vpos:comment.vpos*10, 
                text:comment.text, 
                type:"naka", 
                font_size:"middle"
            };

            if(m_size!=null){
                p.font_size = m_size[0];
            }

            if(m_type!=null){
                p.type = m_type[0];
                if(p.type=="ue"){
                    fixed_top_commnets.push(p);
                }else if(p.type=="shita"){
                    fixed_bottom_commnets.push(p);
                }
            }else{
                flow_commnets.push(p);
            }
        }); 
        
        return [flow_commnets, fixed_top_commnets, fixed_bottom_commnets];
    }

    createCommentElm(commnet){
        let elm = document.createElement("div");
        elm.innerHTML = commnet.text;
        elm.style.opacity = "0";
        elm.style.whiteSpace = "nowrap";
        elm.style.position = "absolute";
        elm.classList.add("comment");

        elm.setAttribute("data-delay", commnet.vpos.toString());
        elm.setAttribute("data-type", commnet.type);
        elm.setAttribute("data-fontsize", commnet.font_size);
 
        return elm;    
    }

    createTimeLine(commnets, selector, duration, create_timeline_func){
        if(commnets.length===0){
            return;
        }

        let qcnt = Math.floor(commnets.length / this.div_num) 
                    + (commnets.length % this.div_num == 0 ? 0 : 1);
        const seqnums = Array.from(new Array(commnets.length)).map((v, i) => i);
        let div_seq = [];
        for (let index = 0; index < qcnt; index++) {
            div_seq.push(seqnums.splice(0, this.div_num));
        }

        let parent_elm = document.getElementById(this.parent_id);
        let elms = parent_elm.querySelectorAll(selector);

        div_seq.forEach((list, i) => {
            let vposes = [];
            list.forEach(index => {
                vposes.push(commnets[index].vpos);
                let elm = elms[index];
                elm.classList.add(`group${i}`);
            });

            let timeline = create_timeline_func(this.parent_id, `${selector}.group${i}`, duration);
            timeline.start_time = Math.min.apply(null, vposes);
            timeline.last_time = Math.max.apply(null, vposes) + duration;

            console.log("ctl.start_time=", timeline.start_time);

            this.timelines.push(timeline);
        });       
    }

    createFlowTimeLine(parent_id, selector, duration){
        return new FlowCommentTimeLine(
            parent_id,
            { 
                selector: selector, 
                duration: duration 
            });     
    }
    createFixedTimeLine(parent_id, selector, duration){
        return new FixedCommentTimeLine(
            parent_id,
            { 
                selector: selector, 
                duration: duration 
            });     
    }

    test() {
        this.timelines.forEach((tl) => {
            if (!tl.is_play && !tl.is_cpmpleted && tl.start_time <= this.get_time_func()) {
                console.log("test play=", tl.is_play, 
                    "ctl.start_time=", tl.start_time, "cu time=", this.get_time_func());
                tl.play();
            }
        });
        if (this.play_timer) {
            this.play_timer = setTimeout(() => {
                this.test();
            }, this.interval_ms);
        }
    }

    play() {
        if (this.play_timer == null) {
            this.timelines.forEach((tl) => {
                if (!tl.is_play && !tl.is_cpmpleted && tl.start_time <= this.get_time_func()) {
                    tl.play();
                }
            });
            this.play_timer = setTimeout(() => {
                this.test();
            }, this.interval_ms);
        }
    }

    pause() {
        clearTimeout(this.play_timer);
        this.play_timer = null;
        this.timelines.forEach((tl) => {
            tl.pause();
        });
    }

    seek(time_ms) {
        this.timelines.forEach((tl) => {
            tl.seek(time_ms);
        });
    }

    reset(){
        this.pause();
        this.sizeSetting();
        this.timelines.forEach((tl) => {
            tl.reset();
        });
        // this.timelines = [];
    }
}

module.exports = CommentTimeLineManager;