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
        /* globals app_base_dir obs */
        const {ipcRenderer, remote} = require("electron");
        const {Menu, MenuItem} = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        require(`${app_base_dir}/tags/player-page.tag`);
        require(`${app_base_dir}/tags/viewinfo-page.tag`);   

        let org_video_size = null;
        let gutter = false;
        let gutter_move = false;

        const pref_sync_comment = "player-sync-comment";
        const pref_default_size = "player-default-size";
        const pref_size = "player-size";
        const pref_infoview_width = "player-infoview-width";

        this.sync_comment_checked = SettingStore.getValue(pref_sync_comment, false);
        this.player_default_size = SettingStore.getValue(pref_default_size, { width: 854 ,height: 480 });

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
                obs.trigger("on-resized-player-split");
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
                        resizeVideo(this.player_default_size);
                    }
                },
                {
                    label: "x1.5",
                    click: () => {
                        const size = this.player_default_size;
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
            const vw = SettingStore.getValue(pref_infoview_width, 200);
            if(vw){
                let pe = document.getElementById("player-frame");
                let ve = document.getElementById("viewinfo-frame");
                pe.style.width = `calc(100% - ${vw}px)`;
                ve.style.width = vw + "px";
            }
            const size = SettingStore.getValue(pref_size, { width: 854 ,height: 480 });
            resizeVideo(size);
        });   
  
        obs.on("load_meta_data", (video_size) => {
            org_video_size =  video_size;
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

            const ve = document.getElementById("viewinfo-frame");  

            SettingStore.setValue(pref_size, { width: width, height: height });
            SettingStore.setValue(pref_infoview_width, parseInt(ve.offsetWidth));
            SettingStore.setValue(pref_sync_comment, this.refs.viewinfo_frame.getSyncCommentChecked());
        };
    </script>
</player-viewinfo-page>