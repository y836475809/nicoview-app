const path = require("path");

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

module.exports = {
    getLibraryPath: getLibraryPath,
    setLibraryPath: setLibraryPath,
    getDataPath: getDataPath,
    getLibraryFilePath: getLibraryFilePath
};
