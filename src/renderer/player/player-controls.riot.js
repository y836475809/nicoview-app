const { window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */
const player_obs = window_obs;

const  button_class_map = new Map([
    ["play", "fas fa-play"],
    ["pause", "fas fa-pause"],
    ["stop", "fas fa-stop"]
]);

const state_button_map = new Map([
    ["play", "pause"],
    ["pause", "play"],
    ["stop", "play"]
]);

module.exports = {
    state:{
        play_disabled:true,
        button_class:""
    },
    current_state:"stop",
    onBeforeMount() {
        this.state.button_class = button_class_map.get(state_button_map.get("stop"));

        player_obs.on("player-controls:play", ()=> {
            this.play();
        });

        player_obs.on("player-controls:loaded-data", ()=> {
            this.setPlayEnable(true);
        });
        
        player_obs.on("player-controls:set-state", (/** @type {string} */ state)=> {
            this.updateState(state);
        });
    },
    onMounted() {
        this.updateState("play");
        this.setPlayEnable(false);

        player_obs.on("window-resized", () => { 
            player_obs.trigger("player-seek:redraw");
        });
    },
    /**
     * 
     * @param {string} state 
     */
    updateState(state) {
        this.current_state = state;
        this.state.button_class = button_class_map.get(state_button_map.get(state));
        this.update();
    },
    getPlayEnable() {
        return !this.play_disabled;
    },
    /**
     * 
     * @param {boolean} value 
     */
    setPlayEnable(value) {
        this.state.play_disabled = !value;
        this.update();
    },
    isPlay() {
        return this.current_state == "play";
    },
    isPause() {
        return this.current_state == "pause";
    },
    isStop() {
        return this.current_state == "stop";
    },
    play() {
        if(!this.getPlayEnable()){
            return;
        }

        if(this.isStop()){
            this.updateState("play");
        }else if(this.isPlay()){
            player_obs.trigger("player-video:pause");
            this.updateState("pause");
        }else{
            player_obs.trigger("player-video:play");
            this.updateState("play");
        }
    },
    toggleInfoview() {
        player_obs.trigger("player-main:toggle-infoview");
    },
    moveStart() {
        player_obs.trigger("player-info:reset-comment-scroll");
        player_obs.trigger("player-video:seek", 0);
    }
};