<player-seek>
    <style scoped>
        :scope {
            display:grid;
            grid-template-rows: 1fr 1fr 1fr;
            grid-template-columns: 1fr 50px 10px 40px;
            width: 100%;
            height: 30px;
            margin: 0;
            font-family: "Meiryo";
            user-select: none;
            cursor: default;
        } 
        .slider{
            grid-row: 2 / 3;
            grid-column: 1 / 2;
            background-color: #797b80;
            position: relative;
            height: 10px;
            border-radius:5px;
        }
        .current {
            grid-row: 2 / 3;
            grid-column: 2 / 3;
            text-align: center;
            line-height: 10px;
            margin-left: 10px;
        }
        .slash {
            grid-row: 2 / 3;
            grid-column: 3 / 4;
            text-align: center;
            line-height: 10px;
        }  
        .duration {
            grid-row: 2 / 3;
            grid-column: 4 / 5;
            text-align: center;
            font-size: 12px;
            line-height: 10px;
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

    <div class="slider" onmousedown={mousedown}>
        <div class="picker"></div>
    </div>
    <div class="current">{this.fmt_current}</div>
    <div class="slash">/</div>
    <div class="duration">{this.fmt_duration}</div>

    <script>
        /* globals obs */
        const time_format = require("../../app/js/time_format");

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

            obs.trigger("on_seeked", current);
        };

        this.redraw = ()=>{
            updateSeek(this.current);
        };

        let updateSeek = (current)=>{
            this.current = current;
            const per = this.current / this.duration;

            const picker = this.root.querySelector("div.picker");
            const slider = this.root.querySelector("div.slider");  
            picker.style.left = (per * (slider.clientWidth - picker.clientWidth)) + "px";

            this.fmt_current = time_format.toPlayTime(this.current);
            this.fmt_duration = time_format.toPlayTime(this.duration);

            this.update();
        };

        this.on("mount", () => {
            this.duration = 0;
            updateSeek(0);
            this.update();
        });

        obs.on("seek_reload", (duration) => {
            this.duration = duration;
            updateSeek(0);

            this.update();
        });

        obs.on("seek_update", (current) => {
            updateSeek(current);
        });
    </script>
</player-seek>