<seek>
    <style scoped>
        :scope {
            display:grid;
            grid-template-rows: 1fr 1fr 1fr;
            grid-template-columns: 1fr 50px 10px 50px;
            width: 100%;
            height: 30px;
            margin: 0;
            background-color: #61c853;
        }
        .slider{
            grid-row: 2 / 3;
            grid-column: 1 / 2;
            background-color: #537cc8;
            position: relative;
            height: 10px;
        }
        .current {
            grid-row: 1 / 4;
            grid-column: 2 / 3;
            text-align: right;
        }
        .sep {
            grid-row: 1 / 4;
            grid-column: 3 / 4;
        }  
        .duration {
            grid-row: 1 / 4;
            grid-column: 4 / 5;
            text-align: right;
        }
        .picker {
            position: relative;
			top: -5px;
            left: 0px;
			width: 8px;
			height: 20px;
			background-color: #c85399;
			border-radius: 2px;
        }
    </style>
    <!-- <div id="seek-container"> -->
        <div class="slider" onmousedown={mousedown}>
            <div class="picker"></div>
        </div>
        <!--  -->
        <div class="current">{this.current}</div>
        <div class="sep">/</div>
        <div class="duration">{this.duration}</div>
    <!-- </div> -->
    <script>
        // var $ = jQuery = require("jquery")
        // require("jquery-ui")
        // // require('jquery-ui/ui/core')
        // require('jquery-ui/ui/widget')
        // require('jquery-ui/ui/widgets/mouse')
        // require('jquery-ui/ui/widgets/slider')
        mousedown(e){
            let picker = document.querySelector("div.picker");
            picker.style.left = e.clientX + "px";

            let slider = document.querySelector("div.slider");
            const per = e.clientX / slider.clientWidth;
            const current = per * this.duration;
            // console.log("mousedown current=" ,current, ", duration=", this.duration,
            // ", e.clientX= ", e.clientX,
            // ", slider.clientWidth= ", slider.clientWidth,
            // ", per= ", per);
            updateSeek(current);

            obs.trigger("on_seeked", current);
        };

        let updateSeek = (current)=>{
            this.current = current;
            //this.duration = duration;
            const per = this.current / this.duration;
            // console.log("updateSeek current=" ,current, ", duration=", this.duration, ", per= ", per);

            let picker = document.querySelector("div.picker");
            let slider = document.querySelector("div.slider");
            picker.style.left = (per * slider.clientWidth) + "px";

            this.update();
        };

        this.on('mount', () => {
            // $("#slider").slider()
            // this.current = 10;
            // this.duration = 0;
            updateSeek(0, 0);
            
        })
        // var that = this
        obs.on('seek_reload', (duration) => {
            //this.current = 0
            this.duration = duration;
            updateSeek(0);
            
            // $("#slider").slider({
            //     range: 'min',
            //     value: 0,
            //     min: 0,
            //     max: this.duration,
            //     step: 1,
            //     stop: function (event, ui) {
            //         console.log('slider stop ui.value=', ui.value)
            //         obs.trigger('on_seeked', ui.value)
            //     }
            // })

            // $('#slider').slider('value', this.current);

            this.update()
        })

        obs.on('seek_update', (current) => {
            updateSeek(current);
        })
    </script>
</seek>