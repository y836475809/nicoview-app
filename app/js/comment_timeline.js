

class TimeLine {
    /**
     * @param {string} parent_selector
     * @param {{selector: string, duration: number}} flow_params
     * @param {{selector: string, duration: number}} fix_params
     */
    constructor(parent_selector, flow_params, fix_params) {
        this.parent_selector = parent_selector;
        this.flow_params = flow_params;
        this.fix_params = fix_params;
        this.flow_timeline = null;
        this.fix_timeline = null;
        this.is_play = false;
        this.elms = [];
    }

    // getMinDelay(selector){
    //     const elms = document.querySelectorAll(selector);
    //     this.mind = Math.min.apply(null, 
    //         Array.from(elms).map(elm => elm.getAttribute('data-delay')));
    //     // console.log("mind=", this.mind);
    // }

    createFlow() {
        console.log("createFlow=", this.flow_params.selector);
        const selector = this.flow_params.selector;
        const duration = this.flow_params.duration;

        //if(this.flow_timeline == null){
        this.elms.forEach((elm) => {
            elm.style.display = "block";
        });
        //d}

        if (this.flow_timeline != null) {
            this.flow_timeline.pause();
            this.flow_timeline.reset();
            anime.remove(selector);
        }

        // this.getMinDelay(selector);

        const area = document.getElementById(this.parent_selector);
        const area_width = area.clientWidth;
        // let elms = document.querySelectorAll(selector);
        this.elms.forEach((elm) => {
            elm.style.opacity = 0;
            elm.style.left = area_width + "px";
            const rowindex = parseInt(elm.getAttribute('data-rowindex'));
            elm.style.top = (rowindex * 30) + "px";
        });

        this.flow_timeline = anime.timeline({
            targets: selector,
            // targets: elms,
            easing: 'linear',
            loop: false,
            autoplay: false
        });
        this.flow_timeline
            .add({
                delay: (el, i) => {
                    return el.getAttribute('data-delay') - this.mind;
                },
                opacity: [0, 1],
                duration: 1,
            })
            .add({
                delay: (el, i) => {
                    return el.getAttribute('data-delay') - this.mind;
                },
                translateX: (el, i) => {
                    return -(area_width + el.getBoundingClientRect().width);
                },
                duration: duration,
                offset: 1,
                complete: () => {
                    this.elms.forEach((elm) => {
                        elm.style.display = "none";
                    });
                }
            })
        // .add({
        //     opacity: 0,  
        //     duration: 1,
        //     complete:()=>{
        //         this.p.forEach((elm) => {
        //             elm.style.display= "none"; 
        //         });
        //     }
        // });
    }

    createFix() {
        const selector = this.fix_params.selector;
        const duration = this.fix_params.duration;

        if (this.fix_timeline != null) {
            this.fix_timeline.pause();
            this.fix_timeline.reset();
            anime.remove(selector);
        }

        const area = document.querySelector(this.parent_selector);
        const area_width = area.clientWidth;

        let elms = document.querySelectorAll(selector);
        elms.forEach((elm) => {
            elm.style.opacity = 0;
            const elm_rect = elm.getBoundingClientRect();
            elm.style.left = (area_width / 2 - elm_rect.width / 2) + "px";
        });

        this.fix_timeline = anime.timeline({
            targets: selector,
            delay: (el, i) => {
                return el.getAttribute('data-delay');
            },
            // easing: 'linear',
            // duration: duration,
            loop: false,
            autoplay: false
        });

        this.fix_timeline
            .add({
                opacity: 1,
                duration: 1
            })
            .add({
                // opacity: 1,
                duration: duration
            })
            .add({
                opacity: 0,
                duration: 1,
            });
    }

    play() {
        // if(!this._hasTimeline()) return;
        if (this.flow_timeline == null) {
            console.log("createFlow1=", performance.now());
            this.createFlow();
            console.log("createFlow2=", performance.now());
        }
        this.flow_timeline.play();
        this.is_play = true;
        //this.fix_timeline.play();
    }

    pause() {
        if (!this._hasTimeline()) return;

        this.flow_timeline.pause();
        this.is_play = false;
        //this.fix_timeline.pause();
    }

