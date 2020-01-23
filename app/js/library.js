const path = require("path");
const { LibraryDB } = require("./db");
const { DataIpcMain } = require("./data-ipc");

class LibraryIpcMain extends DataIpcMain {
    constructor(){
        super("library");
        this.setup();
    }

    setup(){
        this.library_db = null;
        this.handle();
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
        const video_item = Object.assign({}, download_item);
        video_item.common_filename = video_id;
        video_item.creation_date = new Date().getTime();
        video_item.last_play_date = -1;
        video_item.modification_date = -1;
        video_item.play_count = 0;
        await this.library_db.insert(video_item.dirpath, video_item);
        this.emit("libraryItemAdded", {video_item});
    }
}

module.exports = {
    LibraryIpcMain
};
