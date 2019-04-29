<mylist-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        .mylist-label {
            margin-right: 5px;
            user-select: none;
        }

        .update-button {
            margin-left: 1px;
            width: 60px;
        }

        .add-mylist-button {
            margin-left: 10px;
            width: 30px;
            height: 30px;
        }
        .add-mylist-button .fa-plus-square {
            font-size: 30px;
            color: black;
        }
        .add-mylist-button .fa-plus-square:hover {
            color: darkgray;
        }

        .mylist-description {
            width: calc(100% - 10px);
            height: 100px;
            white-space: pre-wrap;
            overflow-y: scroll;
            padding: 3px;
            border: 1px solid var(--control-border-color);
            margin: 5px;
        }

        .line-break {
            white-space: normal;
            word-wrap: break-word;
        }
    </style>      

    <div style="display:flex;">
        <div class="mylist-label center-hv">mylist/</div><input class="mylist-input" type="text"/>
        <button class="update-button" onclick={onclickUpdateMylist}>更新</button>
        <span class="add-mylist-button center-hv" onclick={onclickAddMylist}>
            <i class="icon-button far fa-plus-square"></i></span>
    </div>
    <div class="mylist-description">{this.mylist_description}</div>
    <div class="mylist-grid-container">
        <div class="mylist-grid"></div>
    </div>

    <script>
        /* globals app_base_dir obs */
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { NicoMylist, NicoMylistStore } = require(`${app_base_dir}/js/nico-mylist`);

        const sidebar_name = "mylist-sidebar";

        this.mylist_description = "";

        const nico_mylist_store = new NicoMylistStore(()=>{
            return SettingStore.getMylistDir();
        });
        let nico_mylist = null;

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
        const setMylistID = (id) => {
            const elm = this.root.querySelector(".mylist-input");
            elm.value = id;
        };

        const setMylist = (mylist) => {
            this.mylist_description = mylist.description;
            this.update();

            const items = mylist.items;
            grid_table.setData(items);
        };

        const updateMylist = async(mylist_id) => {
            nico_mylist = new NicoMylist();
            const mylist = await nico_mylist.getMylist(mylist_id);
            setMylist(mylist);
        };

        const addMylist = (mylist) => {
            if(!mylist){
                return;
            }
            const title = `[${mylist.creator}] ${mylist.title}`;
            const id = mylist.id;
            const creator = mylist.creator;
            const link = mylist.link;   
            obs.trigger("mylist-sidebar:add-item", { title, id, creator, link });
            nico_mylist_store.save(id, nico_mylist.xml);
        };

        this.onclickUpdateMylist = async(e) => {  
            const mylist_id = getMylistID();
            updateMylist(mylist_id);
        };

        this.onclickAddMylist = (e) => {
            const mylist = nico_mylist.mylist;
            addMylist(mylist);
        };

        obs.on(`${sidebar_name}-dlbclick-item`, (item) => {
            const id = item.id;
            const mylist = nico_mylist_store.load(id);

            setMylistID(id);
            setMylist(mylist);
        });

        obs.on("mylist-page:load", (id)=> {

        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });
    </script>
</mylist-content>