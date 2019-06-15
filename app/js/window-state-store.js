const JsonStore = require("./json-store");
const path = require("path");

class WindowStateStore {
    constructor(dir){
        const file_path = path.join(dir, "window-state.json"); 
        this.store =  new JsonStore(file_path);
    }

    load(){
        try {
            this.window_state = this.store.load();
        } catch (error) {
            this.window_state = {};
        }
    }

    save(){
        this.store.save(this.window_state);
    }

    getState(name, default_value){
        if(!this.window_state.hasOwnProperty(name)){
            return default_value;
        }
        return this.window_state[name];
    }

    setState(name, win){
        const bounds = win.getBounds(); 

        this.window_state[name] = {
            x: bounds.x, 
            y: bounds.y,  
            width: bounds.width,  
            height: bounds.height, 
            maximized: win.isMaximized()
        };
    }

}

module.exports = {
    WindowStateStore
};