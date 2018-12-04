const path = require("path");
const electron = require("electron");
const { app } = electron;
const serializer = require("./serializer");

class Preference {
    constructor(){
        this.data_path = app.getPath("userData");
        this.file_path = path.join(this.data_path, "pref.json");
    }

    load(){
        try {
            this.pref = serializer.load(this.file_path);
        } catch (error) {
            const library_dir = path.join(this.data_path, "library");
            const data_dir = path.join(library_dir, "data");
            this.pref = {
                data_dir: data_dir,
                library_dir: library_dir,
                library_file: path.join(library_dir, "library.json"),
                history_file: path.join(data_dir, "history.json"),
                search_file: path.join(data_dir, "search.json"),
                info_view_width: 200,
                sync_comment: false,
                player_size: {width: 854 ,height: 480},
                play_org_size: false
            };
        }
    }

    save(){
        serializer.save(this.file_path, this.pref, (error)=>{
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

        this.pref.data_dir = path.join(this.pref.library_dir, "data");
        this.pref.library_file = path.join(this.pref.library_dir, "library.json");
        this.pref.history_file = path.join(this.pref.data_dir, "history.json");
        this.pref.search_file = path.join(this.pref.data_dir, "search.json");
    }

    set libraryDir(value){
        this.pref.library_dir = value;
        this.pref.library_file = path.join(this.pref.library_dir, "library.json");
    }

    get libraryFile(){
        return this.pref.library_file;
    }

    get historyFile(){
        return this.pref.history_file;
    }

    get searchFile(){
        return this.pref.search_file;
    }    

    get infoViewWidth(){
        return this.pref.info_view_width;
    }
    set infoViewWidth(value){
        this.pref.info_view_width = value;
    }

    get syncComment(){
        return this.pref.sync_comment;
    }
    set syncComment(value){
        this.pref.sync_comment = value;
    }

    get playerSize(){
        return this.pref.player_size;
    }
    set playerSize(value){
        this.pref.player_size = value;
    }

    get playOrgSize(){
        return this.pref.play_org_size;
    }
    set playOrgSize(value){
        this.pref.play_org_size = value;
    }
}

function PrimitivelocalStorage(key, value){
    if(value){
        localStorage.setItem(key, value);
    }else{
        return localStorage.getItem(key);
    }
}

function BooleanlocalStorage(key, value){
    if(value != undefined){
        localStorage.setItem(key, value);
    }else{
        const checked = localStorage.getItem(key);
        if(checked == null){
            return false;
        }
        return checked.toLowerCase() == "true";
    }
}

function getLibraryPath(){
    return localStorage.getItem("library-path");
}

function setLibraryPath(path){
    localStorage.setItem("library-path", path);
}

function getDataPath(){
    const lbrary_path = getLibraryPath();
    if(!lbrary_path){
        return null;
    }
    return path.join(lbrary_path, "data");
}

function getLibraryFilePath(){
    const file_path = getDataPath();
    if(!file_path){
        return null;
    }
    return path.join(file_path, "library.json");
}

function getHistoryPath(){
    const file_path = getDataPath();
    if(!file_path){
        return null;
    }
    return path.join(file_path, "history.json");
}

function InfoViewWidth(value){
    return PrimitivelocalStorage("infoview-width", value);
}

function getDefaultScreenSize(){
    return {width: 854 ,height: 480};
}

function ScreenSize(size){
    if(size){
        PrimitivelocalStorage("screen-width", size.width);
        PrimitivelocalStorage("screen-height", size.height);
    }else{
        const width = PrimitivelocalStorage("screen-width");
        const height = PrimitivelocalStorage("screen-height");
        if(!width || !height){
            return getDefaultScreenSize();
        }else{
            return {
                width: parseInt(width), 
                height: parseInt(height)
            };
        }
    }
}

function ScreenSizeOrignal(value){
    return BooleanlocalStorage("screen-size-orignal", value);
}

function SyncComment(value){
    return BooleanlocalStorage("sync-comment-check", value);
}

module.exports = Preference;
// module.exports = {
//     getLibraryPath: getLibraryPath,
//     setLibraryPath: setLibraryPath,
//     getDataPath: getDataPath,
//     getLibraryFilePath: getLibraryFilePath,
//     getHistoryPath: getHistoryPath,
//     InfoViewWidth: InfoViewWidth,
//     getDefaultScreenSize: getDefaultScreenSize,
//     ScreenSize: ScreenSize,
//     ScreenSizeOrignal: ScreenSizeOrignal,
//     SyncComment: SyncComment
// };
