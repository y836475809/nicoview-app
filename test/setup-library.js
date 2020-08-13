const ipc = require("electron").ipcRenderer;

const setupLibrary = (func) => {
    ipc.invoke("library:load").then(()=>{
        func();
    });
};

module.exports = {
    setupLibrary
};