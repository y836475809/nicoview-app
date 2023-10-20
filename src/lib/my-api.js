const { ipcRenderer} = require("electron");
const path = require("path");
const fs = require("fs");

const getUserAgent = () => {
    return process.env["user_agent"];
};

/**
 * 
 * @param {string} name 
 * @param {*} data 
 * @returns {Promise<string>}
 */
const popupContextMenu = async (name, data) => {
    const channel = `app:popup-contextmenu-${name}`;
    return await ipcRenderer.invoke(channel, data);            
};

/**
 * 
 * @param {function({
 *      video_id:string, online:boolean, time:number, video_item:LibraryItem}
 * ):void} func 
 */
const onPlayVideo = (func) => {  
    ipcRenderer.on("app:play-video", (event, args)=>{
        func(args);
    });
};

const playerReady = () => {
    ipcRenderer.send("app:player-ready");
};

const showyPlayer = () => {
    ipcRenderer.send("app:show-player");
};

const Config = {
    get: async (key, default_value) => {
        return await ipcRenderer.invoke("config:get", {
            key: key, 
            value: default_value
        });      
    },
    set: async (key, value) => {
        return await ipcRenderer.invoke("config:set", { 
            key: key, 
            value: value 
        });     
    }
};

const Dialog = {
    /**
     * 
     * @param {{
     *  type:"info"|"error"|"warning", 
     *  message:string
     * }} param0 
     * @returns {Promise<boolean>} true:ok false:cancel
     */
    showMessageBoxOK: async ({type="info", message=""}) => {
        return await ipcRenderer.invoke("app:show-message-box", {
            type: type,
            message: message,
            okcancel: false
        });  
    },
    /**
     * 
     * @param {{
     *  type:"info"|"error"|"warning", 
     *  message:string
     * }} param0 
     * @returns {Promise<boolean>} true:ok false:cancel
     */
    showMessageBoxOkCancel: async ({type="info", message=""}) => {
        return await ipcRenderer.invoke("app:show-message-box", {
            type: type,
            message: message,
            okcancel: true
        });  
    },
    /**
     * @async
     * @returns {Promise<string>}
     */
    showSelectFolderDialog: async () => {
        return await ipcRenderer.invoke("app:show-select-folder-dialog");  
    },
    /**
     * @async
     * @param {{name:string, exts:string[], multi_select:boolean}} param0 
     * @returns {Promise.<string|string[]>}
     */
    showSelectFileDialog: async ({name="All", exts=["*"], multi_select=false}) => {
        return await ipcRenderer.invoke("app:show-select-file-dialog", {
            name, exts, multi_select
        });  
    },
};

const Download = {
    /**
     * 
     * @returns {Promise<string[]>}
     */
    getIncompleteIDs: async () => {  
        return await ipcRenderer.invoke("download:getIncompleteIDs");
    },
    /**
     * 
     * @returns {Promise<RegDownloadItem[]>}
     */
    getItems: async () => {  
        return await ipcRenderer.invoke("download:getItems");
    },
    /**
     * 
     * @param {RegDownloadItem[]} items 
     * @returns {Promise<void>}
     */
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("download:updateItems", {items});
    },

    onUpdateItem: (func) => {
        ipcRenderer.on("download:on-update-item", (event, args)=>{ // eslint-disable-line no-unused-vars
            func();
        });
    },
    onDeleteItems: (func) => {  
        ipcRenderer.on("app:delete-download-items", (event, args)=>{
            func(args);
        });
    },
    onAddItems: (func) => {  
        ipcRenderer.on("app:add-download-items", (event, args)=>{
            func(args);
        });
    },
};

const NGList = {
    getItems: async ()=> {
        return await ipcRenderer.invoke("nglist:getItems");
    },
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("nglist:updateItems", {items});
    },
};

