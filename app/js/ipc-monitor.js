const EventEmitter = require("events");
const { remote, ipcRenderer, ipcMain } = require("electron");

const IPCMsg =  Object.freeze({   
    PLAY_BY_ID: "ipc-play-by-id",
    PLAY_LIBRARY: "ipc-play-library",
    PLAY_NICONICO: "ipc-play-niconico",
    
    SHOW_PLAYER_SYNC: "ipc-show-player",
    SET_COOKIE_SYNC: "ipc-set-cookie",

    SEARCH_TAG: "ipc-search-tag",
});


class IPCMonitor extends EventEmitter {
    constructor(){
        super();
    }

    playByID(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.PLAY_BY_ID, args);
    }

    playLibrary(args){
        const win = remote.getGlobal ("player_window");
        win.webContents.send(IPCMsg.PLAY_LIBRARY, args);
    }

    playNiconico(args){
        const win = remote.getGlobal ("player_window");
        win.webContents.send(IPCMsg.PLAY_NICONICO, args);
    }

    searchTag(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.SEARCH_TAG, args);
    }

    showPlayerSync(args) {
        ipcRenderer.sendSync(IPCMsg.SHOW_PLAYER_SYNC, args);
    }

    setCookieSync(cookies){
        return ipcRenderer.sendSync(IPCMsg.SET_COOKIE_SYNC, cookies);
    }

    listenMain(){
        ipcMain.on(IPCMsg.SHOW_PLAYER_SYNC, (event, args) => {
            this.emit(IPCMsg.SHOW_PLAYER_SYNC, event, args); 
        });

        ipcMain.on(IPCMsg.SET_COOKIE_SYNC, (event, args) => {
            this.emit(IPCMsg.SET_COOKIE_SYNC, event, args); 
        });
    }

    listenRemote(){
        ipcRenderer.on(IPCMsg.PLAY_BY_ID, (event, args) => {
            this.emit(IPCMsg.PLAY_BY_ID, event, args); 
        });

        ipcRenderer.on(IPCMsg.PLAY_LIBRARY, (event, args) => {
            this.emit(IPCMsg.PLAY_LIBRARY, event, args); 
        });

        ipcRenderer.on(IPCMsg.PLAY_NICONICO, (event, args) => {
            this.emit(IPCMsg.PLAY_NICONICO, event, args); 
        });

        ipcRenderer.on(IPCMsg.SEARCH_TAG, (event, args) => {
            this.emit(IPCMsg.SEARCH_TAG, event, args); 
        });
    }
}

module.exports = {
    IPCMsg,
    IPCMonitor
};