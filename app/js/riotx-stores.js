const EventEmitter = require("events").EventEmitter;
const path = require("path");
const { BookMark } = require("./bookmark");
const { toTimeString } = require("./time-format");

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

const main_store = new Store({
    name: "main",
    state:{
        download_Items:[]
    },
    actions: {
        updateDownloadItem: (context, download_Items) => {
            context.commit("updateDownloadItem", download_Items);
        },
    },
    mutations: {
        setLibrary: (context, library) => {
            context.state.library = library;
            return [["libraryInitialized"]];
        },
        updateDownloadItem: (context, download_Items) => {
            context.state.download_Items = download_Items;
            return [["downloadItemChanged"]];
        }
    },
    getters: {
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
                            item.title = `${item.title} ${toTimeString(time)}`;
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