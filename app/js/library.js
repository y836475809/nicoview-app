const { ipcRenderer, ipcMain } = require("electron");
const path = require("path");
const EventEmitter = require("events");
const { LibraryDB } = require("./db");

const IPC_CHANNEL = Object.freeze({
    ACITON: "ipc-data-action",
});

class DataRenderer {
    static async action(name, args) {
        return await ipcRenderer.invoke(IPC_CHANNEL.ACITON, {name, args});
    }
}

class myliib extends EventEmitter {
    constructor(){
        super();
        this.setup();
    }
    setup(){
        this.library = null;
        ipcMain.handle(IPC_CHANNEL.ACITON, async (event, _args) => {
            const { name, args } = _args;
            const func = this[name];
            if(func.constructor.name === "AsyncFunction"){
                return await this[name](args);
            }else{
                return this[name](args);
            }
        });
    }

    getLibraryItem(args){
        const { video_id } = args;
        return this.library.find(video_id);
    }

    getLibraryItems(){
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

    async addDownloadedItem(args){
        const { download_item } = args;
        const video_item = Object.assign({}, download_item);
        video_item.common_filename = video_item.id;
        video_item.creation_date = new Date().getTime();
        video_item.last_play_date = -1;
        video_item.modification_date = -1;
        video_item.play_count = 0;

        await this.library.insert(video_item.dirpath, video_item);
        this.emit("libraryItemAdded", {video_item});
    }
}

module.exports = {
    DataRenderer,
    myliib
};
