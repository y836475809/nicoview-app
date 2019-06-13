const fs = require("fs");
const { remote } = require("electron");
const { dialog } = require("electron").remote;

const selectFileDialog = (name, extensions)=>{
    const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ["openFile"],
        title: "ファイルを選択",
        defaultPath: ".",
        filters: [
            {name: name, extensions: extensions}, 
            {name: "All", extensions: ["*"]},
        ]
    });
    if(paths){
        return paths[0];
    }
    return null;
};

const selectFolderDialog = ()=>{
    const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ["openDirectory"],
        title: "フォルダを選択",
        defaultPath: "."
    });
    if(paths){
        return paths[0];
    }
    return null;
};

const mkDirp = (dir) => {
    try {
        fs.statSync(dir);
    } catch (error) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

module.exports = {
    FileUtil:{
        selectFileDialog,
        selectFolderDialog,
        mkDirp,
    }
};