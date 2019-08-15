
const MSG =  Object.freeze({   
    MAIN_PLAY: "main-page:play-by-videoid",
    PLAYER_PLAY: "player-main-page:play-by-videoid"
});

class obsTrigger {
    constructor(obs){
        this.obs = obs;
    }

    get Msg(){
        return MSG;
    }   

    play(msg, video_id, time=0){
        const args = {
            video_id,
            time
        };
        this.obs.trigger(`${msg}`, args);
    }

    playOnline(msg, video_id, time=0){
        const args = {
            video_id,
            time
        };
        this.obs.trigger(`${msg}-online`, args);
    }
}

module.exports = {
    obsTrigger
};