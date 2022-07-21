<player-seek>
    <style>
        :host {
            --seek-height: 50px;
            display:grid;
            grid-template-columns: 1fr 50px 10px 40px;
            grid-template-areas: "seek current slash duration";
            width: 100%;
            height: var(--seek-height);
            margin: 0;
            font-family: "Meiryo";
            user-select: none;
        } 

        .seek-container {
            grid-area: seek;
            position: relative;
            height: calc(var(--seek-height) - 20px);
            top: 50%;
            transform: translateY(-50%); 
            cursor: pointer;
        } 
        .seek-bar {
            position: relative;
            height: 10px;
            top: 50%;
            transform: translateY(-50%);
            background-color: lightgray;
        }
        .seek-value {
            margin-top: -10px;
            height: 100%;
            background-color: #797b80;
        }
        .buffered-value {
            height: 100%;
            width: 0;
            background-color: royalblue;
        }

        .seek-timer {
            text-align: center;
            line-height: var(--seek-height);
            font-size: 12px;
        }
        .current {
            grid-area: current;
            margin-left: 10px;
        }
        .slash {
            grid-area: slash;
        }  
        .duration {
            grid-area: duration;
        }

        .seek-tooltip {
            position:absolute;
            height: 30px;
            width: 50px;
            color: black;
            background-color: white;
            border: 1px solid darkgray;
            border-radius: 2px;
            display: none;
        }
        .seek-tooltip > .text {
            height: 100%;
        }
        .seek-container:hover + .seek-tooltip {
            display: block;
        }
    </style>

    <div class="seek-container" onmousedown={mousedown} onmousemove={mouseOver}>
        <div class="seek-bar">  
            <div class="buffered-value"></div>
            <div class="seek-value"></div>
        </div>
    </div>
    <div class="seek-tooltip"><div class="center-hv text"></div></div>
    <div class="seek-timer current">{state.fmt_current}</div>
    <div class="seek-timer slash">/</div>
    <div class="seek-timer duration">{state.fmt_duration}</div>
    
    <script>
        /* globals riot */
        const { toTimeString } = window.TimeFormat;
        const player_obs = riot.obs;

        export default {
            state:{
                fmt_current:"",
                fmt_duration:""
            },
            buffered:0,
            duration:0,
            onBeforeMount() {
            },
            onMounted() {
                this.updateSeek(0);
                this.update();

                player_obs.on("player-seek:reload", (duration) => {
                    this.duration = duration;

                    this.updateBuffered(0);
                    this.updateSeek(0);

                    this.update();
                });

                player_obs.on("player-seek:seek-update", (current) => {
                    this.updateSeek(current);
                });

                player_obs.on("player-seek:buffered-update", (time_sec) => {
                    this.updateBuffered(time_sec);
                });

                player_obs.on("player-seek:redraw", () => {
                    this.updateBuffered(this.buffered);
                    this.updateSeek(this.current);
                });
            },
            mousedown(e) {
                if(this.duration===0){
                    return;
                }

                const seek_container = this.$(".seek-container");
                const left = e.layerX;
                const per = left / seek_container.clientWidth;
                const current = per * this.duration;

                this.updateSeek(current);

                player_obs.trigger("player-video:seek", current);
            },
            mouseOver(e) {
                const left = e.layerX;

                const seek_container = this.$(".seek-container");
                const rect = seek_container.getBoundingClientRect();
                
                const per = left / seek_container.clientWidth;
                const current = per * this.duration;

                const tp = this.$(".seek-tooltip");
                const tp_text = this.$(".seek-tooltip > .text");
                tp_text.innerText = toTimeString(current);
    
                const tp_left = rect.left + left - tp.clientWidth / 2;
                tp.style.top = (rect.top - 30) + "px";
                tp.style.left = tp_left + "px";

                e.stopPropagation();
            },
            updateSeek(current) {
                this.current = current;
                const per = this.current / this.duration;

                const seek_container = this.$(".seek-container");
                const seek_value = this.$(".seek-value");  
                seek_value.style.width = per * seek_container.clientWidth + "px";

                this.state.fmt_current = toTimeString(this.current);
                this.state.fmt_duration = toTimeString(this.duration);

                this.update();
            },
            updateBuffered(time_sec) {
                this.buffered = time_sec;
                const per = time_sec / this.duration;
                const seek_container = this.$(".seek-container");
                const buffered_value = this.$(".buffered-value");  
                buffered_value.style.width = per * seek_container.clientWidth + "px";

                this.update();
            }
        };
    </script>
</player-seek>