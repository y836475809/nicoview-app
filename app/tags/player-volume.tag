<player-volume>
    <style scoped>
        :scope {
            width: 100px;
            height: 30px;
            margin: 0;
        }
        .slider{
            background-color: #797b80;
            position: relative;
            top: 10px;
            left: 15px;
            width: 70px;
            height: 10px;
        }
        .picker {
            position: relative;
			top: -1px;
            left: 0px;
			width: 10px;
			height: 10px;
			background-color: #e7e7e7;
			border-radius:50%;
            border: 1px solid #b8b8b8;
        }
    </style>

    <div class="slider" onmousedown={mousedown}>
        <div class="picker"></div>
    </div>

    <script>
        /* globals obs */
        this.mousedown = (e) => {
            let picker = this.root.querySelector("div.picker");
            const left = e.layerX;
            picker.style.left = left + "px";

            let slider = this.root.querySelector("div.slider");
            const per = left / slider.clientWidth;
            const volume = per * this.duration;

            obs.trigger("on_change_volume", volume);
        };

        obs.on("on_load_volume", (volume) => {
            let picker = this.root.querySelector("div.picker");
            let slider = this.root.querySelector("div.slider");      
            picker.style.left = volume * slider.clientWidth + "px";
        });

        this.on("mount", ()=> {
            console.log("mount v");
        });
    </script>
</player-volume>