<mylist-sidebar>
    <style scoped>
        .nico-mylist-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-mylist-sidebar">
        <listview 
            obs={obs_listview}
            name={name}
            confirm={confirm}
            gettooltip={getTooltip}
            gettitle={getTitle}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.name = "mylist";
        this.items = [];
        this.confirm = ["delete"];

        this.getTooltip = (item) => {
            const { title, creator } = item;
            return `[${creator}] ${title}`;
        };

        this.getTitle = (item) => {
            const { title, creator } = item;
            return `[${creator}] ${title}`;
        };

        const loadItems = async () => {
            this.items = await myapi.ipc.MyList.getItems();
            this.obs_listview.trigger("loadData", { items:this.items });
        };

        this.on("mount", async () => {
            await loadItems();
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            this.items = items;

            await myapi.ipc.MyList.updateItems(items);
        });

        this.obs_listview.on("show-contextmenu", (e, args) => {
            const { items, cb } = args;
            cb(null);
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            obs.trigger("mylist-page:item-dlbclicked", item);
        });
        
        this.obs_listview.on("items-deleted", (args) => {
            obs.trigger("mylist-page:items-deleted", args);
        });

        obs.on("mylist-page:sidebar:add-item", (args) => {
            const { title, mylist_id, creator } = args;
            const items = [
                { title, mylist_id, creator }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        obs.on("mylist-page:sidebar:get-items", (args) => {
            const { cb } = args;
            cb({items:this.items});
        });

        obs.on("mylist-page:sidebar:select-item", (args) => {
            const { mylist_id } = args;
            const index = this.items.findIndex(item => {
                return item.mylist_id == mylist_id;
            });

            if(index < 0){
                return;
            }
            this.obs_listview.trigger("select-item-by-index", { index });
        });

        obs.on("mylist-page:sidebar:reload-items", async () => {
            await loadItems();
        });
    </script>
</mylist-sidebar>

<mylist-content>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            --description-height: 100px;
            --control-height: 30px;
            --margin: 2px;
        }

        .mylist-container {
            display: flex;
        }

        .mylist-input {
            margin-left: var(--margin);
            width: 200px;
            font-size: 1.2em;
            border-width: 1px;
            border-style: solid;
            border-color: gray;
        }
        .mylist-input:focus {
            outline: none;
        }

        .mylist-container > div > i {
            font-size: 20px;
            color: gray;
        }
        .mylist-container > div > i:hover {
            color: black;
        }

        .update-button {
            width: var(--control-height);
            height: var(--control-height);
        }

        .add-mylist-button {
            width: var(--control-height);
            height: var(--control-height);
            background-color: rgba(0, 0, 0, 0);
        }

        .update-button,
        .add-mylist-button {
            cursor: pointer;
        }

        .add-mylist-button > .fav-mark {
            color: royalblue; 
        }
        .add-mylist-button > .fav-mark:hover {
            color: blue;
        }

        .mylist-description {
            width: calc(100% - var(--margin) * 2);
            height: var(--description-height);
            white-space: pre-wrap;
            overflow-y: scroll;
            padding: 3px;
            border: 1px solid var(--control-border-color);
            margin-left: var(--margin);
            margin-top: calc(var(--margin) * 2);
            margin-bottom: calc(var(--margin) * 2);
            background-color: white;
        }

        .mylist-grid-container {
            width: 100%;
            height: calc(100% - var(--description-height) 
                - var(--control-height) - var(--margin) * 3);
            overflow: hidden;
        }
    </style>      

    <div class="mylist-container">
        <input class="mylist-input" type="text" onkeydown={onkeydownUpdateMylist}/>
        <div class="update-button center-hv" title="更新", onclick={onclickUpdateMylist}>
            <i class="fas fa-redo-alt"></i>
        </div>
        <div class="add-mylist-button center-hv" title="マイリストを保存" onclick={onclickSaveMylist}>
            <i class={getIconClass()}></i>
        </div>
    </div>
    <div class="mylist-description">{mylist_description}</div>
    <div class="mylist-grid-container">
        <div class="mylist-grid"></div>
    </div>
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const myapi = window.myapi;
        const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
        const { Command } = window.Command;
        const { NicoMylist, NicoMylistStore, NicoMylistImageCache } = window.NicoMylist;
        const { needConvertVideo } = window.VideoConverter;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        myapi.ipc.Download.onUpdateItem(async ()=>{
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        myapi.ipc.Library.onAddItem((args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        myapi.ipc.Library.onDeleteItem((args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });
 
        this.mylist_description = "";

        let nico_mylist_image_cache = null;
        let nico_mylist_store = null;
        let nico_mylist = null;
        let loaded_mylist_id = null;

        const getMylistIDList = () => {
            return new Promise( (resolve, reject) => {
                const cb = (args) =>{
                    const { items } = args;
                    const mylist_id_list = items.map(item => {
                        return item.mylist_id;
                    });
                    resolve(mylist_id_list);
                };
                obs.trigger("mylist-page:sidebar:get-items", { cb });
            }); 
        };

        const existMylist = async (id) => {
            const ids = await getMylistIDList();
            return ids.includes(id);
        };

        const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
            const mylist_id = dataContext.mylist_id;
            const url = value;
            return nico_mylist_image_cache.getImageHtml(mylist_id, url);
        };

        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };

        const mylist_infoFormatter = infoFormatter.bind(this, 
            (value, dataContext)=>{ 
                return `<div>ID: ${dataContext.id}</div>`;
            });
        const columns = [
            {id: "no", name: "#"},
            {id: "thumb_img", name: "サムネイル", width: 130, formatter:imageCacheFormatter},
            {id: "title", name: "名前", formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報", formatter:mylist_infoFormatter},
            {id: "description", name: "説明", formatter:htmlFormatter},
            {id: "date", name: "投稿日"},
            {id: "length", name: "時間"}
        ];
        const options = {
            rowHeight: 100,
        };    
        const grid_table = new GridTable("mylist-grid", columns, options);

        const play = async (item, online) => {
            const video_id = item.id;
            const video_item = await myapi.ipc.Library.getItem(video_id);
            if(!online && needConvertVideo(video_item)){       
                const ret = await myapi.ipc.Dialog.showMessageBox({
                    message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                    okcancel: true
                });
                if(!ret){
                    return;
                }
                obs.trigger("library-page:convert-video", video_id);
            }else{
                Command.play(item, online);
            }
        };

        this.on("mount", async () => {
            const mylist_dir = await myapi.ipc.MyList.getMyListDir();  
            nico_mylist_store = new NicoMylistStore(mylist_dir);
            nico_mylist_image_cache = new NicoMylistImageCache(mylist_dir);

            const grid_container = this.root.querySelector(".mylist-grid");
            grid_table.init(grid_container);
            grid_table.setupResizer(".mylist-grid-container");
            grid_table.onDblClick(async (e, data)=>{
                const video_id = data.id;
                const video_item = await myapi.ipc.Library.getItem(video_id);
                if(needConvertVideo(video_item)===true){      
                    const ret = await myapi.ipc.Dialog.showMessageBox({
                        message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                        okcancel: true
                    });
                    if(!ret){
                        return;
                    }
                    obs.trigger("library-page:convert-video", video_id);
                }else{
                    Command.play(data, false);
                }
            });
            grid_table.onButtonClick(async (e, cmd_id, data)=>{
                if(cmd_id == "play"){
                    await play(data, false);
                }
                if(cmd_id == "stack"){
                    Command.addStackItems(obs, [data]);
                }
                if(cmd_id == "bookmark"){
                    Command.addBookmarkItems(obs, [data]);
                }
                if(cmd_id == "download"){
                    Command.addDownloadItems(obs, [data]);
                }
            });
            
            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas();
                if(items.length==0){
                    return;
                }
                const video_id = items[0].id;
                const video_item = await myapi.ipc.Library.getItem(video_id);
                const need_convert = needConvertVideo(video_item);
                const context_menu_type = need_convert?"convert-video":"main";
                const menu_id = await myapi.ipc.popupContextMenu("mylist", {context_menu_type, items});
                if(!menu_id){
                    return;
                }
                if(menu_id=="convert-video"){
                    obs.trigger("library-page:convert-video", video_id); 
                }
            });   
        });

        const getMylistID = () => {
            const elm = this.root.querySelector(".mylist-input");
            return elm.value;
        };
        const setMylistID = (id) => {
            const elm = this.root.querySelector(".mylist-input");
            elm.value = id;
        };

        const hasMylistID = async (mylist_id) => {
            const mylist_id_list = await getMylistIDList();
            return mylist_id_list.includes(mylist_id);
        };

        let is_current_fav = false;
        this.getIconClass = () => {
            if(is_current_fav){
                return "fas fa-star fav-mark";
            }else{
                return "far fa-star";
            }
        };

        const setMylist = async (mylist) => {
            this.mylist_description = mylist.description;

            const mylist_id_list = await getMylistIDList();
            nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
            nico_mylist_image_cache.loadCache(mylist.mylist_id);

            if(await hasMylistID(mylist.mylist_id)){
                is_current_fav = true;
                obs.trigger("mylist-page:sidebar:select-item", { mylist_id: mylist.mylist_id });
            }else{
                is_current_fav = false;
            }
            this.update();

            setData(mylist);
        };

        const setData = async (mylist) => {
            loaded_mylist_id = mylist.mylist_id;
            
            const mylist_items = mylist.items;
            const video_ids = await myapi.ipc.Download.getIncompleteIDs();
            for (let i=0; i<mylist_items.length; i++) {
                const item = mylist_items[i];
                const video_id = item.id;
                item.saved = await myapi.ipc.Library.hasItem(video_id);
                item.reg_download = video_ids.includes(video_id);  
                item.mylist_id = mylist.mylist_id;
            }
            grid_table.clearSelected();
            grid_table.setData(mylist_items);
            grid_table.scrollToTop();   
        };

        const getMylist = async(mylist_id) => {
            nico_mylist = new NicoMylist();
            const mylist = await nico_mylist.getMylist(mylist_id);
            await setMylist(mylist);
        };

        const addMylist = (mylist) => {
            if(!mylist){
                return;
            }

            const mylist_id = mylist.mylist_id;
   
            const item = {
                title: mylist.title,
                mylist_id: mylist_id,
                creator: mylist.creator
            };
            obs.trigger("mylist-page:sidebar:add-item", item);
            nico_mylist_store.save(mylist_id, nico_mylist.xml);
        };

        const cacheImage = (mylist_id) => {
            const elms = this.root.querySelectorAll(".mylist-img");
            elms.forEach(elm => {
                nico_mylist_image_cache.setImage(mylist_id, elm);
            });
        };

        const onCancelUpdate = () => {
            if(nico_mylist){
                nico_mylist.cancel();
            }
        };

        const updateMylist = async () => {
            if(this.root.querySelector("modal-dialog").dataset.open=="true"){
                return;
            }
            
            this.obs_modal_dialog.trigger("show", {
                message: "更新中...",
                buttons: ["cancel"],
                cb: result=>{
                    onCancelUpdate();
                }
            });
            
            try {
                const mylist_id = getMylistID();
                await getMylist(mylist_id);

                const mylist_id_list = await getMylistIDList();
                if(mylist_id_list.includes(mylist_id)){
                    nico_mylist_store.save(mylist_id, nico_mylist.xml);
                }
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }

            this.obs_modal_dialog.trigger("close");
        };

        this.onkeydownUpdateMylist = async(e) => { 
            if(e.target.value && e.keyCode===13){
                await updateMylist();
            }
        }; 

        this.onclickUpdateMylist = async(e) => {  
            await updateMylist();
        };

        this.onclickSaveMylist = (e) => {
            if(!nico_mylist){
                return;
            }

            const mylist = nico_mylist.mylist;
            addMylist(mylist);
            cacheImage(mylist.mylist_id);

            is_current_fav = true;
            this.update();
        };

        obs.on("mylist-page:item-dlbclicked", async (item) => {
            const mylist_id = item.mylist_id;
            if(loaded_mylist_id == mylist_id){
                await updateMylist();
            }else{
                try {
                    const mylist = nico_mylist_store.load(mylist_id);
                    setMylistID(mylist_id);
                    await setMylist(mylist); 
                } catch (error) {
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }
        });

        obs.on("mylist-page:load-mylist", async(mylist_id)=> {
            setMylistID(mylist_id);
            try {
                if(await existMylist(mylist_id)){
                    await setMylist(nico_mylist_store.load(mylist_id)); 
                }else{
                    await getMylist(mylist_id);
                }
                obs.trigger("mylist-page:sidebar:select-item", { mylist_id });
            } catch (error) {
                if(!error.cancel){
                    logger.error(error);
                    await myapi.ipc.Dialog.showMessageBox({
                        type: "error",
                        message: error.message
                    });
                }
            }   
        });

        obs.on("mylist-page:items-deleted", (args)=> {
            const { items } = args;
            items.forEach(item => {
                const mylist_id = item.mylist_id;
                nico_mylist_store.delete(mylist_id);
                nico_mylist_image_cache.delete(mylist_id);
            }); 
        });

        obs.on("css-loaded", () => {
            grid_table.resizeGrid();
        });

        window.addEventListener("beforeunload", async (event) => {
            const mylist_id_list = await getMylistIDList();
            nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
            nico_mylist_image_cache.save();
        });
    </script>
</mylist-content>

<mylist-page>
    <div class="split-page">
        <div class="left">
            <mylist-sidebar obs={obs}></mylist-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <mylist-content obs={obs}></mylist-content>
        </div>
    </div>    
    <script>
        this.obs = this.opts.obs;
    </script>
</mylist-page>