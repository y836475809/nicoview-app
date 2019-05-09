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
            <span title="download" class="button center-hv"><span class="fas fa-download"></span></span> 
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
        <library-page></library-page>
    </div>
    <div class="page-container search-page">
        <search-container-page></search-container-page>
    </div>
    <div class="page-container mylist-page">
        <mylist-page></mylist-page>
    </div>
    <div class="page-container download-page">
        <download-page></download-page>
    </div>
    <div class="page-container history-page">
        <play-history></play-history>
    </div>
    <div class="page-container setting-page">
        <preference-page></preference-page>
    </div>

    <script>
        /* globals app_base_dir obs */
        const {remote, ipcRenderer } = require("electron");
        const { dialog } = require("electron").remote;
        const {Menu} = remote;
        let riot = require("riot");

        const requireMainTags = require(`${app_base_dir}/js/require-main-tags`); 
        requireMainTags(app_base_dir);

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
                        obs.trigger("get-library-items-from-file", data_path);
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
            riot.mount("library-page");
            riot.mount("search-container-page");   
            riot.mount("download-page");
            riot.mount("play-history");
            riot.mount("preference-page");
            riot.mount("mylist-page");

            select_page("library");

            obs.trigger("on_clear_search");
        });

        obs.on("main-page:select-page", (page_name)=>{
            select_page(page_name);
        });

        //TODO
        obs.on("main-page:play-by-videoid", (video_id)=>{
            obs.trigger("get-library-data-callback", {
                video_ids:[video_id],
                cb: (data_map) => {
                    if(data_map.has(video_id)){
                        const library_data = data_map.get(video_id);
                        const thumb_info = library_data.viweinfo.thumb_info;   
                        obs.trigger("add-history-items", {
                            image: thumb_info.thumbnail_url, 
                            id: video_id, 
                            name: thumb_info.title, 
                            url: library_data.video_data.src
                        });
                        ipcRenderer.send("request-play-library", data_map.get(video_id));
                    }else{
                        ipcRenderer.send("request-play-niconico", video_id);
                    }
                }
            });
        });      

        window.onbeforeunload = (e) => {
        };

        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                obs.trigger("resizeEndEvent", {
                    w: this.root.offsetWidth, 
                    h: this.root.offsetHeight,
                    width: this.root.offsetWidth, 
                    height: this.root.offsetHeight
                });
            }, timeout);
        });
    </script>
</main-page>