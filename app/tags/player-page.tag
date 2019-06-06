<player-page>
    <style scoped>
        :scope {
            display: grid;
            margin: 0;
            width: 100%;
            height: 100%;
            --tags-height: 50px;
            --controls-height: 50px;
            grid-template-rows: var(--tags-height) 1fr var(--controls-height);
            grid-template-columns: 1fr 1fr;  
            background-color: var(--control-color);
        }
        #player-tags-content{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            outline: none;
        }  
        #player-video-content{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            background-color: black;
            outline: none;
        }  
        #player-controls-content{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            outline: none;
        }  
        #player-video {
            overflow: hidden; 
            object-fit: contain;
            object-position: center center;
            width: 100%;        
        }
    </style>

    <div id="player-tags-content" tabIndex="-1" onkeyup={this.onkeyupTogglePlay}>
        <player-tags obs={opts.obs}></player-tags>
    </div>
    <div id="player-video-content" tabIndex="-1" onkeyup={this.onkeyupTogglePlay}>
        <div id="player-video">
            <player-video obs={opts.obs}></player-video>
        </div>
    </div>
    <div id="player-controls-content" tabIndex="-1" onkeyup={this.onkeyupTogglePlay}>
        <player-controls obs={opts.obs}></player-controls>
    </div>

    <script>
        /* globals obs */
        const obs = this.opts.obs; 

        let tags_height = 0;
        let controls_height = 0;
        this.video_size = null;

        const adjustPlayerVideoSize = () => {
            const ch = this.root.clientHeight;
            const h = ch - (tags_height + controls_height);
            document.getElementById("player-video").style.height = h + "px";
        };

        this.getTagsPanelHeight = () => {
            const css_style = getComputedStyle(this.root);
            return parseInt(css_style.getPropertyValue("--tags-height"));
        };

        this.getControlPanelHeight = () => {
            const css_style = getComputedStyle(this.root);
            return parseInt(css_style.getPropertyValue("--controls-height"));
        };


        this.on("mount", () => {
            const css_style = getComputedStyle(this.root);
            tags_height = parseInt(css_style.getPropertyValue("--tags-height"));
            controls_height = parseInt(css_style.getPropertyValue("--controls-height"));

            adjustPlayerVideoSize();
        });

        obs.on("on_resize_window", (window_size) => { 
            adjustPlayerVideoSize();       
        });

        this.onkeyupTogglePlay = (e) => {
            if (e.keyCode === 32) {
                obs.trigger("player-controls:play");
            }
        };
    </script>  
      
</player-page>