const MyList = {
    /**
     * 
     * @returns {Promise<string>}
     */
    getMyListDir: async () => {
        return path.join(await Config.get("data_dir", ""), "mylist");
    },
    /**
     * 
     * @returns {Promise<MyListIndexItem[]>}
     */
    getItems: async ()=> {
        return await ipcRenderer.invoke("mylist:getItems");
    },
    /**
     * 
     * @param {MyListIndexItem[]} items 
     * @returns {Promise<void>}
     */
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("mylist:updateItems", {items});
    },
    /**
     * 
     * @param {string} mylist_id 
     */
    load: (mylist_id)=>{
        ipcRenderer.send("app:load-mylist", mylist_id);
    },

    onLoad: (func) => {  
        ipcRenderer.on("app:load-mylist", (event, args)=>{
            func(args);
        });
    },
};

const History = {
    addItem: (item)=>{
        ipcRenderer.send("history:addItem", {item});
    },
    /**
     * 
     * @returns {Promise<HistoryItem[]>}
     */
    getItems: async ()=>{
        return await ipcRenderer.invoke("history:getItems");
    },

    onUpdateItem: (func) => {  
        ipcRenderer.on("history:on-update-item", (event, args)=>{ // eslint-disable-line no-unused-vars
            func();
        });
    },
};

const Setting = {
    getAppDataPath : async () => {
        const data_dir = await Config.get("data_dir", "");
        if(data_dir==""){
            throw new Error("データの保存先が設定されていない");
        }
        try {
            await fs.promises.access(data_dir);
            return data_dir;
        } catch (error) {
            throw new Error(`データの保存先 "${data_dir}" が見つからない\n${error.message}`);
        }  
    },
    getNNDDSystemPath : async () => {
        const system_dir = await Config.get("nndd.system_path", "");
        if(system_dir==""){
            throw new Error("NNDDのシステムパスが設定されていない");
        }
        try {
            await fs.promises.access(system_dir);
            return system_dir;
        } catch (error) {
            throw new Error(`NNDDのシステムパス "${system_dir}" が見つからない\n${error.message}`);
        }  
    },
    /**
     * 
     * @param {function({level:string})} func 
     */
    onChangeLogLevel: (func) => {  
        ipcRenderer.on("setting:on-change-log-level", (event, args)=>{
            func(args);
        });
    },
};

const Stack = {
    /**
     * 
     * @returns {Promise<StackItem[]>}
     */
    getItems: async ()=>{
        return await ipcRenderer.invoke("stack:getItems");
    },
    /**
     * 
     * @param {StackItem[]} items 
     * @returns {Promise<void>}
     */
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("stack:updateItems", {items});
    },
    /**
     * 
     * @param {StackItem[]} items 
     */
    addItems: (items)=>{
        ipcRenderer.send("app:add-stack-items", {items});
    },

    /**
     * 
     * @param {function({items:StackItem[]})} func 
     */
    onAddItems: (func)=>{
        ipcRenderer.on("app:add-stack-items", (event, args)=>{
            func(args);
        });
    }
};

const Bookmark = {
    /**
     * 
     * @param {BookmarkItem[]} items 
     */
    addItems: (items)=>{
        ipcRenderer.send("app:add-bookmarks", items);
    },
    /**
     * 
     * @returns {Promise<BookmarkItem[]>}
     */
    getItems: async ()=>{
        return await ipcRenderer.invoke("bookmark:getItems");
    },
    /**
     * 
     * @param {BookmarkItem[]} items 
     * @returns {Promise<void>}
     */
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("bookmark:updateItems", {items});
    },

    /**
     * 
     * @param {function(BookmarkItem):void} func 
     */
    onAddItems: (func) => {
        ipcRenderer.on("app:add-bookmarks", (event, args)=>{
            func(args);
        });
    }
};

