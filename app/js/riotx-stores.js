const riotx = require("riotx");
const { BookMark } = require("./bookmark");
const { toPlayTime } = require("./time-format");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

const getIcon = (store_name, item) => {
    if (store_name == "bookmark") {
        let name = "fas fa-bookmark fa-lg fa-fw";
        if (BookMark.isSearch(item)) {
            name = "fas fa-search fa-lg fa-fw";
        }
        return {
            name: name,
            class_name: "bookmark-item"
        };
    }
    if(store_name == "nico-search") {
        return item.cond.search_kind=="tag"? {
            name: "fas fa-tag fa-lg",
            class_name: "search-item"
        } : undefined; 
    }
    return undefined;
};

const createStore = (store_name) => {
    return new riotx.Store({
        name: store_name,
        state: {
            name: store_name,
            selected_items: [],
            is_expand: true,
            items: []
        },
    
        actions: {
            updateData: (context, obj) => {
                return Promise
                    .resolve()
                    .then(() => {
                        context.commit("updateData", obj);
                    });
            },
            addList: (context, obj) => {
                return Promise
                    .resolve()
                    .then(() => {
                        context.commit("addList", obj);
                    });
            },
            deleteList: (context) => {
                return Promise
                    .resolve()
                    .then(() => {
                        context.commit("deleteList");
                    });
            }
        },
    
        mutations: {
            setSelectedData: (context, obj) => {
                context.state.selected_items = obj.selected_items;
                return ["selected"];
            },
            loadData:  (context, obj) => {
                context.state.items = obj.items;
                return ["loaded"];            
            },
            updateData: (context, obj) => {
                context.state.items = obj.items;
                return ["changed"];
            },
            addList: (context, obj) => {
                obj.items.forEach(item => {
                    if (context.state.name == "bookmark") {
                        const time = item.data.time;
                        if (time > 0) {
                            item.title = `${item.title} ${toPlayTime(time)}`;
                        }
                    }
                    context.state.items.push(item);
                });
                return ["changed"];
            },
            deleteList: (context) => {
                const selected_items = context.state.selected_items;
                const newArray = context.state.items.filter((item) => {
                    return selected_items.includes(item) === false;
                });
                context.state.items = newArray;
                return ["changed"];
            }
        },
    
        getters: {
            attmap: (context) => {
                const map = new Map();
                context.state.items.forEach(item => {
                    const icon = getIcon(context.state.name, item);
                    map.set(item, icon);
                });
                return map;
            },
            state: (context) => {
                return context.state;
            },
            filter: (context, obj) => {
                const query = obj.query;
                const ii = context.state.items.filter(item => {
                    if (query != "") {
                        return item.title.toLowerCase().includes(query);
                    }
                    return true;
                });
                return ii;
            }
        }
    });
};

const EventEmitter = require("events").EventEmitter;
const ev = new EventEmitter();

const app_store = new riotx.Store({
    name: "app",
    state: {
        download: {
            reg_video_id_set: null,
            not_comp_video_id_set: null,
        },
        library:null,
        ev: ev,
    },
    actions: {
        addLibraryItem: (context, obj) => {
            const item = obj.item;
            context.getter("state").library.addItem(item).then(()=>{
                context.commit("addLibraryItem", obj);
            });
        },
        updateDownloadItem: (context, obj) => {
            return Promise
                .resolve()
                .then(() => {
                    context.commit("updateDownloadItem", obj);
                });
        },
    },
    mutations: {
        addLibraryItem: (context, obj) => {
            const item = obj.item;
            ev.emit("libraryItemChanged", item.video_id);
            return ["libraryItemChanged"]; 
        },
        updateLibrary: (context, obj) => {
            context.state.library = obj.library;
        },
        updateDownloadItem: (context, obj) => {
            if(obj){
                context.state.download = obj.download;
            }
            return ["donwloadItemChanged"];
        },
    },

    getters: {
        state: (context) => {
            return context.state;
        },
        download:  (context) => {
            return context.state.download;
        },
        playdata:  async (context, obj) => {
            const video_id = obj.video_id;
            return await context.state.library.getPlayData(video_id);
        },
        libraryVideoIDSet:  (context) => {
            if(!context.state.library){
                return new Set();
            }
            return context.state.library.getVideoIDSet();
        },
        libraryItem: async (context, obj) => {
            const video_id = obj.video_id;
            return await context.state.library.getLibraryItem(video_id);
        },
        existlibraryItem:  (context, obj) => {
            const video_id = obj.video_id;
            const id_set = context.state.library.getVideoIDSet();
            return id_set.has(video_id);
        },
    }
});

class Store {
    constructor(store){
        this.name = store.name;
        this._state = store.state;
        this._actions = store.actions;
        this._mutations = store.mutations;
        this._getters = store.getters;
        this._emiter = new EventEmitter();
    }

