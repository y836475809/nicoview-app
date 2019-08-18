const { remote } = require("electron");
const { dialog } = require("electron").remote;

const selectFileDialog = async (name, extensions)=>{
    const paths = await dialog.showOpenDialog(remote.getCurrentWindow(), {
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

const selectFolderDialog = async ()=>{
    const paths = await dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ["openDirectory"],
        title: "フォルダを選択",
        defaultPath: "."
    });
    if(paths){
        return paths[0];
    }
    return null;
};

const showMessageBox = async (type, message) => {
    await dialog.showMessageBox(remote.getCurrentWindow(), {
        type: type,
        buttons: ["OK"],
        message: message
    });
};

module.exports = {
    selectFileDialog,
    selectFolderDialog,
    showMessageBox,
};