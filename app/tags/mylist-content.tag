<mylist-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        .line-break {
            white-space: normal;
            word-wrap: break-word;
        }
    </style>      
    
    <div style="display:flex;">
        <input class="mylist-input" type="text"/>
        <button onclick={onclickUpdateMylist}>update</button>
    </div>
    <div></div>
    <div class="mylist-grid-container">
        <div class="mylist-grid"></div>
    </div>

    <script>
        /* globals app_base_dir obs */
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { NicoMylist, NicoMylistReader } = require(`${app_base_dir}/js/nico-mylist`);

        let nico_mylist = null;
        const nico_mylist_reader = new NicoMylistReader();

        const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
            return `<div class="line-break">${value}</div>`;
        };
        const BRFormatter = (row, cell, value, columnDef, dataContext)=> {
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };
        const columns = [
            {id: "thumb_img", name: "image", height:100, width: 130},
            {id: "title", name: "名前", formatter:lineBreakFormatter},
            {id: "description", name: "説明", formatter:BRFormatter},
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
</mylist-content>