    action(name, ...args){
        const fn = this._actions[name];

        const context = {
            getter: (name, ...args) => {
                return this.getter(name, ...args);
            },
            commit: (name, ...args) => {
                this.commit(name, ...args);
            }
        };
        return Promise
            .resolve()
            .then(() => {
                fn(context, ...args);
            });
    }

    commit(name, ...args){
        const fn = this._mutations[name];

        const context = {
            getter: (name, ...args) => {
                return this.getter(name, ...args);
            },
            state: this._state
        };

        const evnets = fn(context, ...args);
        evnets.forEach(ev => {
            this._emiter.emit(...ev);
        });
    }

    getter(name, ...args){
        const fn = this._getters[name];

        const context = {
            state: this._state
        };
        return fn(context, ...args);
    }

    change(name, ...args){
        this._emiter.on(name, ...args);
    }
}

class libraryItemConverter {
    constructor(){
        this.nico_xml = new NicoXMLFile();
        this.nico_json = new NicoJsonFile();
    }
    _createLibraryItem(id_dirpath_map, video_item){
        const dir_path = id_dirpath_map.get(video_item.dirpath_id);
        return  {
            db_type: video_item._db_type,
            thumb_img: this._getThumbImgPath(dir_path, video_item),
            id: video_item.video_id,
            name: video_item.video_name,
            creation_date: video_item.creation_date,
            pub_date: video_item.pub_date,
            last_play_date: video_item.last_play_date,
            play_count: video_item.play_count,
            play_time: video_item.time,
            tags: video_item.tags?video_item.tags.join(" "):"",
            thumbnail_size: video_item.thumbnail_size,
            video_type: video_item.video_type
        };
    }

    async getlibraryItems(library){
        const items = await library.getItems();
        const id_dirpath_map = library.id_dirpath_map;
        return items.map(item => {
            return this._createLibraryItem(id_dirpath_map, item);
        });   
    }
    async getPlayItem(library, video_id){
        const item = await library.getItem(video_id);
        const dir_path = await library._getDir(item.dirpath_id);
        const is_deleted = await library.getFieldValue(video_id, "is_deleted");

        const video_path = this._getVideoPath(dir_path, item);
        const video_type = this._getVideoType(item);
        const comments = this._getComments(dir_path, item);
        const thumb_info = this._getThumbInfo(dir_path, item);

        return {
            video_data: {
                src: video_path,
                type: `video/${video_type}`,
            },
            viewinfo: {
                is_deleted: is_deleted,
                thumb_info:thumb_info,
                
            },
            comments: comments
        };   
    }

    _getDataFileInst(dir_path, video_info){
        const db_type = video_info._db_type;
        if(db_type=="xml"){
            this.nico_xml.dirPath = dir_path;
            this.nico_xml.commonFilename = video_info.common_filename;
            this.nico_xml.videoType = video_info.video_type;
            this.nico_xml.thumbnailSize = video_info.thumbnail_size;
            return this.nico_xml;
        }
        if(db_type=="json"){
            this.nico_json.dirPath = dir_path;
            this.nico_json.commonFilename = video_info.common_filename;
            this.nico_json.videoType = video_info.video_type;
            this.nico_json.thumbnailSize = video_info.thumbnail_size;
            return this.nico_json;
        }

        throw new Error(`${db_type} is unkown`);
    }
    
    _getVideoPath(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.videoPath;
    }

    _getThumbImgPath(dir_path, video_info){
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.thumbImgPath;
    }

    _getComments(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.getComments();
    }

    _getThumbInfo(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        const thumb_info = datafile.getThumbInfo();
        const thumb_img_path = this._getThumbImgPath(dir_path, video_info);
        thumb_info.video.thumbnailURL = thumb_img_path;
        thumb_info.video.largeThumbnailURL = thumb_img_path;
        return thumb_info;
    }

    _getVideoType(video_info){
        return video_info.video_type;
    }

}

const cv = new libraryItemConverter();

const test_app_store = new Store({
    name: "app",
    state:{
        library:null,
    },
    actions: {
        addLibraryItem: async (context, item) => {
            await context.state.library.addItem(item);
            context.commit(item.video_id);
        },
    },
    mutations: {
        initLibrary: (context, library) => {
            context.state.library = library;
            return ["libraryInitialized"];
        },
        addLibraryItem : (context, video_id) => {
            return ["test-libraryItemChanged", video_id];
        }
    },
    getters: {
        playData: async (context, video_id) => {
            const library = context.state.library;
            return await cv.getPlayItem(library, video_id);
        },
        libraryItems: async (context) => {
            return await cv.getlibraryItems(context.state.library)
        }
    }
});

class StoreX {
    constructor(){
        this._stores = {};
    }
    add(store){
        this._stores[store.name] = store;
    }

    get(name){
        return this._stores[name];
    }
}

const storex = new StoreX();
storex.add(test_app_store);

const stores = [
    createStore("bookmark"),
    createStore("nico-search"),
    createStore("library-search"),
    createStore("mylist"),
    app_store,
];

module.exports = {
    stores,
    Store,
    storex
};