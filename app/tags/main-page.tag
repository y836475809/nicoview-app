<main-page>
    <style scoped>
        :scope {
            --main-group-buttons-width: 55px;
            --page-margin: 1px;
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
        }

        .main-group-buttons {
            display: inline-block;
            width: var(--main-group-buttons-width);
            height: 100%;
            background-color: #222222
        }

        .page-container {
            display: inline-block;
            position: absolute;
            height: 100%;
            width: calc(100% - var(--main-group-buttons-width) - var(--page-margin)); 
            overflow-x: hidden;          
        }

        .main-group-buttons input[type=radio] {
            display: none; 
        }
        .main-group-buttons input[type=radio]:checked + .button{
            background: #2C7CFF;
        }
        .main-group-buttons .button {
            margin: 2px;
            text-align: center;
            box-sizing: border-box;
            border-radius: 2px;
        }
        .main-group-buttons .label .button{
            width: 50px;
            height: 50px;
        }

        .main-group-buttons .fa-book, 
        .main-group-buttons .fa-search,
        .main-group-buttons .fa-download,  
        .main-group-buttons .fa-history, 
        .main-group-buttons .fa-cog,
        .main-group-buttons .fa-list {
            font-size: 30px;
            color: lightgrey;
        }

        .download-badge {
            position: relative;
        }
        .download-badge > .item-num {
            position: absolute;
            text-align: center;
            left: 50%;
            top: 0px;
            font-size: 12px;
            line-height: 20px;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: red;
            text-align: center;
        }
    </style>
    <div class="main-group-buttons">
        <label class="label">
            <input type="radio" name="page_select" class="library-radio" onclick="{this.onclickPageSelect.bind(this,'library')}"> 
            <span title="ライブラリ" class="button center-hv"><span class="fas fa-book"></span></span>
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="search-radio" onclick="{this.onclickPageSelect.bind(this,'search')}"> 
            <span title="検索" class="button center-hv"><span class="fas fa-search"></span></span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="mylist-radio" onclick="{this.onclickPageSelect.bind(this,'mylist')}"> 
            <span title="Mylist" class="button center-hv"><span class="fas fa-list"></span></span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="download-radio" onclick="{this.onclickPageSelect.bind(this,'download')}"> 
            <div>
            <span title="download" class="button download-badge center-hv">
                <span class="fas fa-download"></span>
                <span class="item-num">{this.donwnload_item_num}</span>
            </span> 
            </div>
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="history-radio" onclick="{this.onclickPageSelect.bind(this,'history')}"> 
            <span title="履歴" class="button center-hv"><span class="fas fa-history"></span></span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="setting-radio" onclick="{this.onclickPageSelect.bind(this,'setting')}"> 
            <span title="設定" class="button center-hv"><span class="fas fa-cog"></span></span> 
        </label>
    </div>
    <div class="page-container library-page">
        <library-page obs={obs}></library-page>
    </div>
    <div class="page-container search-page">
        <search-page obs={obs}></search-page>
    </div>
    <div class="page-container mylist-page">
        <mylist-page obs={obs}></mylist-page>
    </div>
    <div class="page-container download-page">
        <download-page obs={obs}></download-page>
    </div>
    <div class="page-container history-page">
        <play-history obs={obs}></play-history>
    </div>
    <div class="page-container setting-page">
        <setting-page obs={obs}></setting-page>
    </div>

    <script>
        /* globals app_base_dir */
        const { remote } = require("electron");
        const { dialog } = require("electron").remote;
        const {Menu} = remote;
        const { IPCMsg, IPCMonitor } = require(`${app_base_dir}/js/ipc-monitor`);
        const ipc_monitor = new IPCMonitor();
        ipc_monitor.listenRemote();
        
        this.obs = this.opts.obs;

        this.donwnload_item_num = 0;

        let template = [{
            label: "File",
            submenu: [
                {
                    label: "Load",
                    click: () => {
                        const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                            properties: ["openFile"],
                            title: "Select",
                            defaultPath: ".",
                            filters: [
                                {name: "library db", extensions: ["db"]}, 
                                {name: "All", extensions: ["*"]},
                            ]
                        });
                        if(!paths){
                            return;
                        }
                        const data_path = paths[0];
                        // obs.trigger("get-library-items-from-file", data_path);
                    }
                }
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

        const select_page = (page_name)=>{
            Array.from(this.root.querySelectorAll(".page-container"), 
                (elm, index) => {
                    elm.style.zIndex = 0;
                });
            const page = this.root.querySelector(`.${page_name}-page`);
            page.style.zIndex = 1;

            const radio = this.root.querySelector(`.${page_name}-radio`);
            radio.checked = true;
        };

        this.onclickPageSelect = (page_name, e) => {
            select_page(page_name);
        };

        this.on("mount", function () {
            select_page("library");
        });

        this.obs.on("main-page:select-page", (page_name)=>{
            select_page(page_name);
        });

        this.obs.on("main-page:download-item-num", (num)=>{
            this.donwnload_item_num = num;
            this.update();
        });

        const PlayByVideoID = async(video_id) => {
            const data = await new Promise((resolve, reject) => {
                this.obs.trigger("library-page:get-data-callback", {
                    video_ids:[video_id],
                    cb: (data_map) => {
                        if(data_map.has(video_id)){
                            resolve(data_map.get(video_id));
                        }else{
                            resolve(null);
                        }
                    }
                });
            });
            ipc_monitor.play({ video_id, data }); 
        };

        this.obs.on("main-page:play-by-videoid", (video_id)=>{
            ipc_monitor.showPlayerSync();
            PlayByVideoID(video_id);            
        });     

        ipc_monitor.on(IPCMsg.PLAY_BY_ID, (event, args) => {
            ipc_monitor.showPlayerSync();
            const video_id = args;
            PlayByVideoID(video_id);   
        });

        ipc_monitor.on(IPCMsg.SEARCH_TAG, (event, args)=>{
            this.obs.trigger("main-page:select-page", "search");
            this.obs.trigger("search-page:search-tag", args);
        });

        ipc_monitor.on(IPCMsg.LOAD_MYLIST, (event, args)=>{
            this.obs.trigger("main-page:select-page", "mylist");
            this.obs.trigger("mylist-page:load-mylist", args);
        });

        ipc_monitor.on(IPCMsg.ADD_DOWNLOAD_ITEM, (event, args)=>{
            const item = args;
            this.obs.trigger("download-page:add-download-items", [item]);
            this.obs.trigger("search-page:add-download-items", [item.id]);
        });

        ipc_monitor.on(IPCMsg.ADD_PLAY_HISTORY, (event, args)=>{
            const item = args;
            this.obs.trigger("history-page:add-item", item);
            this.obs.trigger("library-page:play", item);
        });

        ipc_monitor.on(IPCMsg.UPDATE_DATA, (event, args)=>{
            const { video_id, update_target } = args;
            console.log("main update video_id=", video_id);
            this.obs.trigger("library-page:update-data", { 
                video_id: video_id,
                update_target: update_target,
                cb: (result)=>{
                    console.log("main update cb result=", result);
                    if(result.state == "ok"){
                        PlayByVideoID(video_id);
                    }
                    ipc_monitor.returnUpdateData(result);
                }
            });
        });

        ipc_monitor.on(IPCMsg.CANCEL_UPDATE_DATA, (event, args)=>{
            const video_id = args;
            this.obs.trigger("library-page:cancel-update-data", video_id);
        });

        window.onbeforeunload = (e) => {
        };

        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.obs.trigger("window-resized");
            }, timeout);
        });
    </script>
</main-page>