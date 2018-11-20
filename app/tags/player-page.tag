<player-page>
    <style scoped>
        :scope {
            display: grid;
            margin: 0;
            width: 100%;
            height: 100%;
            --tags-height: 100px;
            --controls-height: 100px;
            grid-template-rows: var(--tags-height) 1fr var(--controls-height);
            grid-template-columns: 1fr 1fr;  
            background-color: var(--control-color);
        }
        #player-tags-content{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
        }  
        #player-video-content{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            background-color: black;
        }  
        #player-controls-content{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
        }  
        #player-video {
            overflow: hidden; 
            object-fit: contain;
            object-position: center center;
            width: 100%;        
        }
    </style>

    <div id="player-tags-content">
        <player-tags></player-tags>
    </div>
    <div id="player-video-content">
        <div id="player-video">
            <player-video></player-video>
        </div>
    </div>
    <div id="player-controls-content">
        <player-controls></player-controls>
    </div>

    <script>
        /* globals base_dir obs */
        require(`${base_dir}/app/tags/player-tags.tag`);
        require(`${base_dir}/app/tags/player-video.tag`);
        require(`${base_dir}/app/tags/player-controls.tag`);
        
        let tags_height = 0;
        let controls_height = 0;
        this.video_size = null;

        const adjustPlayerVideoSize = () => {
            const ch = this.root.clientHeight;
            const h = ch - (tags_height + controls_height);
            document.getElementById("player-video").style.height = h + "px";
        };

        this.getVideoScale = () => {
            if(!this.video_size){
                return null;
            }
            const elm = document.getElementById("player-video");
            const scale_w = elm.offsetWidth / this.video_size.width;
            const scale_h = elm.offsetHeight / this.video_size.height;
            if(Math.abs(scale_w-scale_h)<1e-3){
                return scale_w;
            }
            return -1;
        };

        obs.on("resize_video_size", (scale, callback) => {
            if(!this.video_size){
                return;
            }

            const new_size = {
                width: this.video_size.width * scale,
                height: this.video_size.height * scale + tags_height + controls_height
            };
            callback(new_size);
        });

        obs.on("load_meta_data", (video_size) => { 
            this.video_size = video_size;
            obs.trigger("load_video");
        });

        this.on("mount", () => {
            const css_style = getComputedStyle(this.root);
            tags_height = parseInt(css_style.getPropertyValue("--tags-height"));
            controls_height = parseInt(css_style.getPropertyValue("--controls-height"));

            adjustPlayerVideoSize();
        });

        obs.on("on_resize_window", (window_size) => { 
            adjustPlayerVideoSize();       
        });
    </script>  
      
</player-page>