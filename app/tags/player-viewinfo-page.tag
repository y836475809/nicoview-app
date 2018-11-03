<player-viewinfo-page onmousemove={mousemove} onmouseup={mouseup}>
    <style scoped>
        :scope {
            display: flex;
            height: 100%;
        }
    
        .gutter {
            cursor: col-resize;
            width: 8px;
        }
    
        .split.left{
            margin: 0;
            width: calc(100% - 200px);
        }

        .split.right{
            margin: 0;
            width: calc(200px);
            height: 100%;
        }
    </style>

    <div id="player-frame" class="split left">
        <player-page ref="player_frame"></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div id="viewinfo-frame" class="split right">
        <viewinfo-page ref="viewinfo_frame"></viewinfo-page>
    </div>

    <script>
        /* globals obs */
        require("./player-page.tag");
        require("./viewinfo-page.tag");

        let gutter = false;

        this.mousemove = (e) => {
            if(gutter){     
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                const mw = this.root.offsetWidth - e.clientX;
                ve.style.width = mw + "px";
                pe.style.width = `calc(100% - ${mw}px)`;
            }
        };
        this.mousedown = (e) => {
            if(e.which===1){
                gutter = true;     
            }
        };
        this.mouseup = (e) => {
            gutter = false;
        };

        this.setkk = (scale) => {  
            obs.trigger("resize_video_size", scale, (new_size) => {
                let pf_elm = document.getElementById("player-frame");

                const dh = new_size.height - pf_elm.offsetHeight;
                const new_height = window.outerHeight + dh;

                const dw = new_size.width - pf_elm.offsetWidth;
                const new_width = window.outerWidth + dw;

                window.resizeTo(new_width, new_height);
            });
        };

        this.on("mount", () => {
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