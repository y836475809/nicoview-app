<player-seek>
    <style scoped>
        :scope {
            --seek-height: 50px;
            display:grid;
            grid-template-columns: 1fr 50px 10px 40px;
            grid-template-areas: "slider current slash duration";
            width: 100%;
            height: var(--seek-height);
            margin: 0;
            font-family: "Meiryo";
            user-select: none;
        } 

        .slider-container {
            grid-area: slider;
            position: relative;
            height: calc(var(--seek-height) - 20px);
            top: 50%;
            transform: translateY(-50%); 
            cursor: pointer;
        } 
        .slider {
            background-color: #797b80;
            position: relative;
            height: 10px;
            top: 50%;
            transform: translateY(-50%);
            border-radius:5px;
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

        .picker {
            position: relative;
			top: -5px;
            left: 0px;
			width: 8px;
			height: 20px;
			background-color: #e7e7e7;
			border-radius: 2px;
            border: 1px solid #b8b8b8;
        }
    </style>

    <div class="slider-container" onmousedown={mousedown}>
        <div class="slider">
            <div class="picker"></div>
        </div>
    </div>
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

            const picker = this.root.querySelector("div.picker");
            const left = e.layerX;
            picker.style.left = left + "px";
            
            const slider = this.root.querySelector("div.slider");
            const per = left / (slider.clientWidth-picker.clientWidth/2);
            const current = per * this.duration;
            updateSeek(current);

            obs.trigger("player-video:seek", current);
        };

        const updateSeek = (current)=>{
            this.current = current;
            const per = this.current / this.duration;

            const picker = this.root.querySelector("div.picker");
            const slider = this.root.querySelector("div.slider");  
            picker.style.left = (per * (slider.clientWidth - picker.clientWidth)) + "px";

            this.fmt_current = time_format.toTimeString(this.current);
            this.fmt_duration = time_format.toTimeString(this.duration);

            this.update();
        };

        this.on("mount", () => {
            this.duration = 0;
            updateSeek(0);
            this.update();
        });

        obs.on("player-seek:reload", (duration) => {
            this.duration = duration;
            updateSeek(0);

            this.update();
        });

        obs.on("player-seek:seek-update", (current) => {
            updateSeek(current);
        });

        obs.on("player-seek:redraw", () => {
            updateSeek(this.current);
        });
    </script>
</player-seek>