<player-controls>
    <style scoped>
        :scope{
            display:grid;
            grid-template-columns: 50px 1fr 100px;
            --margin-value: 2px;
            margin : var(--margin-value);
            width: calc(100% - var(--margin-value) * 2);
            height: calc(100% - var(--margin-value) * 2);
            background-color: var(--control-color);
            border: 1px solid var(--control-border-color);
        }
        .play-btn{
            grid-column: 1 / 2;
        }
        .play-btn > button{
            position: relative;
            left: 4px;
            width: 30px;
            height: 30px;
        }
        .play-btn > button > span{
            position: absolute;
            top: -4px;
            left: -4px;
            color: gray;           
        }
        .seek{
            grid-column: 2 / 3;
        }
        .volume{
            grid-column: 3 / 4;
        }    
    </style>

    <div class="play-btn">
        <button onclick={play}><span class="icono-play"></span></button>
    </div>
    <player-seek ref="seek" class="seek"></player-seek>
    <player-volume class="volume"></player-volume>

    <script>
        /* globals riot obs */
        require("./player-seek.tag");
        require("./player-volume.tag");
        riot.mount("player-seek");
        riot.mount("player-volume");

        const STATE_PLAY = "play";
        const STATE_PAUSE = "pause";
        const STATE_STOP = "stop";

        let current_state = STATE_STOP;
        let enable = false;

        const isPlay = () => {
            return current_state == STATE_PLAY;
        };
        const isPause = () => {
            return current_state == STATE_PAUSE;
        };
        const isStop = () => {
            return current_state == STATE_STOP;
        };

        const setPlayBtnClass = () => {
            let elm = this.root.querySelector(".play-btn > button > span");
            elm.classList.remove("icono-play", "icono-pause");

            if(isStop()){
                elm.classList.add("icono-play");
                return;
            }
            if(isPlay()){
                elm.classList.add("icono-pause");
                return;        
            }
            if(isPause()){
                elm.classList.add("icono-play");
                return;
            } 

            throw new Error(`state: ${current_state}`);                    
        };

        const setPlayBtnEnable = (enable) => {
            let elm = this.root.querySelector(".play-btn > button");
            elm.disabled = enable ? 0 : 1;
        };

        this.play = () => {
            if(!enable){
                return;
            }

            if(isStop()){
                obs.trigger("loadplaydata");
                current_state = STATE_PLAY;
            }else if(isPlay()){
                obs.trigger("pause");
                current_state = STATE_PAUSE;
            }else{
                obs.trigger("play");
                current_state = STATE_PLAY;
            }
            setPlayBtnClass();
        };

        obs.on("loaded_data", ()=> {
            enable = true;
            setPlayBtnEnable(true);
        });
        
        obs.on("on_set_player_state", (state)=> {
            current_state = state;
            setPlayBtnClass();
            // setPlayBtnEnable(true);
        });

        this.on("mount", ()=> {
            enable = false;
            current_state = STATE_PAUSE;
            setPlayBtnClass();
            setPlayBtnEnable(false);

            obs.on("resizeEndEvent", (video_size) => { 
                this.refs.seek.redraw();
            });
        });

        window.addEventListener("keyup", (e) => {
            if(e.key==" "){
                this.play();
            }
        }, true);   
    </script>
</player-controls>