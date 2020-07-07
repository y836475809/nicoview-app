const { IPCServer } = require("./ipc-client-server");

class StoreVideoItemsIPCServer extends IPCServer {
    constructor(){
        super("store_video_items");
    }

    setup(){
        this.data_map = new Map();
        this.handle();
    }

    setData(args){    
        const { key, items } = args;
        this.data_map.set(key, items);
    }  

    getData(args){
        const { key } = args;
        return this.data_map.get(key);
    }
}

module.exports = {
    StoreVideoItemsIPCServer,
};