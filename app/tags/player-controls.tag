<player-controls>
    <style scoped>
        :scope{
            display:grid;
            grid-template-columns: 50px 1fr 100px;
            --margin-value: 2px;
            --control-margin-value: 4px;
            margin : var(--margin-value);
            width: calc(100% - var(--margin-value) * 2);
            height: calc(100% - var(--margin-value) * 2);
            background-color: var(--control-color);
            border: 1px solid var(--control-border-color);
        }
        .play-btn{
            grid-column: 1 / 2;
            margin-top: var(--control-margin-value);
        }
        .play-btn > button{
            position: relative;
            left: 4px;
            width: 30px;
            height: 30px;
        }
        .play-btn > button > span{
            color: gray;           
        }
        .seek{
            grid-column: 2 / 3;
            margin-top: var(--control-margin-value);
        }
        .volume{
            grid-column: 3 / 4;
            margin-top: var(--control-margin-value);
        }    
    </style>

    <div class="play-btn">
        <button disabled={this.play_disabled} class="center-hv" onclick={play}>
            <span class={this.button_class}></span></button>
    </div>
    <player-seek obs={opts.obs} ref="seek" class="seek"></player-seek>
    <player-volume obs={opts.obs} class="volume"></player-volume>

    <script>
        const obs = this.opts.obs; 

        const button_class_map = new Map([
            ["play", "fas fa-play"],
            ["pause", "fas fa-pause"],
            ["stop", "fas fa-stop"]
        ]);

        const state_button_map = new Map([
            ["play", "pause"],
            ["pause", "play"],
            ["stop", "play"]
        ]);

        this.current_state = "stop";
        this.button_class = button_class_map.get(state_button_map.get("stop"));
        this.play_disabled = true;

        const updateState = (state) => {
            this.current_state = state;
            this.button_class = button_class_map.get(state_button_map.get(state));
            this.update();
        };

        const getPlayEnable = () => {
            return !this.play_disabled;
        };

        const setPlayEnable = (value) => {
            this.play_disabled = !value;
            this.update();
        };

        const isPlay = () => {
            return this.current_state == "play";
        };
        const isPause = () => {
            return this.current_state == "pause";
        };
        const isStop = () => {
            return this.current_state == "stop";
        };

        this.play = () => {
            if(!getPlayEnable()){
                return;
            }

            if(isStop()){
                updateState("play");
            }else if(isPlay()){
                obs.trigger("player-video:pause");
                updateState("pause");
            }else{
                obs.trigger("player-video:play");
                updateState("play");
            }
        };

        obs.on("player-controls:play", ()=> {
            this.play();
        });

        obs.on("player-controls:loaded-data", ()=> {
            setPlayEnable(true);
        });
        
        obs.on("player-controls:set-state", (state)=> {
            updateState(state);
        });

        this.on("mount", ()=> {
            updateState("play");
            setPlayEnable(false);

            obs.on("window-resized", () => { 
                this.refs.seek.redraw();
            });
        });
    </script>
</player-controls>