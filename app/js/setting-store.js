const path = require("path");
const electron = require("electron");
const { app } = electron;
const JsonStore = require("./json-strore");

class SettingStore {
    constructor(in_memory=false){
        this.in_memory = in_memory;

        const user_data_dir = app.getPath("userData");
        const setting_file_path = path.join(user_data_dir, "setting.json");

        if(in_memory){
            this._setDefault();
            return;
        }

        this.store = new JsonStore(setting_file_path);     
    }

    get(){
        if(this.in_memory){
            return this.setting;
        }

        try {
            this.setting = this.store.load();
        } catch (error) {
            console.log(error);
            this._setDefault();
        }        
        return this.setting;
    }

    set(setting){
        this.setting = setting;
        this._save();
    }

    _save(){
        if(this.in_memory){
            return;
        }
        this.store.save(this.setting);
    }

    _setDefault(){
        const user_data_dir = app.getPath("userData");
        const library_dir = path.join(user_data_dir, "library");
        const system_dir = path.join(library_dir, "data");

        this.setting = {    
            library_dir: library_dir,
            system_dir: system_dir,
            info_view_width: 200,
            sync_comment: false,
            player_volume: 0.5,
            player_default_size: {width: 854 ,height: 480},
            player_size: {width: 854 ,height: 480},
            play_org_size: false
        };        
    }
}

module.exports = SettingStore;