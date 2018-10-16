
class TimeLine {
    /**
     * @param {string} parent_selector
     * @param {{selector: string, duration: number}} params
     */
    constructor(parent_selector, params) {
        this.parent_selector = parent_selector;
        this.params = params;
        this.timeline = null;
        this.is_play = false;
        this.is_cpmpleted = false;
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
        this.elmsforEach((elm)=>{
            elm.style.display = "none";
        });
        this.create();
    }

    play() {
        // if(!this._hasTimeline()) return;
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
        //this.fix_timeline.play();
    }

    pause() {
        if (!this._hasTimeline()) return;

        this.timeline.pause();
        this.is_play = false;
        //this.fix_timeline.pause();
    }

    seek(time_ms) {
        // if(!this._hasTimeline()) return;

        const seek_time = time_ms - this.mind;
        
        // if(seek_time>=0){
        if (this.mind <= time_ms && time_ms < this.last_time) {
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
        } else if(this.mind > time_ms){
            console.log("createFlow seek_time2=", this.params.selector);
            if (this.timeline != null) {
                this.timeline.reset();
                this.timeline.seek(seek_time);
            }
            this.is_cpmpleted = false;
        }else{
            console.log("createFlow seek_time3=", this.params.selector);
            this.is_cpmpleted = true;
        }
        this.is_play = false;
        //this.fix_timeline.seek(time_ms);
    }

    _hasTimeline() {
        if (this.timeline == null) return false;
        //if(this.fix_timeline == null) return false;

        return true;
    }
};

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
        this.elmsforEach((elm)=>{
            elm.style.opacity = 0;
            elm.style.left = area_width + "px";
            const rowindex = parseInt(elm.getAttribute('data-rowindex'));
            elm.style.top = (rowindex * 30) + "px"; 
        });

        this.timeline = anime.timeline({
            begin :()=>{
                this.is_cpmpleted = false;
                console.log("timeline begin", selector);
            },
            targets: selector,
            easing: 'linear',
            loop: false,
            autoplay: false
        });

        this.timeline
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
                    return -(area_width + parseInt(el.getAttribute('data-width')));
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
            })
    }
};

class FixedCommentTimeLine extends TimeLine {
    constructor(parent_selector, params) {
        super(parent_selector, params);
    }

    createFix() {
        const selector = this.params.selector;
        const duration = this.params.duration;

        this.elms.forEach((elm) => {
            elm.style.display = "block";
        });

        if (this.timeline != null) {
            this.timeline.pause();
            this.timeline.reset();
            anime.remove(selector);
        }

        const area = document.getElementById(this.parent_selector);
        const area_width = area.clientWidth;

        this.elms.forEach((elm) => {
            elm.style.opacity = 0;
            elm.style.left = area_width + "px";
            const rowindex = parseInt(elm.getAttribute('data-rowindex'));
            elm.style.top = (rowindex * 30) + "px";
        });

        this.timeline = anime.timeline({
            targets: selector,
            delay: (el, i) => {
                return el.getAttribute('data-delay');
            },
            loop: false,
            autoplay: false
        });

        this.timeline
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
};

module.exports = {
    FlowCommentTimeLine: FlowCommentTimeLine,
    FixedCommentTimeLine: FixedCommentTimeLine
};