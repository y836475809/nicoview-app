<player-seek>
    <style scoped>
        :scope {
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
    <div class="seek-timer current">{fmt_current}</div>
    <div class="seek-timer slash">/</div>
    <div class="seek-timer duration">{fmt_duration}</div>
    
    <script>
        /* globals */
        const time_format = window.TimeFormat;

        const obs = this.opts.obs; 

        this.mousedown = (e) => {
            if(this.duration===0){
                return;
            }

            const seek_container = this.root.querySelector(".seek-container");
            const left = e.layerX;
            const per = left / seek_container.clientWidth;
            const current = per * this.duration;

            updateSeek(current);

            obs.trigger("player-video:seek", current);
        };

        this.mouseOver = (e) => {
            const left = e.layerX;

            const seek_container = this.root.querySelector(".seek-container");
            const rect = seek_container.getBoundingClientRect();
            
            const per = left / seek_container.clientWidth;
            const current = per * this.duration;

            const tp = this.root.querySelector(".seek-tooltip");
            const tp_text = this.root.querySelector(".seek-tooltip > .text");
            tp_text.innerText = time_format.toTimeString(current);
  
            const tp_left = rect.left + left - tp.clientWidth / 2;
            tp.style.top = (rect.top - 30) + "px";
            tp.style.left = tp_left + "px";

            e.stopPropagation();
        };

        const updateSeek = (current)=>{
            this.current = current;
            const per = this.current / this.duration;

            const seek_container = this.root.querySelector(".seek-container");
            const seek_value = this.root.querySelector(".seek-value");  
            seek_value.style.width = per * seek_container.clientWidth + "px";

            this.fmt_current = time_format.toTimeString(this.current);
            this.fmt_duration = time_format.toTimeString(this.duration);

            this.update();
        };

        const updateBuffered = (time_sec)=>{
            this.buffered = time_sec;
            const per = time_sec / this.duration;
            const seek_container = this.root.querySelector(".seek-container");
            const buffered_value = this.root.querySelector(".buffered-value");  
            buffered_value.style.width = per * seek_container.clientWidth + "px";

            this.update();
        };

        this.on("mount", () => {
            this.buffered = 0;
            this.duration = 0;
            updateSeek(0);
            this.update();
        });

        obs.on("player-seek:reload", (duration) => {
            this.duration = duration;

            updateBuffered(0);
            updateSeek(0);

            this.update();
        });

        obs.on("player-seek:seek-update", (current) => {
            updateSeek(current);
        });

        obs.on("player-seek:buffered-update", (time_sec) => {
            updateBuffered(time_sec);
        });

        obs.on("player-seek:redraw", () => {
            updateBuffered(this.buffered);
            updateSeek(this.current);
        });
    </script>
</player-seek>