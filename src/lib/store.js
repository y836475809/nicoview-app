const EventEmitter = require("events");

class Store extends EventEmitter {
    constructor(){
        super();
        this._map = new Map();
    }

    has(name){
        return this._map.has(name);
    }

    getItems(name){
        if(!this._map.has(name)){
            this._map.set(name, []);
        }
        return this._map.get(name);  
    }

    setItems(name, items){
        this._map.set(name, items);
    }

    // addItems(name, new_items){
    //     const items = this.getItems(name);
    //     this.setItems(name, items.concat(new_items));
    // }

    // updateItems(name, items){
    //     this._map.set(name, items);
    //     this.emit("updateItems", { name, items });
    // }
} 

module.exports = {
    Store,
};
