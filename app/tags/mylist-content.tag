<mylist-content>
    <style>
        :host {
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

    <script>
        /* globals my_obs logger ModalDialog */
        export default {
            onBeforeMount(props) {  
                this.myapi = window.myapi;
                const { GridTable, wrapFormatter, buttonFormatter, infoFormatter } = window.GridTable;
                this.Command = window.Command.Command;
                this.NicoMylist = window.NicoMylist.NicoMylist;
                this.NicoMylistStore = window.NicoMylist.NicoMylistStore;
                this.NicoMylistImageCache = window.NicoMylist.NicoMylistImageCache;
                this.needConvertVideo = window.VideoConverter.needConvertVideo;

                this.obs = props.obs; 
                this.obs_modal_dialog = my_obs.createObs();
                this.modal_dialog = null;

                this.myapi.ipc.Download.onUpdateItem(async ()=>{
                    const video_ids = await this.myapi.ipc.Download.getIncompleteIDs();
                    const items = this.grid_table.dataView.getItems();

                    for (let i=0; i<items.length; i++) {
                        const item = items[i];
                        const video_id = item.id;
                        item.saved = await this.myapi.ipc.Library.hasItem(video_id);
                        item.reg_download = video_ids.includes(video_id);
                        this.grid_table.dataView.updateItem(video_id, item);    
                    }
                });

                this.myapi.ipc.Library.onAddItem((args) => {
                    const {video_item} = args;
                    const video_id = video_item.id;
                    this.grid_table.updateCells(video_id, { saved:true });
                });

                this.myapi.ipc.Library.onDeleteItem((args) => {
                    const { video_id } = args;
                    this.grid_table.updateCells(video_id, { saved:false });
                });
        
                this.mylist_description = "";

                this.nico_mylist_image_cache = null;
                this.nico_mylist_store = null;
                this.nico_mylist = null;
                this.loaded_mylist_id = null;

                this.obs.on("mylist-page:item-dlbclicked", async (item) => {
                    const mylist_id = item.mylist_id;
                    if(this.loaded_mylist_id == mylist_id){
                        await this.updateMylist();
                    }else{
                        try {
                            const mylist = this.nico_mylist_store.load(mylist_id);
                            this.setMylistID(mylist_id);
                            await this.setMylist(mylist); 
                        } catch (error) {
                            logger.error(error);
                            await this.myapi.ipc.Dialog.showMessageBox({
                                type: "error",
                                message: error.message
                            });
                        }
                    }
                });

                this.obs.on("mylist-page:load-mylist", async(mylist_id)=> {
                    this.setMylistID(mylist_id);
                    try {
                        if(await this.existMylist(mylist_id)){
                            await this.setMylist(this.nico_mylist_store.load(mylist_id)); 
                        }else{
                            await this.getMylist(mylist_id);
                        }
                        this.obs.trigger("mylist-page:sidebar:select-item", { mylist_id });
                    } catch (error) {
                        if(!error.cancel){
                            logger.error(error);
                            await this.myapi.ipc.Dialog.showMessageBox({
                                type: "error",
                                message: error.message
                            });
                        }
                    }   
                });

                this.obs.on("mylist-page:items-deleted", (args)=> {
                    const { items } = args;
                    items.forEach(item => {
                        const mylist_id = item.mylist_id;
                        this.nico_mylist_store.delete(mylist_id);
                        this.nico_mylist_image_cache.delete(mylist_id);
                    }); 
                });

                window.addEventListener("beforeunload", async (event) => {
                    const mylist_id_list = await this.getMylistIDList();
                    this.nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
                    this.nico_mylist_image_cache.save();
                });

                const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
                    const mylist_id = dataContext.mylist_id;
                    const url = value;
                    return this.nico_mylist_image_cache.getImageHtml(mylist_id, url);
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
                this.grid_table = new GridTable("mylist-grid", columns, options);

                this.is_current_fav = false;
            },
            async onMounted() {
                const mylist_dir = await this.myapi.ipc.MyList.getMyListDir();  
                this.nico_mylist_store = new this.NicoMylistStore(mylist_dir);
                this.nico_mylist_image_cache = new this.NicoMylistImageCache(mylist_dir);

                const grid_container = this.root.querySelector(".mylist-grid");
                this.grid_table.init(grid_container);
                this.grid_table.setupResizer(".mylist-grid-container");
                this.grid_table.onDblClick(async (e, data)=>{
                    const video_id = data.id;
                    const video_item = await this.myapi.ipc.Library.getItem(video_id);
                    if(this.needConvertVideo(video_item)===true){      
                        const ret = await this.myapi.ipc.Dialog.showMessageBox({
                            message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                            okcancel: true
                        });
                        if(!ret){
                            return;
                        }
                        this.obs.trigger("library-page:convert-video", video_id);
                    }else{
                        this.Command.play(data, false);
                    }
                });
                this.grid_table.onButtonClick(async (e, cmd_id, data)=>{
                    if(cmd_id == "play"){
                        await this.play(data, false);
                    }
                    if(cmd_id == "stack"){
                        this.Command.addStackItems(this.obs, [data]);
                    }
                    if(cmd_id == "bookmark"){
                        this.Command.addBookmarkItems(this.obs, [data]);
                    }
                    if(cmd_id == "download"){
                        this.Command.addDownloadItems(this.obs, [data]);
                    }
                });
                
                this.grid_table.onContextMenu(async (e)=>{
                    const items = this.grid_table.getSelectedDatas();
                    if(items.length==0){
                        return;
                    }
                    const video_id = items[0].id;
                    const video_item = await this.myapi.ipc.Library.getItem(video_id);
                    const need_convert = this.needConvertVideo(video_item);
                    const context_menu_type = need_convert?"convert-video":"main";
                    const menu_id = await this.myapi.ipc.popupContextMenu("mylist", {context_menu_type, items});
                    if(!menu_id){
                        return;
                    }
                    if(menu_id=="convert-video"){
                        this.obs.trigger("library-page:convert-video", video_id); 
                    }
                });   

                this.modal_dialog = new ModalDialog(this.root, "mylist-md", {
                    obs:this.obs_modal_dialog
                });
            },
            async getMylistIDList() {
                const { items } = await this.obs.triggerReturn("mylist-page:sidebar:get-items");
                const mylist_id_list = items.map(item => {
                    return item.mylist_id;
                });
                return mylist_id_list;            
            },
            async existMylist(id) {
                const ids = await this.getMylistIDList();
                return ids.includes(id);
            },
            async play(item, online) {
                const video_id = item.id;
                const video_item = await this.myapi.ipc.Library.getItem(video_id);
                if(!online && this.needConvertVideo(video_item)){       
                    const ret = await this.myapi.ipc.Dialog.showMessageBox({
                        message: "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?",
                        okcancel: true
                    });
                    if(!ret){
                        return;
                    }
                    this.obs.trigger("library-page:convert-video", video_id);
                }else{
                    this.Command.play(item, online);
                }
            },
            getMylistID() {
                const elm = this.root.querySelector(".mylist-input");
                return elm.value;
            },
            setMylistID(id) {
                const elm = this.root.querySelector(".mylist-input");
                elm.value = id;
            },
            async hasMylistID(mylist_id) {
                const mylist_id_list = await this.getMylistIDList();
                return mylist_id_list.includes(mylist_id);
            },
            getIconClass() {
                if(this.is_current_fav){
                    return "fas fa-star fav-mark";
                }else{
                    return "far fa-star";
                }
            },
            async setMylist(mylist) {
                this.mylist_description = mylist.description;

                const mylist_id_list = await this.getMylistIDList();
                this.nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
                this.nico_mylist_image_cache.loadCache(mylist.mylist_id);

                if(await this.hasMylistID(mylist.mylist_id)){
                    this.is_current_fav = true;
                }else{
                    this.is_current_fav = false;
                }
                this.obs.trigger("mylist-page:sidebar:select-item", { mylist_id: mylist.mylist_id });
                this.update();

                this.setData(mylist);
            },
            async setData(mylist) {
                this.loaded_mylist_id = mylist.mylist_id;
                
                const mylist_items = mylist.items;
                const video_ids = await this.myapi.ipc.Download.getIncompleteIDs();
                for (let i=0; i<mylist_items.length; i++) {
                    const item = mylist_items[i];
                    const video_id = item.id;
                    item.saved = await this.myapi.ipc.Library.hasItem(video_id);
                    item.reg_download = video_ids.includes(video_id);  
                    item.mylist_id = mylist.mylist_id;
                }
                this.grid_table.clearSelected();
                this.grid_table.setData(mylist_items);
                this.grid_table.scrollToTop();   
            },
            async getMylist(mylist_id) {
                this.nico_mylist = new this.NicoMylist();
                const mylist = await this.nico_mylist.getMylist(mylist_id);
                await this.setMylist(mylist);
            },
            async addMylist(mylist) {
                if(!mylist){
                    return;
                }

                const mylist_id = mylist.mylist_id;

                if(await this.hasMylistID(mylist.mylist_id)){
                    return;
                }
    
                const item = {
                    title: mylist.title,
                    mylist_id: mylist_id,
                    creator: mylist.creator
                };
                this.obs.trigger("mylist-page:sidebar:add-item", item);
                this.nico_mylist_store.save(mylist_id, this.nico_mylist.xml);
            },
            cacheImage(mylist_id) {
                const elms = this.root.querySelectorAll(".mylist-img");
                elms.forEach(elm => {
                    this.nico_mylist_image_cache.setImage(mylist_id, elm);
                });
            },
            onCancelUpdate() {
                if(this.nico_mylist){
                    this.nico_mylist.cancel();
                }
            },
            async updateMylist() {
                if(this.modal_dialog.isOpend()){
                    return;
                }
                
                this.obs_modal_dialog.trigger("show", {
                    message: "更新中...",
                    buttons: ["cancel"],
                    cb: result=>{
                        this.onCancelUpdate();
                    }
                });
                
                try {
                    const mylist_id = this.getMylistID();
                    await this.getMylist(mylist_id);

                    const mylist_id_list = await this.getMylistIDList();
                    if(mylist_id_list.includes(mylist_id)){
                        this.nico_mylist_store.save(mylist_id, this.nico_mylist.xml);
                    }
                } catch (error) {
                    if(!error.cancel){
                        logger.error(error);
                        await this.myapi.ipc.Dialog.showMessageBox({
                            type: "error",
                            message: error.message
                        });
                    }
                }

                this.obs_modal_dialog.trigger("close");
            },
            async onkeydownUpdateMylist(e) { 
                if(e.target.value && e.keyCode===13){
                    await this.updateMylist();
                }
            },
            async onclickUpdateMylist(e) {  
                await this.updateMylist();
            },
            async onclickSaveMylist(e) {
                if(!this.nico_mylist){
                    return;
                }

                const mylist = this.nico_mylist.mylist;
                await this.addMylist(mylist);
                this.cacheImage(mylist.mylist_id);

                this.is_current_fav = true;
                this.update();
            }
        };
    </script>
</mylist-content>