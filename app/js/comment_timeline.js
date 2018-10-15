
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
        this.elms = [];
    }

    create() {
    }

    delete() {
        //TODO
        let area = document.getElementById(this.parent_selector);
        this.elms.forEach((elm) => {
            area.removeChild(elm);
        });
        this.elms = [];

        if (this.timeline == null) {
            return;
        }

        anime.remove(this.params.selector);

        this.timeline = null;
    }

    reset() {
        this.elms.forEach((elm) => {
            elm.style.display = "none";
        });
        anime.remove(this.params.selector);
        this.timeline = null;
    }

    play() {
        // if(!this._hasTimeline()) return;
        if (this.timeline == null) {
            console.log("create1=", performance.now());
            this.create();
            console.log("create2=", performance.now());
        }
        else{
            // this.elms.forEach((elm) => {
            //     elm.style.display = "block";
            //     elm.style.opacity = 0;
            // });
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
        console.log("createFlow seek_time=", seek_time);
        // if(seek_time>=0){
        if (this.mind <= time_ms && time_ms < this.last_time) {
            if (this.timeline == null) {
                //this.create();
            } else {
                // this.elms.forEach((elm) => {
                //     elm.style.display = "block";
                // });
            }
            this.create();
            this.timeline.seek(seek_time);
        } else if(this.mind > time_ms){
            console.log("createFlow seek delete = ", this.params.selector);
            this.reset();
            // anime.remove(this.params.selector);
            //this.timeline = null;
            //TODO:
            // this.timeline = null;
            // this.mind2 = this.mind + time_ms;
            // this.timeline.seek(seek_time);
            // if (this.timeline != null) {
            //     this.timeline.seek(seek_time);
            // }
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

class FlowCommnetTimeLine extends TimeLine {
    constructor(parent_selector, params) {
        super(parent_selector, params);
    }

    create() {
        console.log("create=", this.params.selector);
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
            console.log("create elms elm.style.left=", elm.style.left);
            const rowindex = parseInt(elm.getAttribute('data-rowindex'));
            elm.style.top = (rowindex * 30) + "px";
        });

        this.timeline = anime.timeline({
            targets: selector,
            easing: 'linear',
            loop: false,
            autoplay: false
        });

        this.timeline
            .add({
                delay: (el, i) => {
                    return el.getAttribute('data-delay') - this.mind2;
                },
                opacity: [0, 1],
                duration: 1,
            })
            .add({
                delay: (el, i) => {
                    return el.getAttribute('data-delay') - this.mind2;
                },
                translateX: (el, i) => {
                    return -(area_width + el.getBoundingClientRect().width);
                },
                duration: duration,
                offset: 1,
                complete: () => {
                    console.log("complete=", selector);
                    this.elms.forEach((elm) => {
                        elm.style.display = "none";
                    });
                }
            })
    }
};

class FixedCommnetTimeLine extends TimeLine {
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
    FlowCommnetTimeLine: FlowCommnetTimeLine,
    FixedCommnetTimeLine: FixedCommnetTimeLine
};