const { remote } = require("electron");
const { dialog } = remote;

const selectFileDialog = async (name, extensions)=>{
    const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ["openFile"],
        title: "ファイルを選択",
        defaultPath: ".",
        filters: [
            {name: name, extensions: extensions}, 
            {name: "All", extensions: ["*"]},
        ]
    });
    if(result.canceled===true){
        return null;
    }
    return result.filePaths[0];
};

const selectFolderDialog = async ()=>{
    const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ["openDirectory"],
        title: "フォルダを選択",
        defaultPath: "."
    });
    if(result.canceled===true){
        return null;
    }
    return result.filePaths[0];
};

const showMessageBox = async (type, message) => {
    await dialog.showMessageBox(remote.getCurrentWindow(), {
        type: type,
        buttons: ["OK"],
        message: message
    });
};

const showOKCancelBox = async (type, message) => {
    const ret = await dialog.showMessageBox(remote.getCurrentWindow(), {
        type: type,
        buttons: ["OK", "Cancel"],
        message: message
    });
    return ret.response == 0;
};

module.exports = {
    selectFileDialog,
    selectFolderDialog,
    showMessageBox,
    showOKCancelBox
};