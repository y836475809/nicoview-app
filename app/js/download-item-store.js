const JsonStore = require("./json-strore");

//TODO
class DownloadItemStore {
    constructor(file_path){
        this.store = new JsonStore(file_path);
    }

    load(){
    }

    save(){
    }

    getItems(){
    }

    setItems(items){
    }
}

module.exports = {
    DownloadItemStore: DownloadItemStore
};