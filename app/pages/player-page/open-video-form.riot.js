const { Command } = require("../../js/command");
const NICO_URL = require("../../js/nico-url");

/**
 * 
 * @param {string} value video id or url
 * @returns {boolean} true:nico url
 */
const isURL = (value) => {
    return value.startsWith(`${NICO_URL.VIDEO}/watch/`);
};
/**
 * 
 * @param {string} value video id or url
 * @returns {string} video id
 */
const getVideoID = (value) => {
    if(isURL(value)){
        return value.split("/").pop();
    }else{
        return value;
    }
};

module.exports = {
    /**
     * 
     * @param {boolean} visible 
     */
    formVisible(visible){
        /** @type {HTMLElement} */
        const elm = this.$(".open-form");
        elm.style.display = visible===true?"":"none";
    },
    /**
     * 
     * @returns {void}
     */
    playByVideoID(){
        /** @type {HTMLInputElement} */
        const elm = this.$(".open-form input");
        const video_id = getVideoID(elm.value);
        if(!video_id) {
            return;
        }
        const online = false; // ローカル再生を優先
        Command.play({
            video_id: video_id,
            time: 0
        }, online);
    },
    onBeforeMount(props) {
        /** @type {MyObservable} */
        const obs = props.obs;
        obs.on("show", () => {
            this.formVisible(true);
            /** @type {HTMLInputElement} */
            const elm = this.$(".open-form input");
            elm.value = "";
            elm.focus();
        });
    },
    onMounted() {
        this.formVisible(false);
    },
    /**
     * 
     * @param {Event} e 
     */
    stopProp(e) {
        e.stopPropagation();
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    onkeydownPlay(e) {
        if(e.code == "Enter"){
            this.playByVideoID();
        }
    },
    /**
     * 
     * @param {Event} e 
     */
    onclickPlay(e) { // eslint-disable-line no-unused-vars
        this.playByVideoID();
    },
    /**
     * 
     * @param {Event} e 
     */
    onclickClose(e) { // eslint-disable-line no-unused-vars
        this.formVisible(false);
    }
};
