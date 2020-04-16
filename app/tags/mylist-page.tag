<mylist-sidebar>
    <style scoped>
        .nico-mylist-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-mylist-sidebar">
        <accordion 
            title="マイリスト" 
            expand={true} 
            obs={obs_accordion}
            name={name}>
        </accordion>
    </div>

    <script>
        /* globals riot */
        const { remote } = window.electron;
        const {Menu} = remote;
        const { DataIpcRenderer } = window.DataIpc;

        const obs = this.opts.obs; 
        this.obs_accordion = riot.observable();
        this.name = "mylist";
        let hasItem = (mylist_id) => false;

        this.on("mount", async () => {
            // TODO error対応
            const name = this.name;
            const items = await DataIpcRenderer.action("bookmark", "getData", { name });
            this.obs_accordion.trigger("loadData", { items });

            hasItem = (mylist_id) => {
                return items.some(value=>{
                    return value.mylist_id == mylist_id;
                });
            };
        });

        this.obs_accordion.on("changed", async (args) => {
            const { items } = args;

            hasItem = (mylist_id) => {
                return items.some(value=>{
                    return value.mylist_id == mylist_id;
                });
            };

            const name = this.name;
            await DataIpcRenderer.action("bookmark", "update", { name, items });
        });

        const createMenu = (self) => {
            const nemu_templete = [
                { 
                    label: "削除", click() {
                        self.obs_accordion.trigger("deleteList");
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        this.obs_accordion.on("show-contextmenu", (e) => {
            const context_menu = createMenu(this);
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        this.obs_accordion.on("item-dlbclicked", (item) => {
            obs.trigger("mylist-page:item-dlbclicked", item);
        });
        
        obs.on("mylist-page:sidebar:add-item", (args) => {
            const { title, mylist_id, creator, link } = args;
            const items = [
                { title, mylist_id, creator, link }
            ];
            this.obs_accordion.trigger("addList", { items });
        });

        obs.on("mylist-page:sidebar:has-item", (args) => {
            const {mylist_id, cb} = args;
            cb(hasItem(mylist_id));
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
            margin-top: var(--margin);
        }

        .mylist-label {
            margin-right: 5px;
            user-select: none;
        }

        .mylist-input {
            font-size: 1.2em;
            border-width: 1px;
            border-right-width: 0px !important;
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
            background-color: white; 

            border-width: 1px;
            border-left-width: 0px !important;
            border-style: solid;
            border-color: gray;
        }

        .add-mylist-button {
            width: var(--control-height);
            height: var(--control-height);
            background-color: rgba(0, 0, 0, 0);
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
            height: calc(100vh - var(--description-height) 
                - var(--control-height) - var(--margin) * 2);
            overflow: hidden;
        }
    </style>      

    <div class="mylist-container">
        <div class="mylist-label center-hv">mylist/</div><input class="mylist-input" type="text"/>
        <div class="update-button center-hv" title="更新", onclick={onclickUpdateMylist}>
            <i class="fas fa-redo-alt"></i>
        </div>
        <div class="add-mylist-button center-hv" title="マイリストを保存" onclick={onclickAddMylist}>
            <i class="fas fa-plus"></i>
        </div>
    </div>
    <div class="mylist-description">{this.mylist_description}</div>
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
        const { NicoMylist, NicoMylistStore } = window.NicoMylist;
        const { CacheStore } = window.CacheStore;
        const { BookMark } = window.BookMark;
        const { needConvertVideo } = window.VideoConverter;
        const { showOKCancelBox, showMessageBox } = window.RemoteDailog;
        const { DataIpcRenderer } = window.DataIpc;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        ipcRenderer.on("downloadItemUpdated", async (event) => {
            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            const items = grid_table.dataView.getItems();

            for (let i=0; i<items.length; i++) {
                const item = items[i];
                const video_id = item.id;
                item.saved = await DataIpcRenderer.action("library", "existItem", {video_id});
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

        let image_cache = null;
        let nico_mylist_store = null;
        let nico_mylist = null;

        let is_local_item = false;

        const hasLocalItem = () => {
            const mylist_id = getMylistID();
            return new Promise( (resolve, reject) => {
                const cb = (has) =>{
                    resolve(has);
                };
                obs.trigger("mylist-page:sidebar:has-item", {mylist_id, cb});
            });
        };

        const getBase64 = (img, width, height) => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            // ctx.drawImage(img, 0, 0);
            ctx.drawImage(img, 0, 0, width, height);
            const data = canvas.toDataURL("image/jpeg");
            return data;
        };

        const imageCacheFormatter = (row, cell, value, columnDef, dataContext)=> {
            if(is_local_item){
                const image = new Image();
                if(image_cache.has(value)){
                    image.src = image_cache.get(value);    
                }else{
                    image.onload = (e) => {
                        const org_width = e.target.width;
                        const org_height = e.target.height;
                        const width = 130;
                        const height = org_height * (width / org_width);
                        const data = getBase64(e.target, width, height);
                        image_cache.set(value, data);     
                    };
                    image.src = value;
                }
                image.classList.add("gridtable-thumbnail", "mylist-img");
                return image.outerHTML;
            }else{
                return `<img src="${value}" 
                    class="gridtable-thumbnail mylist-img"/>`;
            }
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
            const nemu_templete = [
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
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    const bk_items = items.map(item => {
                        return BookMark.createVideoItem(item.title, item.id);
                    });
                    obs.trigger("bookmark-page:add-items", bk_items);
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        const createConvertVideoMenu = () => {
            const nemu_templete = [
                { label: "mp4に変換", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs.trigger("library-page:convert-video", video_id); 
                }}
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.on("mount", async () => {
            const mylist_dir = path.join(await DataIpcRenderer.action("config", "get", { key:"data_dir", value:"" }), "mylist");
            image_cache = new CacheStore(mylist_dir, "image-cache.json");
            nico_mylist_store = new NicoMylistStore(mylist_dir);

            grid_table.init(this.root.querySelector(".mylist-grid"));
            grid_table.onDblClick(async (e, data)=>{
                const video_id = data.id;

                if(needConvertVideo(await DataIpcRenderer.action("library", "getItem", {video_id}))===true){
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

                if(needConvertVideo(await DataIpcRenderer.action("library", "getItem", {video_id}))===true){
                    context_menu_cnv_video.popup({window: remote.getCurrentWindow()});
                }else{
                    context_menu.popup({window: remote.getCurrentWindow()});
                }
            });

            resizeGridTable();
            try {
                image_cache.load();
            } catch (error) {
                logger.error(error);
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
            setData(items);
        };

        const setData = async (mylist_items) => {
            const video_ids = await DataIpcRenderer.action("downloaditem", "getIncompleteIDs");
            for (let i=0; i<mylist_items.length; i++) {
                const item = mylist_items[i];
                const video_id = item.id;
                item.saved = await DataIpcRenderer.action("library", "existItem", {video_id});
                item.reg_download = video_ids.includes(video_id);     
            }
            grid_table.setData(mylist_items);
            grid_table.scrollToTop();   
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

        const getImageCache = () => {
            const elms = this.root.querySelectorAll(".mylist-img");
            elms.forEach(elm => {
                const src = elm.src;
                const data = getBase64(elm);
                image_cache.set(src, data);
            });
        };

        const onCancelUpdate = () => {
            if(nico_mylist){
                nico_mylist.cancel();
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
                is_local_item = await hasLocalItem();
                const mylist_id = getMylistID();
                await updateMylist(mylist_id);
                if(is_local_item){
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

        this.onclickAddMylist = (e) => {
            const mylist = nico_mylist.mylist;
            addMylist(mylist);
            getImageCache();
        };

        obs.on("mylist-page:item-dlbclicked", async (item) => {
            is_local_item = true;

            try {
                const mylist_id = item.mylist_id;
                const mylist = nico_mylist_store.load(mylist_id);
                setMylistID(mylist_id);
                setMylist(mylist); 
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

        obs.on("window-resized", ()=> {
            resizeGridTable();
        });

        window.onbeforeunload = (e) => {
            image_cache.save();
        };
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