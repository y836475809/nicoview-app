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
            display: flex;
            justify-content: center;
            align-items: center;
            width: 50px;
            height: 50px;
        }

        .main-group-buttons .fa-book, 
        .main-group-buttons .fa-search, 
        .main-group-buttons .fa-history, 
        .main-group-buttons .fa-cog {
           color: lightgrey;
        }
    </style>
    <div class="main-group-buttons">
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,0)}> 
            <span title="ライブラリ" class="button"><span class="fas fa-book fa-3x"></span></span>
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,1)}> 
            <span title="検索" class="button"><span class="fas fa-search fa-3x"></span></span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,2)}> 
            <span title="履歴" class="button"><span class="fas fa-history fa-3x"></span></span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,3)}> 
            <span title="設定" class="button"><span class="fas fa-cog fa-3x"></span></span> 
        </label>
    </div>
    <div id="page1" class="page-container">
        <library-page></library-page>
    </div>
    <div id="page2" class="page-container">
        <search-container-page></search-container-page>
    </div>
    <div id="page3" class="page-container">
        <play-history></play-history>
    </div>
    <div id="page4" class="page-container">
        <preference-page></preference-page>
    </div>

    <script>
        /* globals app_base_dir obs */
        const {remote} = require("electron");
        const { dialog } = require("electron").remote;
        const {Menu} = remote;
        let riot = require("riot");

        require(`${app_base_dir}/tags/library-page.tag`);
        require(`${app_base_dir}/tags/search-container-page.tag`);
        require(`${app_base_dir}/tags/play-history.tag`);
        require(`${app_base_dir}/tags/preference-page.tag`);

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

        this.index = 0;
        const select_page = (index)=>{
            this.index = index;

            const page1 = document.getElementById("page1");
            const page2 = document.getElementById("page2");
            const page3 = document.getElementById("page3");
            const page4 = document.getElementById("page4");

            const list = [0, 0, 0, 0];
            list[index] = 1;
            page1.style.zIndex = list[0];
            page2.style.zIndex = list[1];
            page3.style.zIndex = list[2];
            page4.style.zIndex = list[3];  

            Array.from(this.root.querySelectorAll("[name=\"page_select\"]"), 
                (elm, index) => {
                    elm.checked = index===this.index;
                });
        };

        this.onclickPageSelect = (index, e) => {
            select_page(index);
        };

        this.on("mount", function () {
            riot.mount("library-page");
            riot.mount("search-container-page");   
            riot.mount("play-history");
            riot.mount("preference-page");

            select_page(this.index);

            obs.trigger("on_clear_search");
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