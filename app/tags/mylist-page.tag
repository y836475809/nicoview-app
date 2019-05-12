<mylist-sidebar>
    <style scoped>
        .nico-mylist-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-mylist-sidebar">
        <accordion params={acdn}></accordion>
    </div>

    <script>
        /* globals app_base_dir obs riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const file_path = SettingStore.getSystemFile("mylist.json");

        try {
            this.store = new JsonStore(file_path);
            this.mylist_data = this.store.load();
        } catch (error) {
            this.mylist_data = {
                is_expand: true, 
                items: []
            };
        }

        const hasItem = (id) => {
            return this.mylist_data.items.some(value=>{
                return value.id == id;
            });
        };

        const save = (data) => {
            try {
                this.store.save(data);
            } catch (error) {
                console.log(error);
            }
        };

        const createMenu = (sender) => {
            const nemu_templete = [
                { 
                    label: "delete", click() {
                        obs.trigger(`${sender}:delete-selected-items`);
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.acdn = {
            title : "マイリスト",
            name: "mylist-sidebar",
            expand: true,
            items: this.mylist_data.items,
            oncontextmenu: ()=> {
                const menu = createMenu("mylist-sidebar");
                menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on(`${this.acdn.name}-state-change`, (data) => {
            save(data);
        });
        
        obs.on(`${this.acdn.name}:add-item`, (args) => {
            const { title, id, creator, link } = args;
            obs.trigger(`${this.acdn.name}-add-items`, 
                [
                    { title, id, creator, link }
                ]
            );
            obs.trigger(`${this.acdn.name}-change-expand`, true);
        });

        obs.on(`${this.acdn.name}:has-item`, (args) => {
            const {id, cb} = args;
            cb(hasItem(id));
        });
    </script>
</mylist-sidebar>

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
        const { CacheStore } = require(`${app_base_dir}/js/cache-store`);
        const sidebar_name = "mylist-sidebar";

        this.mylist_description = "";

        const image_cache = new CacheStore(
            SettingStore.getMylistDir(), "image-cache.json");

        const nico_mylist_store = new NicoMylistStore(()=>{
            return SettingStore.getMylistDir();
        });
        let nico_mylist = null;

        let is_local_item = false;

        const hasLocalItem = () => {
            const id = getMylistID();
            return new Promise( (resolve, reject) => {
                const cb = (has) =>{
                    resolve(has);
                };
                obs.trigger(`${sidebar_name}:has-item`, {id, cb});
            });
        };

        const getBase64 = (img, width, height) => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            // ctx.drawImage(img, 0, 0);
            ctx.drawImage(img, 0, 0, width, height);
            const data = canvas.toDataURL("image/jpeg");
            return data;
        };

        const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(is_local_item){
                const image = new Image();
                image.width = columnDef.width;
                image.height = columnDef.height;
                if(image_cache.has(value)){
                    // console.log("cache value=", value);
                    image.src = image_cache.get(value);    
                }else{
                    image.onload = (e) => {
                        // console.log("onload value=", value);
                        const org_width = e.target.width;
                        const org_height = e.target.height;
                        const width = columnDef.width;
                        const height = org_height * (columnDef.width / org_width);
                        const data = getBase64(e.target, width, height);
                        image_cache.set(value, data);     
                    };
                    image.src = value;
                }
                
                return image.outerHTML;
            }else{
                // console.log("img value=", value);
                return `<img src='${value}' 
                    class="mylist-img"
                    width="${columnDef.width}" 
                    height="${columnDef.height}"/>`;
            }
        };

        const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
            return `<div class="line-break">${value}</div>`;
        };
        const BRFormatter = (row, cell, value, columnDef, dataContext)=> {
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };
        const columns = [
            {id: "no", name: "#"},
            {id: "thumb_img", name: "image", height:130, width: 200, formatter:imageCacheFormatter},
            {id: "title", name: "名前", formatter:lineBreakFormatter},
            {id: "description", name: "説明", formatter:BRFormatter},
            {id: "date", name: "投稿日"},
            {id: "comment_count", name: "再生回数"},
            {id: "length", name: "時間"}
        ];
        const options = {
            rowHeight: 130,
            _saveColumnWidth: true,
        };    
        const grid_table = new GridTable("mylist-grid", columns, options);
        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".mylist-grid"));
            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                obs.trigger("play-by-videoid", video_id);
            });
            
            resizeGridTable();
            try {
                image_cache.load();
            } catch (error) {
                console.log(error);
            }   
        });

        const resizeGridTable = () => {
            const container = this.root.querySelector(".mylist-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const getMylistID = () => {
            const elm = this.root.querySelector(".mylist-input");
            const value = elm.value;
            return value.replace("mylist/", "");
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
            grid_table.scrollToTop();
        };

        const updateMylist = async(mylist_id) => {
            nico_mylist = new NicoMylist();
            try {
                const mylist = await nico_mylist.getMylist(mylist_id);
                setMylist(mylist);    
            } catch (error) {
                console.log(error);
            }
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

        const getImageCache = () => {
            const elms = this.root.querySelectorAll(".mylist-img");
            elms.forEach(elm => {
                const src = elm.src;
                const data = getBase64(elm);
                image_cache.set(src, data);
            });
        };

        this.onclickUpdateMylist = async(e) => {  
            is_local_item = await hasLocalItem();
            const mylist_id = getMylistID();
            await updateMylist(mylist_id);
            if(is_local_item){
                nico_mylist_store.save(mylist_id, nico_mylist.xml);
            }
        };

        this.onclickAddMylist = (e) => {
            const mylist = nico_mylist.mylist;
            addMylist(mylist);
            getImageCache();
        };

        obs.on(`${sidebar_name}-dlbclick-item`, (item) => {
            is_local_item = true;

            const id = item.id;
            const mylist = nico_mylist_store.load(id);

            setMylistID(id);
            setMylist(mylist);
        });

        obs.on("load-mylist", async(id)=> {
            setMylistID(id);
            await updateMylist(id);
        });

        obs.on("resizeEndEvent", (size)=> {
            resizeGridTable();
        });

        window.onbeforeunload = (e) => {
            image_cache.save();
        };
    </script>
</mylist-content>

<mylist-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>      
    
    <split-page-templete>
        <yield to="sidebar">
            <mylist-sidebar></mylist-sidebar>
        </yield>
        <yield to="main-content">
            <mylist-content></mylist-content>
        </yield>
    </split-page-templete>
</mylist-page>