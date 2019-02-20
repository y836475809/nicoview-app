<main-page>
    <style scoped>
        :scope {
            --main-group-buttons-height: 30px;
            display:grid;
            grid-template-rows: var(--main-group-buttons-height) 1fr;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
        }
        .main-group-buttons{
            grid-row: 1 / 2;
            grid-column: 1 / 3;
        }
        #page1 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }
        #page2 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }  
        #page3 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }   

        .main-group-buttons input[type=radio] {
            display: none; 
        }
        .main-group-buttons input[type=radio]:checked + .button {
            background: lightgray;
            color: black;
        }
        .main-group-buttons .button {
            display: inline-block;
            margin-right: -2px; 
            margin-left: 2px;
            margin-top: 2px;
            margin-bottom: 2px;
            padding: 3px 5px 5px 5px;
            border: 1px solid gray;
            text-align: center;
            box-sizing: border-box;
            border-radius: 2px;
            height: calc(var(--main-group-buttons-height) - 5px);
            width: 80px;
        }
        .main-group-buttons .button:hover {
            box-shadow: 0 0 1px rgba(0, 0, 0, .2) inset,
              2px 0 2px -2px rgba(0, 0, 0, .2) inset,
              -2px 0 5px -2px rgba(0, 0, 0, .2) inset; 
        }
    </style>
    <div class="main-group-buttons">
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,0)}> 
            <span class="button">ライブラリ</span>
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,1)}> 
            <span class="button">検索</span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.onclickPageSelect.bind(this,2)}> 
            <span class="button">履歴</span> 
        </label>
    </div>
    <div id="page1">
        <library-page></library-page>
    </div>
    <div id="page2">
        <search-page></search-page>
    </div>
    <div id="page3">
        <play-history></play-history>
    </div>
    <preference-page></preference-page>

    <script>
        /* globals obs base_dir */
        const {remote} = require("electron");
        const { dialog } = require("electron").remote;
        const {Menu} = remote;
        let riot = require("riot");

        require(`${base_dir}/app/tags/library-page.tag`);
        require(`${base_dir}/app/tags/search-page.tag`);
        require(`${base_dir}/app/tags/play-history.tag`);
        require(`${base_dir}/app/tags/preference-page.tag`);

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
                },
                {
                    label: "Preference",
                    click: () => {
                        obs.trigger("on_change_show_pref_page", true);  
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

        const main_group_buttons_height = parseInt(getComputedStyle(this.root).getPropertyValue("--main-group-buttons-height"));

        this.index = 0;
        let select_page = (index)=>{
            this.index = index;

            let page1 = document.getElementById("page1");
            let page2 = document.getElementById("page2");
            let page3 = document.getElementById("page3");

            let list = [0, 0, 0];
            list[index] = 1;
            page1.style.zIndex = list[0];
            page2.style.zIndex = list[1];
            page3.style.zIndex = list[2];  

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
            riot.mount("search-page");   
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
                    h: this.root.offsetHeight - main_group_buttons_height,
                    width: this.root.offsetWidth, 
                    height: this.root.offsetHeight - main_group_buttons_height                   
                });
            }, timeout);
        });
    </script>
</main-page>