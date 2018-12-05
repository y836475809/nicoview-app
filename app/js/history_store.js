const serializer = require("./app/js/serializer");

class HistoryStore{
    constructor(file_path, history_max){
        this.file_path = file_path;
        this.history_max = history_max;
        this.history_items = [];
    }

    load(){    
        try {
            this.history_items = serializer.load(this.file_path);
            this.history_items.sort((a, b) => {
                return a.play_date < b.play_date;
            });    
        } catch (error) {
            this.history_items = [];
            console.error(error);
        }
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
                image: new_item.image,
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
                item.image = new_item.image;
                item.url = new_item.url;
            }
            this.history_items.sort((a, b) => {
                return a.play_date < b.play_date;
            });
        }

        this.save();
    } 
    
    save(){
        serializer.save(this.file_path, this.history_items, (error)=>{
            if(error){
                console.error(error);
            }
        });       
    }
}

module.exports = HistoryStore;