<main-page>
    <style scoped>
        :scope {
            --select-tab-height: 80px;
            display:grid;
            grid-template-rows: var(--select-tab-height) 1fr;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
        }
        #main-select-page-tabs{
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
        /* #page3 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }        */
        input[type=radio] {
            display: none; 
        }
        input[type=radio]:checked + .button {
            background: #31A9EE;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            margin: 5px;
            padding: 5px;
            border: 2px solid #006DD9;
            text-align: center;
            box-sizing: border-box;
            border-radius: 5px;
        }
        .button:hover
        {
            color: #888;
        }
    </style>
    <div id="main-select-page-tabs">
        <!-- <select-page-tabs></select-page-tabs> -->
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.cl.bind(this,0)}> 
            <span class="button">page1</span>
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.cl.bind(this,1)}> 
            <span class="button">page2</span> 
        </label>
        <label class="label">
            <input type="radio" name="page_select" class="radio" onclick={this.cl.bind(this,2)}> 
            <span class="button">page3</span> 
        </label>
    </div>
    <div id="page1">
        <library-page></library-page>
    </div>
    <div id="page2">
        <search-page></search-page>
    </div>
    <div id="page3">
        test
    </div>

    <script>
        /* globals obs base_dir */
        require("datatables.net-scroller")( window, window.$ ); 
        let riot = require("riot");

        require(`${base_dir}/app/tags/select-page-tabs.tag`);
        require(`${base_dir}/app/tags/library-page.tag`);
        require(`${base_dir}/app/tags/search-page.tag`);
        // riot.mount("select-page-tabs", {tabs:["Tab 1","Tab 2","Tab 3"]});
        // riot.mount("library-page");
        // riot.mount("search-page");

        const tab_height = parseInt(getComputedStyle(this.root).getPropertyValue("--select-tab-height"));

        this.index = 0;
        let select_page = (index)=>{
            this.index = index;

            let page1 = document.getElementById("page1");
            let page2 = document.getElementById("page2");
            let page3 = document.getElementById("page3");

            let list = ["none", "none", "none"];
            list[index] = "block";
            page1.style.display = list[0];
            page2.style.display = list[1];
            page3.style.display = list[2];  

            Array.from(this.root.querySelectorAll("[name=\"page_select\"]"), 
                (elm, index) => {
                    elm.checked = index===this.index;
                });
        };

        this.cl = (index, e) => {
            select_page(index);
        };

        this.on("mount", function () {
            // riot.mount("select-page-tabs", {tabs:["Tab 1","Tab 2","Tab 3"]});
            riot.mount("library-page");
            riot.mount("search-page");        
            select_page(this.index);
        });

        obs.on("selindex", (index) => { 
            select_page(index);
        });

        const timeout = 200;
        let timer;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                obs.trigger("pageResizedEvent", {
                    w: this.root.offsetWidth, 
                    h: this.root.offsetHeight - tab_height
                });
            }, timeout);
        });
    </script>
</main-page>