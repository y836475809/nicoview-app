
const { ipcRenderer, ipcMain } = require("electron");
const path = require("path");
const JsonStore = require("./json-store");

const IPC_CHANNEL = Object.freeze({
    BOOKMARK_ACITON: "ipc-bookmark-action",
});

class BookMarkIpcRenderer {
    static async action(method, args) {
        return await ipcRenderer.invoke(IPC_CHANNEL.BOOKMARK_ACITON, {method, args});
    }
}

class BookMarkIpcMain {
    setup(data_dir){
        this.data_dir = data_dir;
        ipcMain.handle(IPC_CHANNEL.BOOKMARK_ACITON, async (event, _args) => {
            const { method, args } = _args;
            const func = this[method];
            if(func.constructor.method === "AsyncFunction"){
                return await this[method](args);
            }else{
                return this[method](args);
            }
        });
    }

    getData(args){
        const { name } = args;
        const file_path = path.join(this.data_dir, `${name}.json`);
        try {
            const json_store = new JsonStore(file_path);
            const items = json_store.load();
            return items;
        } catch (error) { 
            console.log(error);
            const items = [];
            return items;
        }
    }

    save(args){
        const { name, items } = args;
        const file_path = path.join(this.data_dir, `${name}.json`);
        const json_store = new JsonStore(file_path);
        json_store.save(items);
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
    BookMarkIpcRenderer,
    BookMarkIpcMain
};