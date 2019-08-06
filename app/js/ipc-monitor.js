const EventEmitter = require("events");
const { remote, ipcRenderer, ipcMain } = require("electron");

const IPCRenderMsg =  Object.freeze({   
    PLAY_BY_VIDEO_ID: "ipc-play-by-video-id",
    GET_PLAY_DATA: "ipc-get-play-data",
    GET_PLAY_DATA_REPLY: "ipc-get-play-data-reply",

    SEARCH_TAG: "ipc-search-tag",
    LOAD_MYLIST: "ipc-load-mylist",
    ADD_DOWNLOAD_ITEM: "ipc-add-download-item",
    ADD_PLAY_HISTORY: "ipc-add-play-history",

    UPDATE_DATA: "ipc-update-data",
    RETURN_UPDATE_DATA: "ipc-return-update-data",
    CANCEL_UPDATE_DATA: "ipc-cancel-update-data",
    ADD_BOOKMARK: "ipc-add-bookmark"
});

class IPCRender extends EventEmitter {
    get IPCMsg(){
        return IPCRenderMsg;
    }   

    sendMain(msg, args){
        const win = remote.getGlobal("main_window");
        win.webContents.send(msg, args);
    } 
    
    sendPlayer(msg, args){
        const win = remote.getGlobal("player_window");
        win.webContents.send(msg, args);
    }   
}

class IPCRenderMonitor extends EventEmitter {
    constructor(){
        super();
    }

    get IPCMsg(){
        return IPCRenderMsg;
    }   

    listen(){
        for (const key in IPCRenderMsg) {
            if (IPCRenderMsg.hasOwnProperty(key)) {
                const msg = IPCRenderMsg[key];
                ipcRenderer.on(msg, (event, args) => {
                    this.emit(msg, event, args); 
                });
            }
        }
    }
}

const IPCMainMsg =  Object.freeze({     
    SHOW_PLAYER_SYNC: "ipc-show-player",
    SET_COOKIE_SYNC: "ipc-set-cookie",
    SET_PLAYER_PATH: "ipc-set-player-path",
});

class IPCMain extends EventEmitter {
    constructor(){
        super();
    }

    get IPCMsg(){
        return IPCMainMsg;
    }   

    send(msg, args){
        ipcRenderer.send(msg, args);
    } 
    
    sendSync(msg, args){
        return ipcRenderer.sendSync(msg, args);
    }  
}

class IPCMainMonitor extends EventEmitter {
    constructor(){
        super();
    }

    get IPCMsg(){
        return IPCMainMsg;
    }

    listen(){
        for (const key in IPCMainMsg) {
            if (IPCMainMsg.hasOwnProperty(key)) {
                const msg = IPCMainMsg[key];
                ipcMain.on(msg, (event, args) => {
                    this.emit(msg, event, args); 
                });
            }
        }
    }
}

module.exports = {
    IPCRender,
    IPCRenderMonitor,
    IPCMain,
    IPCMainMonitor
};