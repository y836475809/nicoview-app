const { ipcRenderer, ipcMain } = require("electron");
const path = require("path");
const EventEmitter = require("events");
const { LibraryDB } = require("./db");

const IPC_CHANNEL = Object.freeze({
    LIBRARY_ACITON: "ipc-library-action",
});

class DataIpcRenderer {
    static async action(name, method, args) {
        let channnel = null;
        if (name=="library") {
            channnel = IPC_CHANNEL.LIBRARY_ACITON;
        }
        if(channnel!=null){
            return await ipcRenderer.invoke(channnel, {method, args});
        }
    }
}

class Library extends EventEmitter {
    constructor(){
        super();
        this.setup();
    }

    setup(){
        this.library_db = null;
        ipcMain.handle(IPC_CHANNEL.LIBRARY_ACITON, async (event, _args) => {
            const { method, args } = _args;
            const func = this[method];
            if(func.constructor.method === "AsyncFunction"){
                return await this[method](args);
            }else{
                return this[method](args);
            }
        });
    }

    getItem(args){
        const { video_id } = args;
        return this.library_db.find(video_id);
    }

    getItems(){
        return this.library_db.findAll();
    }

    existItem(args){
        const { video_id } = args;
        return this.library_db.exist(video_id);
    }

    async update(args){
        const { video_id, props } = args;
        await this.library_db.update(video_id, props);
        this.emit("libraryItemUpdated", {video_id, props});
    }

    async save(){
        await this.library_db.save();
    }

    async setData(args){
        const { data_dir, path_data_list, video_data_list } = args;
        this.library_db = new LibraryDB(
            {filename : path.join(data_dir, "library.json")});
        this.library_db.setPathData(path_data_list);
        this.library_db.setVideoData(video_data_list);
        await this.library_db.save();

        this.emit("libraryInitialized");
    }
    async load(args){
        const { data_dir } = args;
        this.library_db = new LibraryDB(
            {filename : path.join(data_dir, "library.json")});
        await this.library_db.load();
        this.emit("libraryInitialized");
    }

    async addDownloadedItem(args){
        const { download_item } = args;
        const video_id = download_item.id;
        const item = Object.assign({}, download_item);
        item.common_filename = video_id;
        item.creation_date = new Date().getTime();
        item.last_play_date = -1;
        item.modification_date = -1;
        item.play_count = 0;
        await this.library_db.insert(item.dirpath, item);
        const video_item = this.library_db.find(video_id);
        this.emit("libraryItemAdded", {video_item});
    }
}

module.exports = {
    DataIpcRenderer,
    Library
};
