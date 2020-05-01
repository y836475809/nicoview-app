const { DataIpcRenderer } = require("../app/js/ipc");

const setupLibrary = (func) => {
    DataIpcRenderer.action("config", "get", { key:"data_dir", value:"" }).then((data_dir)=>{
        DataIpcRenderer.action("library", "load", {data_dir}).then(()=>{
            func();
        });
    });
};

module.exports = {
    setupLibrary
};