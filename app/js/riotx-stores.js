const EventEmitter = require("events").EventEmitter;

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

module.exports = {
    Store,
    storex
};