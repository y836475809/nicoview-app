const EventEmitter = require("events").EventEmitter;
const path = require("path");
const { BookMark } = require("./bookmark");
const { toPlayTime } = require("./time-format");
const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");
const { LibraryDB } = require("./db");

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

        if(this._isAsync(fn)){
            return fn(context, ...args);
        }else{    
            return new Promise((resolve, reject) => {
                try {
                    resolve(fn(context, ...args));
                } catch (error) {
                    reject(error);
                }
            });
        }
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
            const [name, ...args] = ev;
            this._emiter.emit(...[name, this._state, this, ...args]);
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

    _isAsync(func) {
        return func.constructor.name === "AsyncFunction";
    }
}

class libraryItemConverter {
    constructor(){
        this.nico_xml = new NicoXMLFile();
        this.nico_json = new NicoJsonFile();
    }
    createDBItem() {
        return {
            _db_type: "",
            dirpath_id: -1,
            video_id: "",
            video_name: "",
            video_type: "",
            common_filename: "",
            is_economy: false,
            modification_date: -1,
            creation_date: 0,
            pub_date: 0,
            last_play_date: -1,
            play_count: 0,
            time: 0,
            tags: [],
            is_deleted: false,
            thumbnail_size: "S",
        };
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
    
    async getlibraryItem(library, item){
        const id_dirpath_map = library.id_dirpath_map;
        return this._createLibraryItem(id_dirpath_map, item);
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

const main_store = new Store({
    name: "main",
    state:{
        library:null,
        library2:null,
        download_Items:[]
    },
    actions: {
        addDownloadedItem: (context, d_item) => {
            const dirpath = d_item.dirpath;
            const item = cv.createDBItem();
            item._db_type = d_item._db_type;
            item.video_id = d_item.video_id;
            item.video_name = d_item.video_name;
            item.video_type = d_item.video_type;
            item.common_filename = d_item.video_id,
            item.is_economy = d_item.is_economy;
            item.creation_date = new Date().getTime();
            item.pub_date = d_item.pub_date;
            item.time = d_item.time;
            item.tags = d_item.tags;
            item.is_deleted = d_item.is_deleted;
            item.thumbnail_size = d_item.thumbnail_size;
            context.getter("library").addItem(dirpath, item).then(()=>{
                context.commit("addDownloadedItem", item.video_id);
            });
        },
        updateDownloadItem: (context, download_Items) => {
            context.commit("updateDownloadItem", download_Items);
        },
        getLibraryItem: async (context, video_id) => {
            const library = context.getter("library");
            const item = await library.getItem(video_id);
            return cv.getlibraryItem(library, item);
        },
        getLibraryItems: async (context) => {
            const library = context.getter("library");
            return await cv.getlibraryItems(library);
        },
        // TODO
        getLibrary2Item: (context, video_id) => {
            const library = context.getter("library2");
            return library.find(video_id);
        },
        // TODO
        getLibrary2Items: (context) => {
            const library = context.getter("library2");
            return library.findAll();
        },
        // TODO
        loadLibrary2: async (context, dir) => {
            const library = new LibraryDB(
                {filename : path.join(dir, "library.json")});
            await library.load();
            context.commit("setLibrary2", library);
        },
        // TODO
        updareLibrary2: async (context, video_id, props) => {
            const library = context.getter("library2");
            await library.update(video_id, props);
            context.commit("updateLibraryItem", video_id);
        },
        // TODO
        saveLibrary2: async (context) => {
            const library = context.getter("library2");
            await library.save();
        },
        // TODO
        setLibrary2Data: async (context, dir, path_data_list, video_data_list) => {
            const library = new LibraryDB(
                {filename : path.join(dir, "library.json")});
            library.setPathData(path_data_list);
            library.setVideoData(video_data_list);
            await library.save();

            // context.state.library2 = library;
            context.commit("setLibrary2", library);
        },
        getPlayData: async (context, video_id) => {
            const library = context.getter("library");
            return await cv.getPlayItem(library, video_id);
        },
    },
    mutations: {
        initLibrary: (context, library) => {
            context.state.library = library;
            return [["libraryInitialized"]];
        },
        // TODO
        setLibrary2: (context, library) => {
            context.state.library2 = library;
            return [["libraryInitialized2"]];
        },
        // TODO
        updateLibraryItem: (context, video_id) => {
            return [["libraryItemUpdated", video_id]];
        },
        addDownloadedItem : (context, video_id) => {
            return [["libraryItemAdded", video_id]];
        },
        updateDownloadItem: (context, download_Items) => {
            context.state.download_Items = download_Items;
            return [["downloadItemChanged"]];
        }
    },
    getters: {
        library: (context) => {
            return context.state.library;
        },
        // TODO
        library2: (context) => {
            return context.state.library2;
        },
        existlibraryItem:  (context, video_id) => {
            const id_set = context.state.library.getVideoIDSet();
            return id_set.has(video_id);
        },
        libraryVideoIDSet:  (context) => {
            if(!context.state.library){
                return new Set();
            }
            return context.state.library.getVideoIDSet();
        },
        downloadItemSet : (context) => {
            const id_set = new Set();
            context.state.download_Items.forEach(item => {
                id_set.add(item.video_id);
            });
            return id_set;
        },
        downloadIncompleteItemSet : (context) => {
            const id_set = new Set();
            context.state.download_Items.forEach(item => {
                if(item.state=="incomplete"){
                    id_set.add(item.video_id);
                }
            });
            return id_set;
        }
    }
});

const createAcordionStore = (store_name) => {
    return new Store({
        name: store_name,
        state: {
            name: store_name,
            selected_items: [],
            is_expand: true,
            items: []
        },
    
        actions: {
            updateData: (context, obj) => {
                context.commit("updateData", obj);
            },
            addList: (context, obj) => {
                context.commit("addList", obj);
            },
            deleteList: (context) => {
                context.commit("deleteList");
            }
        },
    
        mutations: {
            setSelectedData: (context, obj) => {
                context.state.selected_items = obj.selected_items;
                return [
                    ["selected"]
                ];
            },
            loadData:  (context, obj) => {
                context.state.items = obj.items;
                return [
                    ["loaded"]
                ];            
            },
            updateData: (context, obj) => {
                context.state.items = obj.items;
                return [
                    ["changed"]
                ];
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
                return [
                    ["changed"]
                ];
            },
            deleteList: (context) => {
                const selected_items = context.state.selected_items;
                const newArray = context.state.items.filter((item) => {
                    return selected_items.includes(item) === false;
                });
                context.state.items = newArray;
                return [
                    ["changed"]
                ];
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
storex.add(main_store);
storex.add(createAcordionStore("bookmark"));
storex.add(createAcordionStore("nico-search"));
storex.add(createAcordionStore("library-search"));
storex.add(createAcordionStore("mylist"));

module.exports = {
    Store,
    storex
};