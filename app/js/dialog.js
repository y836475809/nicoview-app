const { dialog } = require("electron");

const showMessageBox = async (bw, type, title, message, okcancel) => {
    const ret = await dialog.showMessageBox(bw, {
        type: type,
        title: title,
        buttons:okcancel?["OK","Cancel"]:["OK"],
        message: message
    });
    return ret.response == 0;
};

const selectFileDialog = async (bw, name, exts)=>{
    const result = await dialog.showOpenDialog(bw, {
        properties: ["openFile"],
        title: "ファイルを選択",
        defaultPath: ".",
        filters: [
            {name: name, extensions: exts}, 
            {name: "All", extensions: ["*"]},
        ]
    });
    if(result.canceled===true){
        return null;
    }
    return result.filePaths[0];
};

const selectFolderDialog = async (bw)=>{
    const result = await dialog.showOpenDialog(bw, {
        properties: ["openDirectory"],
        title: "フォルダを選択",
        defaultPath: "."
    });
    if(result.canceled===true){
        return null;
    }
    return result.filePaths[0];
};

module.exports = {
    showMessageBox,
    selectFileDialog,
    selectFolderDialog,
};