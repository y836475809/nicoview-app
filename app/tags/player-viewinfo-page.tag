<player-viewinfo-page>
    <style scoped>
        :scope {
            display: flex;
            flex-direction: row;
            height: 100%;
        }
    
        .split {
            box-sizing: border-box;
            /* overflow-y: auto; */
            /* overflow-x: hidden; */
        }
    
        .gutter.gutter-horizontal {
            cursor: col-resize;
        }
    
        .split.split-horizontal,
        .gutter.gutter-horizontal {
            margin: 0;
            height: 100%;
            float: left;
        }
    </style>
    
    <div id="player-frame" class="split split-horizontal">
        <player-page ref="player_frame"></player-page>
    </div>
    <div id="viewinfo-frame" class="split split-horizontal">
        <viewinfo-page ref="viewinfo_frame"></viewinfo-page>
    </div>

    <script>
        /* globals obs */
        const Split = require("split.js");

        require("./player-page.tag");
        require("./viewinfo-page.tag");

        let sp;
        this.video_size = null;

        this.getVideoSize = () => {
            return this.video_size;
        };
        this.getFrameSize = () => {
            return {
                player:{
                    width: this.refs.player_frame.root.offsetWidth, 
                    height: this.refs.player_frame.root.offsetHeight
                },
                viewinfo:{
                    width: this.refs.viewinfo_frame.root.offsetWidth, 
                    height: this.refs.viewinfo_frame.root.offsetHeight                   
                }
            };
        };

        obs.on("resizePlayer", (video_size) => { 
            this.video_size = video_size;
        });

        obs.on("on_set_split_sizes", (sizes) => {
            sp.setSizes(sizes);
        });

        this.on("mount", () => {
            sp = Split(["#player-frame", "#viewinfo-frame"], {
                // sizes: [50, 50],
                // minSize: [100, 100],
                gutterSize: 8,
            });
        });   
        
        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            const window_size = {
                w: window.innerWidth, 
                h: window.innerHeight 
            };
            obs.trigger("on_resize_window", window_size);

            clearTimeout(timer);
            timer = setTimeout(() => {
                obs.trigger("pageResizedEvent", window_size);
            }, timeout);
        });
    </script>
</player-viewinfo-page>