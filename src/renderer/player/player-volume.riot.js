const myapi = require("../../lib/my-api");
const { window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */
const player_obs = window_obs;

module.exports = {
    onBeforeMount() {
    },
    async onMounted() {
        /** @type {HTMLElement} */
        let picker = this.$("div.picker");
        /** @type {HTMLElement} */
        let slider = this.$("div.slider");
        /** @type {number} */
        const volume = await myapi.ipc.Config.get("player.volume", 0.5);
        picker.style.left = volume * slider.clientWidth - 5 + "px";

    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    picker_mousedown(e) {
        /** @type {HTMLElement} */
        let picker = this.$("div.picker");
        const x = e.offsetX;
        const left = parseInt(picker.style.left) + x;
        this.updateVolume(left);

        e.stopPropagation();
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    slider_mousedown(e) {
        const left = e.offsetX;
        this.updateVolume(left);
    },
    /**
     * 
     * @param {number} pos 
     */
    updateVolume(pos) {
        /** @type {HTMLElement} */
        let picker = this.$("div.picker");
        picker.style.left = (pos - 5) + "px";

        /** @type {HTMLElement} */
        let slider = this.$("div.slider");
        const volume = pos / slider.clientWidth;

        // TODO check
        myapi.ipc.Config.set("player.volume", volume).then();

        player_obs.trigger("player-video:volume-changed", volume); 
    }
};