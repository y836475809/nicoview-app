<player-controls>
    <style scoped>
        :scope{
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
    </style>

    <div class="center-v play-btn">
        <button disabled={play_disabled} onclick={play}>
            <span class={button_class}></span>
        </button>
    </div>
    <div class="center-v seek">
        <player-seek obs={opts.obs}></player-seek>
    </div>
    <div class="center-v volume">
        <player-volume obs={opts.obs}></player-volume>
    </div>
    <div class="center-v toggle-info" title="動画情報の表示/非表示">
        <span class="fas fa-info" onclick={toggleInfoview}></span>
    </div>
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

        this.toggleInfoview = () => {
            obs.trigger("player-main-page:toggle-infoview");
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
                obs.trigger("player-seek:redraw");
            });
        });
    </script>
</player-controls>