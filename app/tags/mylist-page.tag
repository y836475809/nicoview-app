<mylist-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>      
    
    <split-page-templete>
        <yield to="sidebar">
            <div>content1</div>
        </yield>
        <yield to="main-content">
            <div style="display:flex;">
                <input class="mylist-input" type="text">
                <button onclick={onclickUpdateMylist}>update</button>
            </div>
            <div></div>
            <div class="mylist-grid-container">
                <div class="mylist-grid"></div>
            </div>
        </yield>
    </split-page-templete>

    <script>
        /* globals app_base_dir obs riot*/
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { NicoMylist, NicoMylistReader } = require(`${app_base_dir}/js/nico-mylist`);

        require(`${app_base_dir}/tags/split-page-templete.tag`);  
        riot.mount("split-page-templete");

        // this.mylist_id = "mylist/100";
        let nico_mylist = null;
        const nico_mylist_reader = new NicoMylistReader();

        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130},
            // {id: "id", name: "id"},
            {id: "title", name: "名前"},
            {id: "description", name: "説明"},
            {id: "date", name: "投稿日"},
            {id: "comment_count", name: "再生回数"},
            {id: "length", name: "時間"}
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        };    
        const grid_table = new GridTable("mylist-grid", columns, options);
        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".mylist-grid"));
            resizeGridTable();
        });

        const resizeGridTable = () => {
            const container = this.root.querySelector(".mylist-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const getMylistID = () => {
            const elm = this.root.querySelector(".mylist-input");
            return elm.value;
        };

        this.onclickUpdateMylist = async(e) => {
            const mylist_id = getMylistID();
            
            nico_mylist = new NicoMylist();
            const xml = await nico_mylist.getXML(mylist_id);
            const mylist = nico_mylist_reader.parse(xml);
            setMylist(mylist);
        };

        const setMylist = (mylist) => {
            const items = mylist.items;
            grid_table.setData(items);
        };

        obs.on("mylist-page:load", (id)=> {

        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });
    </script>
</mylist-page>