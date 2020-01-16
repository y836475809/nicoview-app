const { ipcRenderer, ipcMain } = require("electron");
const path = require("path");
const EventEmitter = require("events");
const { LibraryDB } = require("./db");

const IPC_CHANNEL = Object.freeze({
    SET_VALUE: "ipc-data-set-value",
    GET_VALUE: "ipc-data-get-value",
});

class DataRenderer {
    async get(name, args) {
        return await ipcRenderer.invoke(IPC_CHANNEL.GET_VALUE, {name, args});
    }

    set(name, args) {
        ipcRenderer.invoke(IPC_CHANNEL.SET_VALUE, {name, args});
    }
}

class myliib extends EventEmitter {
    constructor(){
        super();
        this.setup();
    }
    setup(){
        this.library = null;
        ipcMain.handle(IPC_CHANNEL.GET_VALUE, async (event, _args) => {
            const { name, args } = _args;
            return await this[name](args);
        });
    }

    getLibraryItem(args){
        const { video_id } = args;
        return this.library.find(video_id);
    }

    getLibraryItems(){;
        return this.library.findAll();
    }

    existLibraryItem(args){
        const { video_id } = args;
        return this.library.exist(video_id);
    }

    async updateLibrary(args){
        const { video_id, props } = args;
        await this.library.update(video_id, props);
        this.emit("libraryItemUpdated", {video_id, props});
    }

    async saveLibrary(){
        await this.library.save();
    }

    async setLibraryData(args){
        const { data_dir, path_data_list, video_data_list } = args;
        this.library = new LibraryDB(
            {filename : path.join(data_dir, "library.json")});
        this.library.setPathData(path_data_list);
        this.library.setVideoData(video_data_list);
        await this.library.save();

        this.emit("libraryInitialized");
    }
    async loadLibrary(args){
        const { data_dir } = args;
        this.library = new LibraryDB(
            {filename : path.join(data_dir, "library.json")});
        await this.library.load();
        this.emit("libraryInitialized");
    }
}

module.exports = {
    DataRenderer,
    myliib
};
