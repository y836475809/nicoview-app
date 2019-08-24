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
            storname={storname}>
        </accordion>
    </div>

    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const obs = this.opts.obs; 
        this.obs_accordion = riot.observable();
        this.storname = "mylist";
        const store = this.riotx.get(this.storname);

        this.on("mount", () => {
            const file_path = SettingStore.getSettingFilePath(`${this.storname}.json`);
            try {
                this.json_store = new JsonStore(file_path);
                const items = this.json_store.load();
                store.commit("loadData", {items});
            } catch (error) { 
                const items = [];
                store.commit("loadData", {items});
                console.log(error);
            }
        });
        
        store.change("changed", (state, store) => {
            this.json_store.save(state.items);
        });

        const hasItem = (mylist_id) => {
            const items = store.getter("state").items;
            return items.some(value=>{
                return value.mylist_id == mylist_id;
            });
        };

        const createMenu = () => {
            const nemu_templete = [
                { 
                    label: "削除", click() {
                        store.action("deleteList");
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        this.obs_accordion.on("show-contextmenu", (e) => {
            const context_menu = createMenu();
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
            store.action("addList", {items});
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

        .mylist-label {
            margin-right: 5px;
            user-select: none;
        }

        .update-button {
            margin-left: 1px;
            width: 60px;
        }

        .add-mylist-button {
            margin-left: 30px;
            width: 30px;
            height: var(--control-height);
        }
        .add-mylist-button > i {
            font-size: 24px;
        }

        .mylist-description {
            width: calc(100% - 10px);
            height: var(--description-height);
            white-space: pre-wrap;
            overflow-y: scroll;
            padding: 3px;
            border: 1px solid var(--control-border-color);
            margin: var(--margin);
        }

        .mylist-grid-container {
            width: 100%;
            height: calc(100vh - var(--description-height) 
                - var(--control-height) - var(--margin) * 2);
            overflow: hidden;
        }
    </style>      

    <div style="display:flex;">
        <div class="mylist-label center-hv">mylist/</div><input class="mylist-input" type="text"/>
        <button class="update-button" onclick={onclickUpdateMylist}>更新</button>
        <button class="add-mylist-button center-hv" title="マイリストに追加" onclick={onclickAddMylist}>
            <i class="fas fa-plus"></i>
        </button>
    </div>
    <div class="mylist-description">{this.mylist_description}</div>
    <div class="mylist-grid-container">
        <div class="mylist-grid"></div>
    </div>
    <modal-dialog obs={obs_modal_dialog}></modal-dialog>

    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const { Menu } = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { GridTable } = require(`${app_base_dir}/js/gridtable`);
        const { NicoMylist, NicoMylistStore } = require(`${app_base_dir}/js/nico-mylist`);
        const { CacheStore } = require(`${app_base_dir}/js/cache-store`);
        const { BookMark } = require(`${app_base_dir}/js/bookmark`);
        const { obsTrigger } = require(`${app_base_dir}/js/riot-obs`);
        const { needConvertVideo } = require(`${app_base_dir}/js/library-obs`);
        const { showOKCancelBox } = require(`${app_base_dir}/js/remote-dialogs`);

        const obs = this.opts.obs; 
        this.obs_modal_dialog = riot.observable();

        const obs_trigger = new obsTrigger(obs);

        this.mylist_description = "";

        const image_cache = new CacheStore(
            SettingStore.getMylistDir(), "image-cache.json");

        const nico_mylist_store = new NicoMylistStore(()=>{
            return SettingStore.getMylistDir();
        });
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
                    // console.log("cache value=", value);
                    image.src = image_cache.get(value);    
                }else{
                    image.onload = (e) => {
                        // console.log("onload value=", value);
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
                // console.log("img value=", value);
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
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    const video_id = items[0].id;
                    obs_trigger.playOnline(obs_trigger.Msg.MAIN_PLAY, video_id); 
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

        // TODO
        this.on("mount", async () => {
            grid_table.init(this.root.querySelector(".mylist-grid"));
            grid_table.onDblClick(async (e, data)=>{
                const video_id = data.id;

                if(await needConvertVideo(obs, video_id)===true){
                    const result = await showOKCancelBox("info", 
                        "保存済み動画がmp4ではないため再生できません\nmp4に変換しますか?");
                    if(result!==0){
                        return;
                    }        
                    obs.trigger("library-page:convert-video", video_id);
                }else{
                    obs_trigger.play(obs_trigger.Msg.MAIN_PLAY, video_id); 
                }
            });
            
            // TODO
            const context_menu = createMenu();
            const context_menu_cnv_video = createConvertVideoMenu();
            grid_table.onContextMenu(async (e)=>{
                const items = grid_table.getSelectedDatas();
                const video_id = items[0].id;

                if(await needConvertVideo(obs, video_id)===true){
                    context_menu_cnv_video.popup({window: remote.getCurrentWindow()});
                }else{
                    context_menu.popup({window: remote.getCurrentWindow()});
                }
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
            setData(items);
        };

        const setData = async (mylist_items) => {
            const video_ids = mylist_items.map(value => {
                return value.id;
            });

            const download_id_set = await new Promise((resolve, reject) => {
                obs.trigger("download-page:get-data-callback", (id_set)=>{
                    resolve(id_set);
                });
            });

            obs.trigger("library-page:get-video-ids-callback", { video_ids: video_ids, cb: (video_id_set)=>{
                mylist_items.forEach(value=>{
                    const saved = video_id_set.has(value.id);
                    const reg_download = download_id_set.has(value.id);
                    value.saved = saved;
                    value.reg_download = reg_download;
                });
                grid_table.setData(mylist_items);
                grid_table.scrollToTop();   
            }});
        };

        const updateMylist = async(mylist_id) => {
            nico_mylist = new NicoMylist();
            try {
                const mylist = await nico_mylist.getMylist(mylist_id);
                setMylist(mylist);    
            } catch (error) {
                if(error.cancel===true){
                    console.log("cancel mylist");
                }else{
                    console.log(error);
                }
            }
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
            
            is_local_item = await hasLocalItem();
            const mylist_id = getMylistID();
            await updateMylist(mylist_id);
            if(is_local_item){
                nico_mylist_store.save(mylist_id, nico_mylist.xml);
            }

            this.obs_modal_dialog.trigger("close");
        };

        this.onclickAddMylist = (e) => {
            const mylist = nico_mylist.mylist;
            addMylist(mylist);
            getImageCache();
        };

        obs.on("mylist-page:item-dlbclicked", (item) => {
            is_local_item = true;

            const mylist_id = item.mylist_id;
            const mylist = nico_mylist_store.load(mylist_id);

            setMylistID(mylist_id);
            setMylist(mylist);
        });

        obs.on("mylist-page:load-mylist", async(mylist_id)=> {
            setMylistID(mylist_id);
            await updateMylist(mylist_id);
        });

        obs.on("mylist-page:add-download-video-ids", (video_ids)=> {
            video_ids.forEach(video_id => {
                const item = grid_table.dataView.getItemById(video_id);
                item.reg_download = true;
                grid_table.dataView.updateItem(video_id, item);
            });
            grid_table.grid.render();
        });

        obs.on("mylist-page:delete-download-video-ids", (video_ids)=> {
            if(grid_table.dataView.getLength()===0){
                return;
            }
            video_ids.forEach(video_id => {
                const item = grid_table.dataView.getItemById(video_id);
                if(item!==undefined){
                    item.reg_download = false;
                    grid_table.dataView.updateItem(video_id, item);
                }
            });
            grid_table.grid.render();
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