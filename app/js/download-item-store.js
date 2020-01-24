const { DataIpcMain } = require("./data-ipc");

class DownloadItemIpcMain extends DataIpcMain {
    constructor(){
        super("downloaditem");
    }

    setData(args){
        const { items } = args;
        this.items = items;
    }

    getData(){
        return this.items;
    }

    updateData(args){
        const { items } = args;
        this.items = items;
        this.emit("updated", {items});
    }

    // TODO Set to json? 
    getIDSet(args) {
        const { state } = args;

        const id_set = new Set();
        if(state == "all"){
            this.items.forEach(item => {
                id_set.add(item.video_id);
            });
            return id_set;
        }

        this.items.forEach(item => {
            if(item.state==state){
                id_set.add(item.video_id);
            } 
        });
        return id_set;
    }
}

module.exports = {
    DownloadItemIpcMain
};