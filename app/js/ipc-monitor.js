const EventEmitter = require("events");
const { remote, ipcRenderer, ipcMain } = require("electron");

const IPCMsg =  Object.freeze({   
    PLAY_BY_ID: "ipc-play-by-id",
    PLAY: "ipc-play",
    
    SHOW_PLAYER_SYNC: "ipc-show-player",
    SET_COOKIE_SYNC: "ipc-set-cookie",
    SET_PLAYER_PATH: "ipc-set-player-path",

    SEARCH_TAG: "ipc-search-tag",
    LOAD_MYLIST: "ipc-load-mylist",
    ADD_DOWNLOAD_ITEM: "ipc-add-download-item",

    UPDATE_DATA: "ipc-update-data",
    RETURN_UPDATE_DATA: "ipc-return-update-data",
    CANCEL_UPDATE_DATA: "ipc-cancel-update-data"
});


class IPCMonitor extends EventEmitter {
    constructor(){
        super();
    }

    playByID(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.PLAY_BY_ID, args);
    }

    play(args){
        const win = remote.getGlobal ("player_window");
        win.webContents.send(IPCMsg.PLAY, args);
    }

    searchTag(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.SEARCH_TAG, args);
    }

    loadMylist(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.LOAD_MYLIST, args);
    }

    addDonwloadItem(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.ADD_DOWNLOAD_ITEM, args);
    }

    updateData(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.UPDATE_DATA, args);
    }

    returnUpdateData(args){
        const win = remote.getGlobal ("player_window");
        win.webContents.send(IPCMsg.RETURN_UPDATE_DATA, args);
    }

    cancelUpdateData(args){
        const win = remote.getGlobal ("main_window");
        win.webContents.send(IPCMsg.CANCEL_UPDATE_DATA, args);
    }

    showPlayerSync(args) {
        ipcRenderer.sendSync(IPCMsg.SHOW_PLAYER_SYNC, args);
    }

    setCookieSync(cookies){
        return ipcRenderer.sendSync(IPCMsg.SET_COOKIE_SYNC, cookies);
    }
    
    setPlayerPath(path){
        return ipcRenderer.send(IPCMsg.SET_PLAYER_PATH, path);
    }

    listenMain(){
        ipcMain.on(IPCMsg.SHOW_PLAYER_SYNC, (event, args) => {
            this.emit(IPCMsg.SHOW_PLAYER_SYNC, event, args); 
        });

        ipcMain.on(IPCMsg.SET_COOKIE_SYNC, (event, args) => {
            this.emit(IPCMsg.SET_COOKIE_SYNC, event, args); 
        });

        ipcMain.on(IPCMsg.SET_PLAYER_PATH, (event, args) => {
            this.emit(IPCMsg.SET_PLAYER_PATH, event, args); 
        });
    }

    listenRemote(){
        ipcRenderer.on(IPCMsg.PLAY_BY_ID, (event, args) => {
            this.emit(IPCMsg.PLAY_BY_ID, event, args); 
        });
        
        ipcRenderer.on(IPCMsg.PLAY, (event, args) => {
            this.emit(IPCMsg.PLAY, event, args); 
        });

        ipcRenderer.on(IPCMsg.SEARCH_TAG, (event, args) => {
            this.emit(IPCMsg.SEARCH_TAG, event, args); 
        });

        ipcRenderer.on(IPCMsg.LOAD_MYLIST, (event, args) => {
            this.emit(IPCMsg.LOAD_MYLIST, event, args); 
        });

        ipcRenderer.on(IPCMsg.ADD_DOWNLOAD_ITEM, (event, args) => {
            this.emit(IPCMsg.ADD_DOWNLOAD_ITEM, event, args); 
        });

        ipcRenderer.on(IPCMsg.UPDATE_DATA, (event, args) => {
            this.emit(IPCMsg.UPDATE_DATA, event, args); 
        });

        ipcRenderer.on(IPCMsg.RETURN_UPDATE_DATA, (event, args) => {
            this.emit(IPCMsg.RETURN_UPDATE_DATA, event, args); 
        });

        ipcRenderer.on(IPCMsg.CANCEL_UPDATE_DATA, (event, args) => {
            this.emit(IPCMsg.CANCEL_UPDATE_DATA, event, args); 
        });
    }
}

module.exports = {
    IPCMsg,
    IPCMonitor
};