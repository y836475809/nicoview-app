const path = require("path");
const EventEmitter = require("events");
const { LibraryDB } = require("./db");

class Library extends EventEmitter {
    constructor(){
        super();
    }

    get dataDir(){
        return this._data_dir;
    }

    setup(data_dir){
        this.library_db = null;
        this._data_dir = data_dir;
    }

    getItem(video_id){
        if(!this.library_db){
            return null;
        }

        return this.library_db.find(video_id);
    }

    getItems(){
        if(!this.library_db){
            return [];
        }

        return this.library_db.findAll();
    }

    has(video_id){
        if(!this.library_db){
            return false;
        }

        return this.library_db.exist(video_id);
    }

    async update(video_id, props){
        if(!this.library_db){
            return;
        }

        await this.library_db.update(video_id, props);
        this.emit("libraryItemUpdated", {video_id, props});
    }

    async save(force=true){
        if(!this.library_db){
            return;
        }

        await this.library_db.save(force);
    }

    setData(path_data_list, video_data_list){
        this.library_db = new LibraryDB(
            {filename : path.join(this._data_dir, "library.json")});
        this.library_db.setPathData(path_data_list);
        this.library_db.setVideoData(video_data_list);

        this.emit("libraryInitialized");
    }
    async load(){
        this.library_db = new LibraryDB(
            {filename : path.join(this._data_dir, "library.json")});
        await this.library_db.load();
        this.emit("libraryInitialized");
    }

    async addDownloadedItem(download_item){
        if(!this.library_db){
            return;
        }

        const video_item = Object.assign({}, download_item);
        video_item.common_filename = download_item.title;
        video_item.creation_date = new Date().getTime();
        video_item.last_play_date = -1;
        video_item.modification_date = -1;
        video_item.play_count = 0;
        await this.library_db.insert(video_item.dirpath, video_item);
        this.emit("libraryItemAdded", {video_item});
    }
    
    async addItem(item){
        if(!this.library_db){
            return;
        }

        await this.library_db.insert(item.dirpath, item);
        this.emit("libraryItemAdded", { video_item : item });
    }
    
    async delete(video_id){
        if(!this.library_db){
            return;
        }
        
        await this.library_db.delete(video_id);
        this.emit("libraryItemDeleted", { video_id });
    }

}

module.exports = {
    Library
};
