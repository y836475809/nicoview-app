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
            this.duration = duration
            this.update()
        })

        obs.on('seek_update_current', (current) => {
            this.current = current
            this.update()
        })
    </script>
</seek>