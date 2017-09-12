<seek>
    <style scoped>
         :scope #seek-container {
            display: grid;
            grid-template-rows: 30px;
            grid-template-columns: 1fr 50px 5px 50px;
        }

         :scope #current {
            text-align: right;
            background-color: #57E79F;
        }

         :scope #duration {
            text-align: right;
            background-color: #ccc000;
        }

         :scope #seek-container {
            padding-left: 10px;
            padding-right: 10px;
        }

         :scope #slider .ui-slider-handle {
            /* border-color: #c0c0c0; */
            /* background: #E38692; */
            height: 10px;
            width: 10px;
            margin-top:5px;
            border-radius: 5px;
        }
    </style>
    <div id="seek-container">
        <div id="slider"></div>
        <div id="current">{current}</div>
        <div>/</div>
        <div id="duration">{duration}</div>
    </div>
    <script>
        var $ = jQuery = require("jquery")
        require("jquery-ui")
        // require('jquery-ui/ui/core')
        require('jquery-ui/ui/widget')
        require('jquery-ui/ui/widgets/mouse')
        require('jquery-ui/ui/widgets/slider')

        this.on('mount', () => {
            $("#slider").slider()
            this.current = 0
            this.duration = 0
            this.update()
        })
        // var that = this
        obs.on('seek_reload', (duration) => {
            this.current = 0
            this.duration = duration

            $("#slider").slider({
                range: 'min',
                value: 0,
                min: 0,
                max: this.duration,
                step: 1,
                stop: function (event, ui) {
                    console.log('slider stop ui.value=', ui.value)
                    obs.trigger('on_seeked', ui.value)
                }
            })

            // $('#slider').slider('value', this.current);

            this.update()
        })

        obs.on('seek_update_current', (current) => {
            this.current = current
            $('#slider').slider('value', this.current);

            this.update()
        })
    </script>
</seek>