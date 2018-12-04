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
        const {ipcRenderer, remote} = require("electron");
        const {Menu, MenuItem} = remote;
        require("./player-page.tag");
        require("./viewinfo-page.tag");

        let org_video_size = null;
        this.sync_comment_checked = ipcRenderer.sendSync("getPreferences", "sync_comment");
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

        let template = [{
            label: "View",
            submenu: [
                {
                    label: "x1",
                    click: () => {
                        resizeVideo(ipcRenderer.sendSync("getPreferences", "player_default_size"));
                    }
                },
                {
                    label: "x1.5",
                    click: () => {
                        const size = ipcRenderer.sendSync("getPreferences", "player_default_size");
                        resizeVideo({width: size.width * 1.5, height: size.height * 1.5});
                    }
                },
                {
                    label: "orgnal size",
                    click: () => {
                        if(org_video_size){
                            resizeVideo(org_video_size);
                        }
                    }
                },
            ]
        },
        {
            label: "Tools",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools" },
            ]
        }];
        const menu = Menu.buildFromTemplate(template);
        remote.getCurrentWindow().setMenu(menu);

        this.on("mount", () => {
            const vw = ipcRenderer.sendSync("getPreferences", "info_view_width");
            if(vw){
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }
            const size = ipcRenderer.sendSync("getPreferences", "player_size");
            resizeVideo(size);
        });   
  
        obs.on("load_meta_data", (video_size) => {
            org_video_size =  video_size;

            const is_org_size = ipcRenderer.sendSync("getPreferences", "play_org_size");
            if(is_org_size){  
                resizeVideo(org_video_size);
            }
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
            const h = this.refs.player_frame.getTagsPanelHeight() 
                    + this.refs.player_frame.getControlPanelHeight();
            const pf_elm = document.getElementById("player-frame");
            const width = pf_elm.offsetWidth;
            const height = pf_elm.offsetHeight - h;
            ipcRenderer.send("setPreferences", {
                key:"player_size", 
                value: {width: width, height: height}
            });

            const ve = document.getElementById("viewinfo-frame");  
            ipcRenderer.send("setPreferences", { 
                key:"info_view_width", 
                value: parseInt(ve.offsetWidth)
            });

            ipcRenderer.send("setPreferences", { 
                key:"sync_comment", 
                value: this.refs.viewinfo_frame.getSyncCommentChecked()
            });
        };
    </script>
</player-viewinfo-page>