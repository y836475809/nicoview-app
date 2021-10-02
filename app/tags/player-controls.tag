<player-controls>
    <style>
        :host{
            display:grid;
            grid-template-columns: 50px 1fr 100px 50px;
            grid-template-areas: "area1 area2 area3 area4";
            width: 100%;
            height: 100%;
            padding: 2px;
        }
        .play-btn{
            grid-area: area1;
        }
        .play-btn > button{
            margin-left: 5px;
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .play-btn > button > span{
            color: gray;           
        }
        .seek{
            grid-area: area2;
        }
        .volume{
            grid-area: area3;
            margin-left: 10px;
            margin-right: 5px;
        }   
        .toggle-info{
            grid-area: area4;
            margin-left: auto;
            margin-right: 10px;
        } 
        .toggle-info > span {
            font-size: 18px;
            color: gray;
            cursor: pointer;
        }
        .toggle-info > span:hover {
            color: black;
        }
        
        player-seek > .slider, 
        player-volume > .slider {
            cursor: pointer;
        }

        .move-start {
            font-size: 12px;
            color: gray;
            cursor: pointer;
            margin-right: 10px;
        }
        .move-start:hover {
            color: black;
        }
    </style>

    <div class="center-v play-btn">
        <button disabled={state.play_disabled} onclick={play}>
            <span class={state.button_class}></span>
        </button>
    </div>
    <div class="center-v seek">
        <div class="move-start" title="最初に移動" onclick={moveStart}>
            <i class="fas fa-circle"></i>
        </div>
        <player-seek obs={obs}></player-seek>
    </div>
    <div class="center-v volume">
        <player-volume obs={obs}></player-volume>
    </div>
    <div class="center-v toggle-info" title="動画情報の表示/非表示">
        <span class="fas fa-info" onclick={toggleInfoview}></span>
    </div>
    <script>
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

        export default {
            state:{
                play_disabled:true,
                button_class:""
            },
            current_state:"stop",
            onBeforeMount(props) {
                this.obs = props.obs; 
                
                this.state.button_class = button_class_map.get(state_button_map.get("stop"));

                this.obs.on("player-controls:play", ()=> {
                    this.play();
                });

                this.obs.on("player-controls:loaded-data", ()=> {
                    this.setPlayEnable(true);
                });
                
                this.obs.on("player-controls:set-state", (state)=> {
                    this.updateState(state);
                });
            },
            onMounted() {
                this.updateState("play");
                this.setPlayEnable(false);

                this.obs.on("window-resized", () => { 
                    this.obs.trigger("player-seek:redraw");
                });
            },
            updateState(state) {
                this.current_state = state;
                this.state.button_class = button_class_map.get(state_button_map.get(state));
                this.update();
            },
            getPlayEnable() {
                return !this.play_disabled;
            },
            setPlayEnable(value) {
                this.play_disabled = !value;
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
                    this.obs.trigger("player-video:pause");
                    this.updateState("pause");
                }else{
                    this.obs.trigger("player-video:play");
                    this.updateState("play");
                }
            },
            toggleInfoview() {
                this.obs.trigger("player-main-page:toggle-infoview");
            },
            moveStart() {
                this.obs.trigger("player-info-page:reset-comment-scroll");
                this.obs.trigger("player-video:seek", 0);
            }
        };
    </script>
</player-controls>