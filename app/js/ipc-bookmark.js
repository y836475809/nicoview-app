const { DataIpcMain } = require("./ipc");

class BookMarkIpcMain extends DataIpcMain {
    constructor(){
        super("bookmark");
    }

    setup(getdata_callback){
        this.getdata_callback = getdata_callback;
        this.handle();
    }

    getData(args){
        return this.getdata_callback(args);
    }

    update(args){
        this.emit("bookmarkItemUpdated", args);
    }
}

module.exports = {
    BookMarkIpcMain
};