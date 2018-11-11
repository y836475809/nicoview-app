<player-controls>
    <style scoped>
        :scope{
            display:grid;
            grid-template-columns: 50px 1fr 100px;
            --margin-value: 5px;
            margin : var(--margin-value);
            width: calc(100% - var(--margin-value) * 2);
            height: calc(100% - var(--margin-value) * 2);
            background-color: var(--control-color);
        }
        .play{
            grid-column: 1 / 2;
            width: 30px;
			height: 30px;
            border: 1px solid var(--control-border-color);
            background-image: url(../images/play.png);
            background-size: contain;
        }
        .play:hover{
            opacity: 0.5;
        }
        .play:active{
            position: relative;
            top: 2px;
        }
        .play[data-state="pause"] {
            background-image: url(../images/pause.png);
        }
        .seek{
            grid-column: 2 / 3;
        }
        .volume{
            grid-column: 3 / 4;
        }    
    </style>

    <div class="play" onclick={play}></div>
    <player-seek ref="seek" class="seek"></player-seek>
    <player-volume class="volume"></player-volume>

    <script>
        /* globals riot obs */
        require("./player-seek.tag");
        require("./player-volume.tag");
        riot.mount("player-seek");
        riot.mount("player-volume");

        let setBtnState = (state)=>{
            let btn = this.root.querySelector("div.play");
            btn.setAttribute("data-state", state);
        };
        
        let getBtnState = ()=>{
            let btn = this.root.querySelector("div.play");
            return btn.getAttribute("data-state");
        };

        let isPause = ()=>{
            return getBtnState()=="pause";
        };

        this.play = () => {
            if(getBtnState()=="stop"){
                obs.trigger("loadplaydata");
                setBtnState("pause");
            }else if(getBtnState()=="play"){
                obs.trigger("play");
                setBtnState("pause");               
            }else{
                obs.trigger("pause");
                setBtnState("play");
            }
        };
        
        obs.on("on_set_player_state", (state)=> {
            if(state=="play"){
                setBtnState("pause");
                return;
            }
            if(state=="pause"){
                setBtnState("play");
                return;
            }
        });

        this.on("mount", ()=> {
            setBtnState("pause");

            obs.on("resizeEndEvent", (video_size) => { 
                this.refs.seek.redraw();
            });
        });

    </script>
</player-controls>