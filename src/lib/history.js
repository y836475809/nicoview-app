
class History {
    /**
     * 
     * @param {number} history_max 履歴保存最大数
     */
    setup(history_max){
        /** @type {number} */
        this.history_max = history_max;

        /** @type {HistoryItem[]} */
        this.history_items = [];
    }

    /**
     * 
     * @param {HistoryItem[]} items 
     */
    setData(items){
        this.history_items = items; //TODO need copy?
        this.history_items.sort((a, b) => {
            if (a.play_date < b.play_date) return 1;
            if (a.play_date > b.play_date) return -1;
            return 0;
        });
    }  

    /**
     * 
     * @returns {HistoryItem[]}
     */
    getData(){
        return this.history_items;
    }
    
    /**
     * 
     * @param {{
     * video_id:string, 
     * thumb_img:string,
     * title:string }} new_item 履歴に追加する動画情報
     */
    add(new_item){     
        const index = this.history_items.findIndex(item => item.video_id === new_item.video_id);
        if(index === -1){
            if(this.history_items.length >= this.history_max){
                this.history_items.pop();
            }
            this.history_items.unshift({
                thumb_img: new_item.thumb_img,
                video_id: new_item.video_id,
                title: new_item.title,
                play_date: Date.now(), 
                time: 0             
            }); 
        }else{
            let item = this.history_items[index];
            item.play_date = Date.now();
            if(new_item.thumb_img != item.thumb_img){
                item.thumb_img = new_item.thumb_img;
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