const path = require("path");

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

function InfoViewWidth(value){
    return PrimitivelocalStorage("infoview-width", value);
}

function VideoScale(value){
    return PrimitivelocalStorage("video-scale", value);
}

function SyncComment(value){
    return BooleanlocalStorage("sync-comment-check", value);
}

module.exports = {
    getLibraryPath: getLibraryPath,
    setLibraryPath: setLibraryPath,
    getDataPath: getDataPath,
    getLibraryFilePath: getLibraryFilePath,
    InfoViewWidth: InfoViewWidth,
    VideoScale: VideoScale,
    SyncComment: SyncComment
};
