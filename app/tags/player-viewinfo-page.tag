<player-viewinfo-page onmousemove={mousemove} onmouseup={mouseup}>
    <style scoped>
        :scope {
            display: flex;
            height: 100%;
            --right-width: 300px;
        }
    
        .gutter {
            cursor: col-resize;
            width: 4px;
            border-left: 1px solid var(--control-border-color);
        }
    
        .split.left{
            margin: 0;
            width: calc(100% - var(--right-width));
        }

        .split.right{
            margin: 0;
            width: var(--right-width);
            height: 100%;
        }
    </style>

    <div id="player-frame" class="split left">
        <player-page ref="player_frame"></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div id="viewinfo-frame" class="split right">
        <viewinfo-page ref="viewinfo_frame" sync_comment_checked={this.sync_comment_checked}>
        </viewinfo-page>
    </div>

    <script>
        /* globals obs */
        const pref = require("../js/preference");
        require("./player-page.tag");
        require("./viewinfo-page.tag");

        this.sync_comment_checked = pref.SyncComment();
        let gutter = false;
        let gutter_move = false;

        this.mousemove = (e) => {
            if(gutter){   
                gutter_move = true;  
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
            if(gutter_move){
                obs.trigger("reset_comment_timelime");
            }
            gutter = false;
            gutter_move = false;
        };

        const resizeVideo = (size) => { 
            const h = this.refs.player_frame.getTagsPanelHeight() 
                    + this.refs.player_frame.getControlPanelHeight();
            const pf_elm = document.getElementById("player-frame");

            const dh = size.height + h - pf_elm.offsetHeight;
            const new_height = window.outerHeight + dh;

            const dw = size.width - pf_elm.offsetWidth;
            const new_width = window.outerWidth + dw;

            window.resizeTo(new_width, new_height);
        };

        this.on("mount", () => {
            const vw = pref.InfoViewWidth();
            if(vw){
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }
        });   
  
        obs.on("load_meta_data", (video_size) => { 
            const is_org_size = pref.ScreenSizeOrignal();
            const size = pref.ScreenSize();
            if(is_org_size){  
                resizeVideo(video_size);
            }else{
                resizeVideo(size);
            }
        });

        obs.on("on_set_screen_size", (is_org_size, size) => { 
            pref.ScreenSizeOrignal(is_org_size);
            resizeVideo(size);
        });

        obs.on("resizeEndEvent", (window_size) => {
            const h = this.refs.player_frame.getTagsPanelHeight() 
                    + this.refs.player_frame.getControlPanelHeight();
            const pf_elm = document.getElementById("player-frame");
            const width = pf_elm.offsetWidth - h;
            const height = pf_elm.offsetHeight;
            pref.ScreenSize({width: width, height: height});
        });

        let resize_begin = false;
        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            const window_size = {
                w: window.innerWidth, 
                h: window.innerHeight 
            };
            if(resize_begin===false){
                resize_begin = true;
                obs.trigger("on_resize_begin");
            }
            obs.trigger("on_resize_window", window_size);

            clearTimeout(timer);
            timer = setTimeout(() => {
                resize_begin = false;
                obs.trigger("resizeEndEvent", window_size);    
            }, timeout);
        });

        window.onbeforeunload = (e) => {
            const video_scale = this.refs.player_frame.getVideoScale();
            if(video_scale){
                pref.VideoScale(video_scale);
            }

            const ve = document.getElementById("viewinfo-frame");  
            pref.InfoViewWidth(parseInt(ve.offsetWidth));

            pref.SyncComment(this.refs.viewinfo_frame.getSyncCommentChecked());
        };
    </script>
</player-viewinfo-page>