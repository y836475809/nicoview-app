<player-viewinfo-page>
    <style scoped>
        :scope { 
            display: flex;
            flex-direction: row;
        }
        .gutter.gutter-horizontal {
            cursor: ew-resize;
        }
    </style>
    
    <div id="player-frame" class="split">
        <player-page></player-page>
    </div>
    <div id="viewinfo-frame" class="split">
        <viewinfo-page></viewinfo-page>
    </div>

    <script>
        /* globals obs */
        const Split = require("split.js");

        require("./player-page.tag");
        require("./viewinfo-page.tag");

        let sp;

        obs.on("on_set_split_sizes", (sizes) => {
            sp.setSizes(sizes);
        });

        this.on("mount", () => {
            sp = Split(["#player-frame", "#viewinfo-frame"], {
                sizes: [50, 50],
                minSize: [100, 100]
            });
        });   
        
        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                obs.trigger("pageResizedEvent", {
                    w: this.root.offsetWidth, 
                    h: this.root.offsetHeight
                });
            }, timeout);
        });
    </script>
</player-viewinfo-page>