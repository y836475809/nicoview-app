
const BookMarkType =  Object.freeze({   
    VIDEO: "video",
    SEARCH: "search"
});

class BookMark {
    /**
     * 
     * @param {String} title 
     * @param {String} video_id 
     */
    static createVideoItem(title, video_id){
        return {
            title: title,
            type: BookMarkType.VIDEO,
            data: {
                video_id: video_id
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
    // BookMarkType,
    BookMark
};