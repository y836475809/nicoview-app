const path = require("path");
const electron = require("electron");
const { app } = electron;
const serializer = require("./serializer");

class Preference {
    constructor(){
        this.user_data_dir = app.getPath("userData");
        this.pref_file_path = path.join(this.user_data_dir, "pref.json");
    }

    load(){
        try {
            this.pref = serializer.load(this.pref_file_path);
        } catch (error) {
            console.error(error);
            const library_dir = path.join(this.user_data_dir, "library");
            const system_data_dir = path.join(library_dir, "data");
            this.pref = {
                system_data_dir: system_data_dir,
                library_dir: library_dir,
                library_file: path.join(system_data_dir, "library.json"),
                history_file: path.join(system_data_dir, "history.json"),
                search_file: path.join(system_data_dir, "search.json"),
                info_view_width: 200,
                sync_comment: false,
                player_volume: 0.5,
                player_default_size: {width: 854 ,height: 480},
                player_size: {width: 854 ,height: 480},
                play_org_size: false
            };
        }
    }

    save(){
        serializer.save(this.pref_file_path, this.pref, (error)=>{
            if(error){
                new Error(error);
            }
        });
    }

    getValue(key){
        if(!(key in this.pref)){
            new Error(`not find ${key} in pref`);
        }
        return this.pref[key];
    }
    update(key, value){
        this.pref[key] = value;

        const system_data_dir = path.join(this.pref.library_dir, "data");
        this.pref.system_data_dir = system_data_dir;
        this.pref.library_file = path.join(system_data_dir, "library.json");
        this.pref.history_file = path.join(system_data_dir, "history.json");
        this.pref.search_file = path.join(system_data_dir, "search.json");
    }
}
module.exports = Preference;