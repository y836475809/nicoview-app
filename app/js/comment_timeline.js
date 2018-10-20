// @ts-check

const anime = require("animejs");

class TimeLine {
    /**
     * @param {string} parent_selector
     * @param {{selector: string, duration: number, row_num: number}} params
     */
    constructor(parent_selector, params) {
        this.parent_selector = parent_selector;
        this.params = params;
        this.timeline = null;
        this.is_play = false;
        this.is_cpmpleted = false;
        this.start_time = 0;
        this.last_time = 0;
    }

    create() {
    }

    elmsforEach(func){
        const parent = document.getElementById(this.parent_selector);
        let elms = parent.querySelectorAll(this.params.selector);
        elms.forEach((elm, index) => {
            func(elm, index);
        });
    }

    getRowHeight(view_height){
        return view_height/this.params.row_num;
    }

    delete() {
        //TODO
        let area = document.getElementById(this.parent_selector);
        this.elmsforEach((elm)=>{
            area.removeChild(elm);
        });

        if (this.timeline == null) {
            return;
        }

        anime.remove(this.params.selector);

        this.timeline = null;
    }

    reset() {
        this.create();
    }

    play() {
        if (this.timeline == null) {
            console.log("create1=", performance.now());
            this.elmsforEach((elm)=>{
                elm.style.display = "block";
            });
            this.create();
            console.log("create2=", performance.now());
        }
        else{
            if(!this.is_cpmpleted){
                this.elmsforEach((elm)=>{
                    elm.style.display = "block";
                });
            }
        }
        this.timeline.play();
        this.is_play = true;
    }

    pause() {
        if (!this._hasTimeline()) return;

        this.timeline.pause();
        this.is_play = false;
    }

    seek(time_ms) {
        const seek_time = time_ms - this.start_time;

        if (this.start_time <= time_ms && time_ms < this.last_time) {
            console.log("createFlow seek_time1=", this.params.selector);
            if (this.timeline == null) {
                this.create();
            } else {
                this.elmsforEach((elm)=>{
                    elm.style.display = "block";
                });
            }
            this.timeline.reset();
            this.timeline.seek(seek_time);

            this.is_cpmpleted = false;
        } else if(time_ms < this.start_time){
            console.log("createFlow seek_time2=", this.params.selector);
            if (this.timeline != null) {
                this.timeline.reset();
                this.timeline.seek(seek_time);
            }
            this.is_cpmpleted = false;
        }else if(this.last_time <= time_ms){
            console.log("createFlow seek_time3=", this.params.selector);
            if(this.timeline!=null){
                this.timeline.seek(seek_time);
            }
            this.is_cpmpleted = true;
        }
        this.is_play = false;
    }

    _hasTimeline() {
        if (this.timeline == null) return false;

        return true;
    }
}

class FlowCommentTimeLine extends TimeLine {
    constructor(parent_selector, params) {
        super(parent_selector, params);
    }

    create() {
        console.log("create=", this.params.selector);
        const selector = this.params.selector;
        const duration = this.params.duration;

        if (this.timeline != null) {
            this.timeline.pause();
            this.timeline.reset();
            anime.remove(selector);
        }

        const area = document.getElementById(this.parent_selector);
        const area_width = area.clientWidth;
        const row_h = this.getRowHeight(area.clientHeight);
        this.elmsforEach((elm)=>{
            elm.style.opacity = 0;
            elm.style.left = area_width + "px";
            const rowindex = parseInt(elm.getAttribute("data-rowindex"));
            elm.style.top = (rowindex * row_h) + "px";
        });

        this.timeline = anime.timeline({
            begin :()=>{
                this.is_cpmpleted = false;
                console.log("timeline begin", selector);
            },
            targets: selector,
            easing: "linear",
            loop: false,
            autoplay: false
        });

        this.timeline
            .add({
                delay: (el) => {
                    return el.getAttribute("data-delay") - this.start_time;
                },
                opacity: [0, 1],
                duration: 1,
            })
            .add({
                delay: (el) => {
                    return el.getAttribute("data-delay") - this.start_time;
                },
                translateX: (el) => {
                    return -(area_width + parseInt(el.getAttribute("data-width")));
                },
                duration: duration,
                offset: 1,
                complete: (anim) => {
                    console.log("complete=", selector);
                    anim.animatables.forEach((obj) => {
                        obj.target.style.display = "none";
                    });
                    this.is_cpmpleted = true;
                }
            });
    }
}

class FixedCommentTimeLine extends TimeLine {
    constructor(parent_selector, params) {
        super(parent_selector, params);
    }

    create() {
        const selector = this.params.selector;
        const duration = this.params.duration;
        const row_num = this.params.row_num;

        if (this.timeline != null) {
            this.timeline.pause();
            this.timeline.reset();
            anime.remove(selector);
        }

        const area = document.getElementById(this.parent_selector);
        const area_width = area.clientWidth;
        const row_h = this.getRowHeight(area.clientHeight);
        this.elmsforEach((elm) => {
            elm.style.opacity = 0;
            elm.style.left = (area_width / 2 - parseInt(elm.getAttribute("data-width")) / 2) + "px";
            const rowindex = parseInt(elm.getAttribute("data-rowindex"));
            const data_type = elm.getAttribute("data-type");
            if(data_type=="ue"){
                elm.style.top = (rowindex * row_h) + "px";
            }else if(data_type=="shita"){
                elm.style.top = ((row_num - rowindex - 1) * row_h) + "px";
            }
        });

        anime.easings["fixedCommentEasing"] = function(t) {
            if(t>0.0 && t<1.0){
                return 1;
            }
            return 0;
        };
        this.timeline = anime({
            begin :()=>{
                this.is_cpmpleted = false;
            },
            targets: selector,
            delay: (el) => {
                return parseFloat(el.getAttribute("data-delay")) - this.start_time;
            },
            complete: (anim) => {
                console.log("complete=", selector);
                anim.animatables.forEach((obj) => {
                    obj.target.style.display = "none";
                });
                this.is_cpmpleted = true;
            },
            easing: "fixedCommentEasing",
            opacity: [1],
            duration:duration,
            loop: false,
            autoplay: false
        });
    }
}

module.exports = {
    FlowCommentTimeLine: FlowCommentTimeLine,
    FixedCommentTimeLine: FixedCommentTimeLine
};