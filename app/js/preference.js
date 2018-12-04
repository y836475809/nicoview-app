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

    // set libraryDir(value){
    //     this.pref.library_dir = value;
    //     this.pref.library_file = path.join(this.pref.library_dir, "library.json");
    // }

    // get libraryFile(){
    //     return this.pref.library_file;
    // }

    // get historyFile(){
    //     return this.pref.history_file;
    // }

    // get searchFile(){
    //     return this.pref.search_file;
    // }    

    // get infoViewWidth(){
    //     return this.pref.info_view_width;
    // }
    // set infoViewWidth(value){
    //     this.pref.info_view_width = value;
    // }

    // get syncComment(){
    //     return this.pref.sync_comment;
    // }
    // set syncComment(value){
    //     this.pref.sync_comment = value;
    // }

    // get playerSize(){
    //     return this.pref.player_size;
    // }
    // set playerSize(value){
    //     this.pref.player_size = value;
    // }

    // get playOrgSize(){
    //     return this.pref.play_org_size;
    // }
    // set playOrgSize(value){
    //     this.pref.play_org_size = value;
    // }
}
module.exports = Preference;