const { IPCServer } = require("./ipc-client-server");

class HistoryIPCServer extends IPCServer {
    constructor(){
        super("history");
    }

    setup(history_max){
        this.history_max = history_max;
        this.history_items = [];
        this.handle();
    }

    setData(args){    
        const { items } = args;
        this.history_items = items; //TODO need copy?
        this.history_items.sort((a, b) => {
            if (a.play_date < b.play_date) return 1;
            if (a.play_date > b.play_date) return -1;
            return 0;
        });
    }  

    getData(){
        return this.history_items;
    }
    
    add(args){
        const { history_item } = args;
        const index = this.history_items.findIndex(item => item.id === history_item.id);
        if(index === -1){
            if(this.history_items.length >= this.history_max){
                this.history_items.pop();
            }
            this.history_items.unshift({
                thumb_img: history_item.image,
                id: history_item.id,
                title: history_item.title,
                play_date: Date.now(), 
                play_time: 0,
                url: history_item.url                
            }); 
        }else{
            let item = this.history_items[index];
            item.play_date = Date.now();
            if(history_item.url != item.url){
                item.url = history_item.url;
            }
            if(history_item.image != item.thumb_img){
                item.thumb_img = history_item.image;
            }
            this.history_items.sort((a, b) => {
                if (a.play_date < b.play_date) return 1;
                if (a.play_date > b.play_date) return -1;
                return 0;
            });
        }

        this.emit("historyItemUpdated");
    } 
}

module.exports = {
    HistoryIPCServer,
};