const Search = {
    /**
     * 
     * @returns {Promise<NicoSearchParamsItem[]>}
     */
    getItems: async ()=>{
        return await ipcRenderer.invoke("nico-search:getItems");
    },
    /**
     * 
     * @param {NicoSearchParamsItem[]} items 
     * @returns {Promise<void>}
     */
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("nico-search:updateItems", {items});
    },
    searchTag: (param) => {
        ipcRenderer.send("app:search-tag", param);
    },

    onSearchTag: (func) => {
        ipcRenderer.on("app:search-tag", (event, args)=>{
            func(args);
        });
    }
};

const Library = {
    load: async () => {
        return await ipcRenderer.invoke("library:load");
    },
    /**
     * 
     * @param {string} video_id 
     * @returns {Promise<LibraryItem>}
     */
    getItem: async (video_id)=>{
        return await ipcRenderer.invoke("library:getItem", {video_id});
    },
    /**
     * 
     * @param {LibraryItem} item 
     * @returns {Promise<void>}
     */
    addItem: async (item) => {  
        return await ipcRenderer.invoke("library:addItem", {item});
    },
    /**
     * 
     * @param {string} video_id 
     * @returns {Promise<{success:boolean,error:Error}>}
     */
    deleteItem: async (video_id) => {  
        return await ipcRenderer.invoke("library:deleteItem", {video_id});
    },
    /**
     * 
     * @param {string} video_id 
     * @returns {Promise<boolean>} true:has
     */
    hasItem: async (video_id) => {  
        return await ipcRenderer.invoke("library:has", {video_id});
    },
    updateItemProps: async (video_id, props) => {  
        return await ipcRenderer.invoke("library:updateItemProps", {video_id, props});
    },

    // TODO move download
    addDownloadItem: async (download_item) => {
        return await ipcRenderer.invoke("library:addDownloadItem", {download_item});
    },

    /**
     * 
     * @returns {Promise<LibrarySearchItem[]>}
     */
    getSearchItems: async () => {
        return await ipcRenderer.invoke("library-search:getItems");
    },
    
    /**
     * 
     * @param {LibrarySearchItem[]} items 
     * @returns {Promise<void>}
     */
    updateSearchItems: async (items) => {  
        return await ipcRenderer.invoke("library-search:updateItems", {items});
    },

    /**
     * 
     * @param {function({items:LibraryItem[]})} func 
     */
    onInit: (func) => {
        ipcRenderer.on("library:on-init", (event, args)=>{
            func(args);
        });
    },
    /**
     * 
     * @param {function({video_item:LibraryItem}):void} func 
     */
    onAddItem: (func) => {
        ipcRenderer.on("library:on-add-item", (event, args)=>{
            func(args);
        });
    },
    /**
     * 
     * @param {function({video_id:string}):void} func 
     */
    onDeleteItem: (func) => {
        ipcRenderer.on("library:on-delete-item", (event, args)=>{
            func(args);
        });
    },
    /**
     * 
     * @param {function({video_id:string, props:{}}):void} func 
     */
    onUpdateItem: (func) => {
        ipcRenderer.on("library:on-update-item", (event, args)=>{
            func(args);
        });
    },
};

const UserIconCache = {
    /**
     * 
     * @param {string} img_url 
     * @returns {Promise<string>}
     */
    get: async (img_url) => {
        return await ipcRenderer.invoke("user-icon:get", { img_url });
    },
    set: (img_url, base64) => {  
        ipcRenderer.send("user-icon:set", { img_url, base64 });
    },
    has: async (img_url) => {
        return await ipcRenderer.invoke("user-icon:has", { img_url });
    },
    enable: async () => {
        return await ipcRenderer.invoke("user-icon:enable");
    },
};

const myapi = {
    getUserAgent,
    
    ipc: {
        popupContextMenu,
        // onLoadContent,
        onPlayVideo,
        playerReady,
        showyPlayer,

        Config,
        Dialog,
        Download,
        NGList,
        MyList,
        History,
        Setting,
        Stack,
        Bookmark,
        Search,
        Library,
        UserIconCache,
    }
};

module.exports = myapi;