const { ipcRenderer} = require("electron");

const login = (mail, password) => {
    ipcRenderer.send("app:nico-login", {
        mail,
        password,
    });
};
const logout = () => {
    ipcRenderer.send("app:nico-login-cancel");
};

const getNicoLoginCookie = async () => {
    return await ipcRenderer.invoke("app:get-nico-login-cookie");
};
const setCookie = async (cookies) => {
    return await ipcRenderer.invoke("app:set-cookie", cookies);
};

const popupContextMenu = async (name, data) => {
    const channel = `app:popup-contextmenu-${name}`;
    return await ipcRenderer.invoke(channel, data);            
};

const onLoadContent = (func) => {
    ipcRenderer.on("app:on-load-content", (event, ...args)=>{
        func(...args);
    });
};

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

const onOpenVideoForm = (func) => {  
    ipcRenderer.on("app:open-video-form", (event, args)=>{
        func();
    });
};

const clearAppCache = async ()=>{
    return await ipcRenderer.invoke("setting:clear-app-cache");
};
const getAppCache = async ()=>{
    return await ipcRenderer.invoke("setting:get-app-cache");
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
    showMessageBox: async ({type="info", message="", okcancel=false}={}) => {
        return await ipcRenderer.invoke("app:show-message-box", {
            type: type,
            message: message,
            okcancel: okcancel
        });  
    },
    showSelectFolderDialog: async () => {
        return await ipcRenderer.invoke("app:show-select-folder-dialog");  
    },
    showSelectFileDialog: async ({name="All", exts=["*"], multi_select=false}) => {
        return await ipcRenderer.invoke("app:show-select-file-dialog", {
            name, exts, multi_select
        });  
    },
};

const Download = {
    getIncompleteIDs: async () => {  
        return await ipcRenderer.invoke("download:getIncompleteIDs");
    },
    getItems: async () => {  
        return await ipcRenderer.invoke("download:getItems");
    },
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("download:updateItems", {items});
    },

    onUpdateItem: (func) => {
        ipcRenderer.on("download:on-update-item", (event, args)=>{
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
    getItems: async ()=> {
        return await ipcRenderer.invoke("mylist:getItems");
    },
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("mylist:updateItems", {items});
    },
    load: (mylist_id)=>{
        ipcRenderer.send("app:load-mylist", mylist_id);
    },

    onLoad: (func) => {  
        ipcRenderer.on("app:load-mylist", (event, args)=>{
            func(args);
        });
    },
};

const PlayHistory = {
    addItem: (item)=>{
        ipcRenderer.send("history:addItem", {item});
    },
    getItems: async ()=>{
        return await ipcRenderer.invoke("history:getItems");
    },

    onUpdateItem: (func) => {  
        ipcRenderer.on("history:on-update-item", (event, args)=>{
            func();
        });
    },
};

const Shell = {
    openDir:async (dir)=>{
        return await ipcRenderer.invoke("setting:open-dir", {dir});
    },
};

const Setting = {
    reloadCSS:async (file_path)=>{
        return await ipcRenderer.invoke("setting:reload-css", {file_path});
    }, 
    setLogLevel:async (level)=>{
        return await ipcRenderer.invoke("setting:change-log-level", {level});
    }, 

    onReloadCSS: (func) => {  
        ipcRenderer.on("setting:on-reload-css", (event, args)=>{
            func();
        });
    },
    onChangeLogLevel: (func) => {  
        ipcRenderer.on("setting:on-change-log-level", (event, args)=>{
            func(args);
        });
    },
};

const Stack = {
    getItems: async ()=>{
        return await ipcRenderer.invoke("stack:getItems");
    },
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("stack:updateItems", {items});
    },
    addItems: (items)=>{
        ipcRenderer.send("app:add-stack-items", {items});
    },

    onAddItems: (func)=>{
        ipcRenderer.on("app:add-stack-items", (event, args)=>{
            func(args);
        });
    }
};

const Bookmark = {
    addItems: (items)=>{
        ipcRenderer.send("app:add-bookmarks", items);
    },
    getItems: async ()=>{
        return await ipcRenderer.invoke("bookmark:getItems");
    },
    updateItems: async (items) => {  
        return await ipcRenderer.invoke("bookmark:updateItems", {items});
    },

    onAddItems: (func) => {
        ipcRenderer.on("app:add-bookmarks", (event, args)=>{
            func(args);
        });
    }
};

const Search = {
    getItems: async ()=>{
        return await ipcRenderer.invoke("nico-search:getItems");
    },
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
    getItem: async (video_id)=>{
        return await ipcRenderer.invoke("library:getItem", {video_id});
    },
    addItem: async (item) => {  
        return await ipcRenderer.invoke("library:addItem", {item});
    },
    deleteItem: async (video_id) => {  
        return await ipcRenderer.invoke("library:deleteItem", {video_id});
    },
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

    getSearchItems: async () => {
        return await ipcRenderer.invoke("library-search:getItems");
    },
    
    updateSearchItems: async (items) => {  
        return await ipcRenderer.invoke("library-search:updateItems", {items});
    },

    onInit: (func) => {
        ipcRenderer.on("library:on-init", (event, args)=>{
            func(args);
        });
    },
    onAddItem: (func) => {
        ipcRenderer.on("library:on-add-item", (event, args)=>{
            func(args);
        });
    },
    onDeleteItem: (func) => {
        ipcRenderer.on("library:on-delete-item", (event, args)=>{
            func(args);
        });
    },
    onUpdateItem: (func) => {
        ipcRenderer.on("library:on-update-item", (event, args)=>{
            func(args);
        });
    },
};

const myapi = {
    ipc: {
        login,
        logout,
        getNicoLoginCookie,
        setCookie,
        popupContextMenu,
        onLoadContent,
        onPlayVideo,
        playerReady,
        showyPlayer,
        onOpenVideoForm,
        clearAppCache,
        getAppCache,

        Config,
        Dialog,
        Download,
        NGList,
        MyList,
        PlayHistory,
        Shell,
        Setting,
        Stack,
        Bookmark,
        Search,
        Library,
    }
};

module.exports = myapi;