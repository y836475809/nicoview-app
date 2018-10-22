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
            left: 0px;
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

    <div class="slider" onmousedown={slider_mousedown}>
        <div class="picker" onmousedown={picker_mousedown}></div>
    </div>

    <script>
        /* globals opts obs */
        const default_volume = opts.volume;
        this.picker_mousedown = (e) => {
            let picker = this.root.querySelector("div.picker");
            const left = parseInt(picker.style.left) -5 + e.layerX;
            picker.style.left = left + "px";
            let slider = this.root.querySelector("div.slider");
            const volume = left / slider.clientWidth;

            obs.trigger("on_change_volume", volume);

            e.stopPropagation();
        };

        this.slider_mousedown = (e) => {
            let picker = this.root.querySelector("div.picker");
            const left = e.layerX;
            picker.style.left = (left - 5) + "px";
            let slider = this.root.querySelector("div.slider");
            const volume = left / slider.clientWidth;

            obs.trigger("on_change_volume", volume);  
        };

        obs.on("on_load_volume", (volume) => {
            let picker = this.root.querySelector("div.picker");
            let slider = this.root.querySelector("div.slider");      
            picker.style.left = volume * slider.clientWidth + "px";
        });

        this.on("mount", ()=> {
            let picker = this.root.querySelector("div.picker");
            let slider = this.root.querySelector("div.slider");      
            picker.style.left = default_volume * slider.clientWidth - 5 + "px";

            obs.trigger("on_change_volume", default_volume); 
        });
    </script>
</player-volume>