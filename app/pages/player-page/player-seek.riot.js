const { toTimeString } = require("../../js/time-format");
const { window_obs } = require("../../js/my-observable");

/** @type {MyObservable} */
const player_obs = window_obs;

module.exports = {
    state:{
        fmt_current:"",
        fmt_duration:""
    },
    buffered:0,
    duration:0,
    onBeforeMount() {
    },
    onMounted() {
        this.updateSeek(0);
        this.update();

        player_obs.on("player-seek:reload", (
            /** @type {number} */ duration) => {
            this.duration = duration;

            this.updateBuffered(0);
            this.updateSeek(0);

            this.update();
        });

        player_obs.on("player-seek:seek-update", (
            /** @type {number} */ current) => {
            this.updateSeek(current);
        });

        player_obs.on("player-seek:buffered-update", (
            /** @type {number} */ time_sec) => {
            this.updateBuffered(time_sec);
        });

        player_obs.on("player-seek:redraw", () => {
            this.updateBuffered(this.buffered);
            this.updateSeek(this.current);
        });
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    mousedown(e) {
        if(this.duration===0){
            return;
        }

        /** @type {HTMLElement} */
        const seek_container = this.$(".seek-container");
        const left = e.offsetX;
        const per = left / seek_container.clientWidth;
        const current = per * this.duration;

        this.updateSeek(current);

        player_obs.trigger("player-video:seek", current);
    },
    mouseOver(e) {
        const left = e.offsetX;

        const seek_container = this.$(".seek-container");
        const rect = seek_container.getBoundingClientRect();
        
        const per = left / seek_container.clientWidth;
        const current = per * this.duration;

        const tp = this.$(".seek-tooltip");
        const tp_text = this.$(".seek-tooltip > .text");
        tp_text.innerText = toTimeString(current);

        const tp_left = rect.left + left - tp.clientWidth / 2;
        tp.style.top = (rect.top - 30) + "px";
        tp.style.left = tp_left + "px";

        e.stopPropagation();
    },
    /**
     * 
     * @param {number} current 
     */
    updateSeek(current) {
        this.current = current;
        const per = this.current / this.duration;

        /** @type {HTMLElement} */
        const seek_container = this.$(".seek-container");
        /** @type {HTMLElement} */
        const seek_value = this.$(".seek-value");  
        seek_value.style.width = per * seek_container.clientWidth + "px";

        this.state.fmt_current = toTimeString(this.current);
        this.state.fmt_duration = toTimeString(this.duration);

        this.update();
    },
    /**
     * 
     * @param {number} time_sec 
     */
    updateBuffered(time_sec) {
        this.buffered = time_sec;
        const per = time_sec / this.duration;
        /** @type {HTMLElement} */
        const seek_container = this.$(".seek-container");
        /** @type {HTMLElement} */
        const buffered_value = this.$(".buffered-value");  
        buffered_value.style.width = per * seek_container.clientWidth + "px";

        this.update();
    }
};
