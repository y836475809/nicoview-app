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
            <span class={this.current_state}></span></button>
    </div>
    <player-seek ref="seek" class="seek"></player-seek>
    <player-volume class="volume"></player-volume>

    <script>
        /* globals app_base_dir riot obs */
        require(`${app_base_dir}/tags/player-seek.tag`);
        require(`${app_base_dir}/tags/player-volume.tag`);
        riot.mount("player-seek");
        riot.mount("player-volume");

        const stateMap = new Map([
            ["play", "fas fa-play"],
            ["pause", "fas fa-pause"],
            ["stop", "fas fa-stop"]
        ]);

        this.current_state = stateMap.get("stop");
        this.play_disabled = true;

        const updateButton = (state) => {
            this.current_state = stateMap.get(state);
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
            return this.current_state == stateMap.get("play");
        };
        const isPause = () => {
            return this.current_state == stateMap.get("pause");
        };
        const isStop = () => {
            return this.current_state == stateMap.get("stop");
        };

        this.play = () => {
            if(!getPlayEnable()){
                return;
            }

            if(isStop()){
                obs.trigger("loadplaydata");
                updateButton("play");
            }else if(isPlay()){
                obs.trigger("pause");
                updateButton("pause");
            }else{
                obs.trigger("play");
                updateButton("play");
            }
        };

        obs.on("loaded_data", ()=> {
            setPlayEnable(true);
        });
        
        obs.on("on_set_player_state", (state)=> {
            updateButton(state);
        });

        this.on("mount", ()=> {
            updateButton("play");
            setPlayEnable(false);

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