const JsonStore = require("./json-strore");

class DownloadItemStore {
    constructor(file_path){
        this.store = new JsonStore(file_path);
    }

    //TODO
    load(){
        try {
            const items = this.store.load();
            this.items = items.map(value=>{
                return {
                    thumb_img: value.thumb_img,
                    id: value.id,
                    name: value.name,
                    state: value.state,
                    progress: "",
                    visible: true
                };       
            });
        } catch (error) {
            this.items = [];
            throw error;
        }
    }

    //TODO
    save(){
        const items = this.items.filter(value => {
            return value.visible === true;
        }).map(value => {
            return {
                thumb_img: value.thumb_img,
                id: value.id,
                name: value.name,
                state: value.state
            };
        });
        this.store.save(items);
    }

    getItems(){
        return this.items;
    }

    setItems(items){
        this.items = items;
    }
}

module.exports = {
    DownloadItemStore: DownloadItemStore
};