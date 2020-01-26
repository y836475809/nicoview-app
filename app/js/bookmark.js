
const { DataIpcMain } = require("./data-ipc");

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

const BookMarkType =  Object.freeze({   
    VIDEO: "video",
    SEARCH: "search"
});

class BookMark {
    /**
     * 
     * @param {String} title 
     * @param {String} video_id 
     * @param {Number} time 
     */
    static createVideoItem(title, video_id, time=0){
        return {
            title: title,
            type: BookMarkType.VIDEO,
            data: {
                video_id,
                time
            }
        };
    }

    /**
     * 
     * @param { NicoSearchParams } search_params 
     */
    static createSearchItem(nico_search_params){
        const cond = {
            query: nico_search_params._query,
            sort_order: nico_search_params._sort_order,
            sort_name: nico_search_params._sort_name,
            search_kind: nico_search_params.search_kind,
            page: nico_search_params._page
        };
        return {
            title: `検索: ${cond.query}, ページ${cond.page}`,
            type: BookMarkType.SEARCH,
            data: cond
        };
    }

    static isVideo(item){
        return item.type == BookMarkType.VIDEO;
    }

    
    static isSearch(item){
        return item.type == BookMarkType.SEARCH;
    }
}

module.exports = {
    BookMark,
    BookMarkIpcMain
};