    seek(time_ms) {
        // if(!this._hasTimeline()) return;

        const seek_time = time_ms - this.mind;
        console.log("createFlow seek_time=", seek_time);
        // if(seek_time>=0){
        if (seek_time <= 0) {
            this.p.forEach((elm) => {
                elm.style.display = "block";
            });
            this.flow_timeline.pause();
            this.flow_timeline.reset();
            // this.flow_timeline.seek(0);
        }
        else {
            //TODO:
            if (this.flow_timeline == null) {
                this.createFlow();
            }
            this.flow_timeline.seek(seek_time);
        }
        this.is_play = false;
        //this.fix_timeline.seek(time_ms);
    }

    _hasTimeline() {
        if (this.flow_timeline == null) return false;
        //if(this.fix_timeline == null) return false;

        return true;
    }
};

class CommentTimeLines {
    constructor(interval_ms, get_time_func) {
        this.timelines = [];
        this.parent_id = parent_id;
        this.interval_ms = interval_ms;
        this.play_timer = null;
        this.get_time_func = get_time_func;
    }

    /**
     * 
     * @param {Array} commnets 
     */
    make_tl(parent_id, duration, step, row_num, commnets) {
        // const parent_id = "area";
        let parent_elm = document.getElementById(parent_id);
        const width = parent_elm.clientWidth;
        // const duration = 3000;
        // const step = 2;
        // const step = 200;

        console.log("commnets1=", performance.now());
        let cm_elm = new comment_elm(parent_id, width, duration);
        console.log("commnets2=", performance.now());

        let flow_params = [];
        commnets.forEach((cm) => {
            const no = cm.no;
            const text = cm.text;
            const delay = cm.vpos * 10;
            let tmp = cm_elm.createFlowParam(text, no, delay);
            flow_params.push(tmp);
        });

        console.log("commnets3=", performance.now());
        // const num = 12;
        let nico_comment = new NicoComment(row_num);
        nico_comment.width = width;
        nico_comment.comments = flow_params;
        console.log("commnets4=", performance.now());
        nico_comment.calc_comment();
        console.log("commnets5=", performance.now());

        let fragment = document.createDocumentFragment();
        let all_elms = [];
        let all_vpos = [];
        nico_comment.comments.forEach((cm, index) => {
            let elm = cm_elm.createElm2(commnets[index].text, cm.vpos);
            fragment.appendChild(elm);
            elm.setAttribute("data-rowindex", (cm.lane_index).toString());
            elm.style.display = "none";
            all_elms.push(elm);
            all_vpos.push(cm.vpos);
        });
        parent_elm.appendChild(fragment);

        let qcnt = Math.floor(commnets.length / step) + (commnets.length % step == 0 ? 0 : 1);
        const seqnums = Array.from(new Array(commnets.length)).map((v, i) => i);
        let div_seq = [];
        for (let index = 0; index < qcnt; index++) {
            div_seq.push(seqnums.splice(0, step));
        }

        this.timelines = [];
        div_seq.forEach((list, i) => {
            let vpos = [];
            let elms = [];
            list.forEach(index => {
                vpos.push(all_vpos[index]);
                let elm = all_elms[index];
                elm.classList.add(`flow${i}`);
                elms.push(elm);
            });

            let timeline = new CommentTimeLine(parent_id,
                { selector: `.flow${i}`, duration: duration },
                { selector: ".fix", duration: duration });
            timeline.elms = elms;
            timeline.mind = Math.min.apply(null, vpos);
            console.log("ctl.mind=", timeline.mind);

            this.timelines.push(timeline);
        });

        console.log("commnets6=", performance.now());
    };

    test() {
        this.timelines.forEach((tl) => {
            if (!tl.is_play && tl.mind <= this.get_time_func()) {
                console.log("test play=", tl.is_play, 
                    "ctl.mind=", tl.mind, "cu time=", getCurrentTime());
                tl.play();
            }
        });
        if (this.play_timer) {
            this.play_timer = setTimeout(() => {
                test();
            }, this.interval_ms);
        }
    }

    play() {
        if (this.play_timer == null) {
            this.play_timer = setTimeout(() => {
                test();
            }, this.interval_ms);
        }
    }

    pause() {
        clearTimeout(this.play_timer);
        this.timelines.forEach((tl) => {
            tl.pause();
        });
    }

    seek(time_ms) {
        this.timelines.forEach((tl) => {
            tl.seek(time_ms);
        });
    }
};