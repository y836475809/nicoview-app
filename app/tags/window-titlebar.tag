<window-titlebar>
    <style scoped>
        :scope {
            display: flex;
            width: 100%;
            height: calc(var(--window-titlebar-height) - 1px);
            border-bottom: 1px solid var(--control-border-color);
            background-color: var(--control-color);
        }

        .menu {
            width: 30px;
            margin-left: 5px;
        }
        .menu > i {
            font-size: 20px;
            color: grey;
        }

        .title {
            -webkit-app-region: drag;
            user-select: none;
            width: 100%;
            margin-left: 10px;
            margin-top: 3px;
            margin-bottom: 3px;
            color: black;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        .buttons {
            -webkit-app-region: no-drag;
            display: flex;
            margin-left: auto;
        }
        .buttons > div { 
            width: 40px;
        }
        .buttons > div > i {
            font-size: 16px;
            color: grey;
        }
        .buttons > div:hover { 
            background-color: lightgray;
        }
        .buttons .close:hover { 
            background-color: red;
        }
    </style>

    <div class="menu center-hv" title="メニュー" onclick={onclickMenu}>
        <i class="fas fa-bars"></i>
    </div>
    <div class="center-v title">{title}</div>
    <div class="buttons" >
        <div class="center-hv" title="" onclick={onclickMin}>
            <i class="far fa-window-minimize"></i>
        </div>
        <div class="center-hv" title="" onclick={onclickToggleMax}>
            <i class="far fa-window-{max_restore}"></i>
        </div>
        <div class="close center-hv" title="" onclick={onclickClose}>
            <i class="fas fa-times"></i>
        </div>
    </div>

    <script>
        /* globals */
        const { remote } = window.electron;
        const { BrowserWindow } = remote;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs;
        this.title = this.opts.title;
        const window_name = this.opts.window_name;
        let context_menu = null;

        let maximized = false;
        this.max_restore = "maximize";

        this.on("mount", async () => {
            maximized = await IPCClient.request("config", "get", 
                { key:`${window_name}.window.state.maximized`, value:false });
            this.max_restore = maximized === true?"restore":"maximize";
            this.update();
        });

        if(obs!==undefined){
            obs.on(`${window_name}-window-titlebar:set-title`, (args) => {
                const { title } = args;
                this.title = title;
                this.update();
            });

            obs.on(`${window_name}-window-titlebar:set-menu`, (args) => {
                const { menu } = args;
                context_menu = menu;
            });
        }

        this.onclickMenu = e => { // eslint-disable-line
            if(context_menu === null){
                return;
            }
            context_menu.popup({ window: remote.getCurrentWindow() });
        };

        this.onclickMin = e => { // eslint-disable-line
            const win = BrowserWindow.getFocusedWindow();
            win.minimize();
        };

        this.onclickToggleMax = e => { // eslint-disable-line
            const win = BrowserWindow.getFocusedWindow();
            if(win.isMaximized() === true){
                this.max_restore = "maximize";
            }else{
                this.max_restore = "restore";
            }
            this.update();
            win.isMaximized() ? win.unmaximize() : win.maximize();
        };

        this.onclickClose = e => { // eslint-disable-line
            const win = BrowserWindow.getFocusedWindow();
            win.close();
        };  
    </script>
</window-titlebar>