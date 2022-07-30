const { Command } = require("../../js/command");
const NICO_URL = require("../../js/nico-url");

/**
 * 
 * @param {RiotComponent} tag 
 * @param {boolean} visible 
 */
const formVisible = (tag, visible) => {
    /** @type {HTMLElement} */
    const elm = tag.$(".open-form");
    elm.style.display = visible===true?"":"none";
};
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

/**
 * 
 * @param {RiotComponent} tag 
 * @returns {void}
 */
const playByVideoID = (tag) => {
    /** @type {HTMLInputElement} */
    const elm = tag.$(".open-form input");
    const video_id = getVideoID(elm.value);
    if(!video_id) {
        return;
    }
    const online = false; // ローカル再生を優先
    Command.play({
        id: video_id,
        time: 0
    }, online);
};

module.exports = {
    onBeforeMount(props) {
        /** @type {MyObservable} */
        const obs = props.obs;
        obs.on("show", () => {
            formVisible(this, true);
            /** @type {HTMLInputElement} */
            const elm = this.$(".open-form input");
            elm.value = "";
            elm.focus();
        });
    },
    onMounted() {
        formVisible(this, false);
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
            playByVideoID(this,);
        }
    },
    /**
     * 
     * @param {Event} e 
     */
    onclickPlay(e) { // eslint-disable-line no-unused-vars
        playByVideoID(this);
    },
    /**
     * 
     * @param {Event} e 
     */
    onclickClose(e) { // eslint-disable-line no-unused-vars
        formVisible(this, false);
    }
};
