const JsonStore = require("./json-store");

class HistoryStore{
    constructor(file_path, history_max){
        this.store = new JsonStore(file_path);
        this.history_max = history_max;
        this.history_items = [];
    }

    load(){    
        try {
            this.history_items = this.store.load();
            this.history_items.sort((a, b) => {
                if (a.play_date < b.play_date) return 1;
                if (a.play_date > b.play_date) return -1;
                return 0;
            });    
        } catch (error) {
            this.history_items = [];
            throw error;
        }
    }  

    save(){
        this.store.save(this.history_items);    
    }

    getItems(){
        return this.history_items;
    }
    
    add(new_item){
        const index = this.history_items.findIndex(item => item.id === new_item.id);
        if(index === -1){
            if(this.history_items.length >= this.history_max){
                this.history_items.pop();
            }
            this.history_items.unshift({
                thumb_img: new_item.image,
                id: new_item.id,
                name: new_item.name,
                play_date: Date.now(), 
                play_time: 0,
                url: new_item.url                
            }); 
        }else{
            let item = this.history_items[index];
            item.play_date = Date.now();
            if(new_item.url != item.url){
                item.url = new_item.url;
            }
            if(new_item.image != item.thumb_img){
                item.thumb_img = new_item.image;
            }
            this.history_items.sort((a, b) => {
                if (a.play_date < b.play_date) return 1;
                if (a.play_date > b.play_date) return -1;
                return 0;
            });
        }

        this.save();
    } 
}

module.exports = HistoryStore;