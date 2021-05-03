<player-volume>
    <style scoped>
        :scope {
            width: 100%;
            height: 30px;
            margin: 0;
        }
        .slider{
            background-color: #797b80;
            position: relative;
            top: 10px;
            left: 0px;
            height: 10px;
            border-radius:5px;
        }
        .picker {
            position: relative;
			top: 0px;
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
        /* globals */
        const myapi = window.myapi;

        const obs = this.opts.obs; 

        this.picker_mousedown = (e) => {
            let picker = this.root.querySelector("div.picker");
            const left = parseInt(picker.style.left) + e.layerX;
            updateVolume(left);

            e.stopPropagation();
        };

        this.slider_mousedown = (e) => {
            const left = e.layerX;
            updateVolume(left);
        };

        const updateVolume = (pos) => {
            let picker = this.root.querySelector("div.picker");
            picker.style.left = (pos - 5) + "px";

            let slider = this.root.querySelector("div.slider");
            const volume = pos / slider.clientWidth;

            // TODO check
            myapi.ipc.Config.set("player.volume", volume).then();

            obs.trigger("player-video:volume-changed", volume); 
        };

        this.on("mount", async ()=> {
            let picker = this.root.querySelector("div.picker");
            let slider = this.root.querySelector("div.slider");   
            const volume = await myapi.ipc.Config.get("player.volume", 0.5);
            picker.style.left = volume * slider.clientWidth - 5 + "px";
        });
    </script>
</player-volume>