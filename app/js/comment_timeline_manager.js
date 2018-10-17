// @ts-check

var NicoComment = require("../../nico_comment");
var FlowComment = require("./flow_comment");
var FixedComment = require("./fixed_comment");
var { FlowCommentTimeLine, FixedCommentTimeLine } = require("./comment_timeline");

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
        let parent_elm = document.getElementById(this.parent_id);
        const view_width = parent_elm.clientWidth;

        let [ flow_commnets, 
            fixed_top_commnets,
            fixed_bottom_commnets ] = this.getEachComments(commnets);

        let flow_cmt = new FlowComment(this.row_num, view_width, duration);
        const flow_no_row_map = flow_cmt.getNoRowIndexMap(flow_commnets);
        
        let flixed_cmt = new FixedComment(this.row_num, duration);
        const fixed_top_no_row_map = flixed_cmt.getNoRowIndexMap(fixed_top_commnets);
        const fixed_bottom_no_row_map = flixed_cmt.getNoRowIndexMap(fixed_bottom_commnets);

        let fragment = document.createDocumentFragment();

        flow_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(fixed_bottom_commnets);
            elm.classList.add("flow");
            elm.setAttribute("data-rowindex", flow_no_row_map.get(cmt.no).toString());

            fragment.appendChild(elm);
        });
        fixed_top_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(fixed_bottom_commnets);
            elm.classList.add("fixed");
            elm.setAttribute("data-rowindex", fixed_top_no_row_map.get(cmt.no).toString());
            // elm.setAttribute("data-type", cmt.type);

            fragment.appendChild(elm);
        });
        fixed_bottom_commnets.forEach((cmt) => {
            let elm = this.createCommentElm(fixed_bottom_commnets);
            elm.classList.add("fixed");
            elm.setAttribute("data-rowindex", fixed_bottom_no_row_map.get(cmt.no).toString()); 
            // elm.setAttribute("data-type", cmt.type);
            fragment.appendChild(elm);
        });
        parent_elm.appendChild(fragment);

        let elms = parent_elm.querySelectorAll(".comment");
        elms.forEach((elm) => {
            // const width = elm.offsetWidth;
            const width = elm.getBoundingClientRect().width;
            elm.setAttribute("data-width", width.toString());
        });

        this.createTimeLine(flow_commnets, "flow", duration, this.createFlowTimeLine);

        this.createTimeLine(
            fixed_top_commnets.concat(fixed_bottom_commnets), 
            "fixed", duration, this.createFixedTimeLine);
    }

    getEachComments(comments) {
        let flow_commnets = [];
        let fixed_top_commnets = [];
        let fixed_bottom_commnets = [];

        // const size_map = new Map([["big", 15],["middle", 20], ["small", 25]]);
        // const scale_map = new Map([["big", 1.3],["middle", 1], ["small", 0.8]]);
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

    createCommentElm(commnet, view_height){
        let elm = document.createElement("div");
        elm.innerHTML = commnet.text;
        elm.style.opacity = "0";
        elm.style.whiteSpace = "nowrap";
        elm.style.position = "absolute";
        elm.classList.add("comment");

        elm.setAttribute("data-delay", commnet.vpos.toString());
        elm.setAttribute("data-type", commnet.type);
        // elm.setAttribute("data-font_size", commnet.font_size);
        const font_size = commnet.font_size;  
        if(commnet.font_size=="big"){
            elm.style.fontSize =  Math.floor(view_height/15) + "px";
        }else if(commnet.font_size=="small"){
            elm.style.fontSize =  Math.floor(view_height/25) + "px";
        }else{
            elm.style.fontSize = Math.floor(view_height/20) + "px";
        }

        return elm;    
    }

    createTimeLine(commnets, class_name, duration, create_timeline_func){
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
        let elms = parent_elm.querySelectorAll(class_name);

        this.timelines = [];
        div_seq.forEach((list, i) => {
            let vposes = [];
            list.forEach(index => {
                vposes.push(commnets[index].vpos);
                let elm = elms[index];
                elm.classList.add(`group${i}`);
            });

            // let timeline = new FlowCommentTimeLine(
            //     this.parent_id,
            //     { selector: `${class_name}.group${i}`, duration: duration });
            let timeline = create_timeline_func(`${class_name}.group${i}`, duration);
            timeline.start_time = Math.min.apply(null, vposes);
            timeline.last_time = Math.max.apply(null, vposes) + duration;

            console.log("ctl.start_time=", timeline.start_time);

            this.timelines.push(timeline);
        });       
    }

    createFlowTimeLine(selector, duration){
        return new FlowCommentTimeLine(
            this.parent_id,
            { 
                selector: selector, 
                duration: duration 
            });     
    }
    createFixedTimeLine(selector, duration){
        return new FixedCommentTimeLine(
            this.parent_id,
            { 
                selector: selector, 
                duration: duration 
            });     
    }

    // create(duration, commnets) {
    //     // const parent_id = "area";
    //     let parent_elm = document.getElementById(this.parent_id);
    //     const width = parent_elm.clientWidth;
    //     // const duration = 3000;
    //     // const step = 2;
    //     // const step = 200;

    //     console.log("commnets1=", performance.now());
    //     let cm_elm = new comment_elm(this.parent_id, width, duration);
    //     console.log("commnets2=", performance.now());

    //     let flow_params = [];
    //     commnets.forEach((cm) => {
    //         const no = cm.no;
    //         const text = cm.text;
    //         const delay = cm.vpos * 10;
    //         let tmp = cm_elm.createFlowParam(text, no, delay);
    //         flow_params.push(tmp);
    //     });

    //     console.log("commnets3=", performance.now());
    //     // const num = 12;
    //     let nico_comment = new NicoComment(this.row_num);
    //     nico_comment.width = width;
    //     nico_comment.comments = flow_params;
    //     console.log("commnets4=", performance.now());
    //     nico_comment.calc_comment();
    //     console.log("commnets5=", performance.now());

    //     let fragment = document.createDocumentFragment();
    //     let all_elms = [];
    //     let all_vpos = [];
    //     nico_comment.comments.forEach((cm, index) => {
    //         let elm = cm_elm.createElm2(commnets[index].text, cm.vpos);
    //         fragment.appendChild(elm);
    //         elm.setAttribute("data-rowindex", (cm.lane_index).toString());
    //         all_elms.push(elm);
    //         all_vpos.push(cm.vpos);
    //     });
    //     parent_elm.appendChild(fragment);

    //     let elms = parent_elm.querySelectorAll(".comment");
    //     elms.forEach((elm) => {
    //         // const elm_width = elm.getBoundingClientRect().width;
    //         const elm_width = elm.offsetWidth;
    //         elm.setAttribute("data-width", elm_width.toString());
    //         // elm.style.display = "none";     
    //     });

    //     let qcnt = Math.floor(commnets.length / this.div_num) 
    //                 + (commnets.length % this.div_num == 0 ? 0 : 1);
    //     const seqnums = Array.from(new Array(commnets.length)).map((v, i) => i);
    //     let div_seq = [];
    //     for (let index = 0; index < qcnt; index++) {
    //         div_seq.push(seqnums.splice(0, this.div_num));
    //     }

    //     this.timelines = [];
    //     div_seq.forEach((list, i) => {
    //         let vpos = [];
    //         list.forEach(index => {
    //             vpos.push(all_vpos[index]);
    //             let elm = all_elms[index];
    //             elm.classList.add(`flow${i}`);
    //         });

    //         let timeline = new FlowCommentTimeLine(
    //             this.parent_id,
    //             { selector: `.flow${i}`, duration: duration });
    //         timeline.mind = Math.min.apply(null, vpos);
    //         timeline.last_time = Math.max.apply(null, vpos) + duration;
    //         console.log("ctl.mind=", timeline.mind);

    //         this.timelines.push(timeline);
    //     });

    //     console.log("commnets6=", performance.now());
    // };

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
            })
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

        this.timelines.forEach((tl) => {
            tl.reset();
        });
        // this.timelines = [];
    }
};

module.exports = CommentTimeLineManager;