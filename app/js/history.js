
class History {
    setup(history_max){
        this.history_max = history_max;
        this.history_items = [];
    }

    setData(items){
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
    
    add(new_item){
        const index = this.history_items.findIndex(item => item.id === new_item.id);
        if(index === -1){
            if(this.history_items.length >= this.history_max){
                this.history_items.pop();
            }
            this.history_items.unshift({
                thumb_img: new_item.image,
                id: new_item.id,
                title: new_item.title,
                play_date: Date.now(), 
                time: 0,
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
    } 
}

module.exports = {
    History,
};