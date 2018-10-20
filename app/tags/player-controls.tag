<player-controls>
    <style scoped>
        :scope{
            display:grid;
            width: 100%;
            height: 80px;
            grid-template-columns: 50px 1fr 10px;
            background-color: #cccccc;
            padding: 5px;
        }
        .play{
            grid-column: 1 / 2;
            width: 30px;
			height: 30px;
            border: 1px solid #a8a8a8;
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
    </style>

    <div class="play" onclick={play}></div>
    <player-seek ref="seek" class="seek"></player-seek>

    <script>
        /* globals riot obs */
        require("./player-seek.tag");
        riot.mount("player-seek");

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

        this.on("mount", ()=> {
            setBtnState("stop");

            obs.on("resizeEndEvent", (video_size) => { 
                this.refs.seek.redraw();
            });
        });

    </script>
</player-controls>