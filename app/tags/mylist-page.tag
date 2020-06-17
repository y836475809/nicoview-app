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
            confirm={confirm}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const { remote } = window.electron;
        const {Menu} = remote;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs; 
        this.obs_listview = riot.observable();
        this.name = "mylist";
        this.items = [];
        this.confirm = ["delete"];

        this.on("mount", async () => {
            // TODO error対応
            const name = this.name;
            this.items = await IPCClient.request("bookmark", "getData", { name });
            this.obs_listview.trigger("loadData", { items:this.items });
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            this.items = items;

            const name = this.name;
            await IPCClient.request("bookmark", "update", { name, items });
        });

        const createMenu = (self) => {
            const menu_templete = [
                { 
                    label: "削除", click() {
                        self.obs_listview.trigger("deleteList");
                    }
                }
            ];
            return Menu.buildFromTemplate(menu_templete);
        };
        this.obs_listview.on("show-contextmenu", (e) => {
            const context_menu = createMenu(this);
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_listview.on("item-dlbclicked", (item) => {
            obs.trigger("mylist-page:item-dlbclicked", item);
        });
        
        this.obs_listview.on("items-deleted", (args) => {
            obs.trigger("mylist-page:items-deleted", args);
        });

        obs.on("mylist-page:sidebar:add-item", (args) => {
            const { title, mylist_id, creator, link } = args;
            const items = [
                { title, mylist_id, creator, link }
            ];
            this.obs_listview.trigger("addList", { items });
        });

        obs.on("mylist-page:sidebar:get-items", (args) => {
            const { cb } = args;
            cb({items:this.items});
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
            --margin: 5px;
        }

        .mylist-container {
            display: flex;
        }

        .mylist-label {
            margin-left: var(--margin);
            margin-right: var(--margin);
            user-select: none;
        }

        .mylist-input {
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

        .mylist-description {
            width: calc(100% - 10px);
            height: var(--description-height);
            white-space: pre-wrap;
            overflow-y: scroll;
            padding: 3px;
            border: 1px solid var(--control-border-color);
            margin: var(--margin);
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
        <div class="mylist-label center-hv">mylist /</div>
        <input class="mylist-input" type="text" onkeydown={onkeydownUpdateMylist}/>
        <div class="update-button center-hv" title="更新", onclick={onclickUpdateMylist}>
            <i class="fas fa-redo-alt"></i>
        </div>
        <div class="add-mylist-button center-hv" title="マイリストを保存" onclick={onclickSaveMylist}>
            <i class="far fa-star"></i>
        </div>
    </div>
    <div class="mylist-description">{mylist_description}</div>
    <div class="mylist-grid-container">
        <div class="mylist-grid"></div>
    </div>
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals riot logger */
        const path = window.path;
        const {remote, ipcRenderer} = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const { NicoMylist, NicoMylistStore, NicoMylistImageCache } = window.NicoMylist;
        const { BookMark } = window.BookMark;
        const { needConvertVideo } = window.VideoConverter;
        const { showOKCancelBox, showMessageBox } = window.RemoteDailog;
        const { IPCClient } = window.IPC;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await IPCClient.request("downloaditem", "getIncompleteIDs");
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await IPCClient.request("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);
                grid_table.dataView.updateItem(video_id, item);    
            }
        });

        ipcRenderer.on("libraryItemAdded", async (event, args) => {
            const {video_item} = args;
            const video_id = video_item.id;
            grid_table.updateCells(video_id, { saved:true });
        });

        ipcRenderer.on("libraryItemDeleted", async (event, args) => {
            const { video_id } = args;
            grid_table.updateCells(video_id, { saved:false });
        });
 
        this.mylist_description = "";

        let nico_mylist_image_cache = null;
        let nico_mylist_store = null;
        let nico_mylist = null;

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

        const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
            const mylist_id = dataContext.mylist_id;
            const url = value;
            return nico_mylist_image_cache.getImageHtml(mylist_id, url);
        };

        const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
            return `<div class="line-break">${value}</div>`;
        };
        const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
            const result = value.replace(/\r?\n/g, "<br>");
            return `<div>${result}</div>`;
        };
        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.id;
            const view_count = dataContext.view_count;
            const comment_count = dataContext.comment_count;

            let result = `<div>ID:${video_id}<br>
                            再生:${view_count.toLocaleString()}<br>
                            コメント:${comment_count.toLocaleString()}</div>`;
            if(dataContext.saved){
                result += "<div class='state-content state-saved'>ローカル</div>";
            }
            if(dataContext.reg_download){
                result += "<div class='state-content state-reg-download'>ダウンロード追加</div>";
            }
            return result;
        };
        const columns = [
            {id: "no", name: "#"},
            {id: "thumb_img", name: "サムネイル", width: 130, formatter:imageCacheFormatter},
            {id: "title", name: "名前", formatter:lineBreakFormatter},
            {id: "info", name: "情報", formatter:infoFormatter},
            {id: "description", name: "説明", formatter:htmlFormatter},
            {id: "date", name: "投稿日"},
            {id: "length", name: "時間"}
        ];
        const options = {
            rowHeight: 100,
            _saveColumnWidth: true,
        };    
        const grid_table = new GridTable("mylist-grid", columns, options);

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id: video_id,
                        time: 0
                    });
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
                }},
                { label: "後で見る", click() {
                    const items = grid_table.getSelectedDatas();
                    const stack_items = items.map(item => {
                        return {
                            id: item.id,
                            name: item.title, 
                            thumb_img:item.thumb_img
                        };
                    });
                    obs.trigger("play-stack-page:add-items", {items:stack_items});
                }},
                { type: "separator" },
                { label: "ダウンロードに追加", click() {
                    const items = grid_table.getSelectedDatas().map(value => {
                        return {
                            thumb_img: value.thumb_img,
                            id: value.id,
                            name: value.name,
                            state: 0
                        };
                    });
                    obs.trigger("download-page:add-download-items", items);
                }},
                { label: "ダウンロードから削除", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_ids = items.map(value => {
                        return value.id;
                    });
                    obs.trigger("download-page:delete-download-items", video_ids);
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.title, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const createConvertVideoMenu = () => {
            const menu_templete = [
                { label: "mp4に変換", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs.trigger("library-page:convert-video", video_id); 
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        this.on("mount", async () => {
            const mylist_dir = path.join(await IPCClient.request("config", "get", { key:"data_dir", value:"" }), "mylist");
            nico_mylist_store = new NicoMylistStore(mylist_dir);
            nico_mylist_image_cache = new NicoMylistImageCache(mylist_dir);

            grid_table.init(".mylist-grid");
            grid_table.setupResizer(".mylist-grid-container");
            grid_table.onDblClick(async (e, data)=>{
                const video_id = data.id;

                if(needConvertVideo(await IPCClient.request("library", "getItem", {video_id}))===true){
                    const result = await showOKCancelBox("info", 
                        "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?");
                    if(result!==0){
                        return;
                    }        
                    obs.trigger("library-page:convert-video", video_id);
                }else{
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                        video_id: video_id,
                        time: 0
                    });
                }
            });
            
            const context_menu = createMenu();
            const context_menu_cnv_video = createConvertVideoMenu();
            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas();
                const video_id = items[0].id;

                if(needConvertVideo(await IPCClient.request("library", "getItem", {video_id}))===true){
                    context_menu_cnv_video.popup({window: remote.getCurrentWindow()});
                }else{
                    context_menu.popup({window: remote.getCurrentWindow()});
                }
            });   
        });

        const getMylistID = () => {
            const elm = this.root.querySelector(".mylist-input");
            const value = elm.value;
            return value.replace("mylist/", "");
        };
        const setMylistID = (id) => {
            const elm = this.root.querySelector(".mylist-input");
            elm.value = id;
        };

        const setMylist = async (mylist) => {
            this.mylist_description = mylist.description;
            this.update();

            const mylist_id_list = await getMylistIDList();
            nico_mylist_image_cache.setExistLocalIDList(mylist_id_list);
            nico_mylist_image_cache.loadCache(mylist.mylist_id);

            setData(mylist);
        };

        const setData = async (mylist) => {
            const mylist_items = mylist.items;
            const video_ids = await IPCClient.request("downloaditem", "getIncompleteIDs");
            for (let i=0; i<mylist_items.length; i++) {
                const item = mylist_items[i];
                const video_id = item.id;
                item.saved = await IPCClient.request("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);  
                item.mylist_id = mylist.mylist_id;
            }
            grid_table.clearSelected();
            grid_table.setData(mylist_items);
            grid_table.scrollToTop();   
        };

        const updateMylist = async(mylist_id) => {
            nico_mylist = new NicoMylist();
            const mylist = await nico_mylist.getMylist(mylist_id);
            await setMylist(mylist);
        };

        const addMylist = (mylist) => {
            if(!mylist){
                return;
            }
            const title = `[${mylist.creator}] ${mylist.title}`;
            const mylist_id = mylist.mylist_id;
            const creator = mylist.creator;
            const link = mylist.link;   
            const item = {
                title,
                mylist_id,
                creator,
                link
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

        this.onkeydownUpdateMylist = async(e) => { 
            if(e.target.value && e.keyCode===13){
                await this.onclickUpdateMylist(e);
            }
        }; 

        this.onclickUpdateMylist = async(e) => {  
            this.obs_modal_dialog.trigger("show", {
                message: "更新中...",
                buttons: ["cancel"],
                cb: result=>{
                    onCancelUpdate();
                }
            });
            
            try {
                const mylist_id = getMylistID();
                await updateMylist(mylist_id);

                const mylist_id_list = await getMylistIDList();
                if(mylist_id_list.includes(mylist_id)){
                    nico_mylist_store.save(mylist_id, nico_mylist.xml);
                }
            } catch (error) {
                if(error.cancel===true){
                    logger.info("update mylist cancel");
                }else{
                    logger.error(error);
                    await showMessageBox("error", error.message);
                } 
            }

            this.obs_modal_dialog.trigger("close");
        };

        this.onclickSaveMylist = (e) => {
            if(!nico_mylist){
                return;
            }

            const mylist = nico_mylist.mylist;
            addMylist(mylist);
            cacheImage(mylist.mylist_id);
        };

        obs.on("mylist-page:item-dlbclicked", async (item) => {
            try {
                const mylist_id = item.mylist_id;
                const mylist = nico_mylist_store.load(mylist_id);
                setMylistID(mylist_id);
                await setMylist(mylist); 
            } catch (error) {
                logger.error(error);
                await showMessageBox("error", error.message);
            }
        });

        obs.on("mylist-page:load-mylist", async(mylist_id)=> {
            setMylistID(mylist_id);
            try {
                await updateMylist(mylist_id);
            } catch (error) {
                if(error.cancel===true){
                    logger.info(`load mylist cancel id=${mylist_id}`);
                }else{
                    logger.error(error);
                    await showMessageBox("error", error.message);
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