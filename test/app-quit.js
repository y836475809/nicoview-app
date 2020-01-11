const { ipcRenderer } = require("electron");
const { IPC_CHANNEL } = require("../app/js/ipc-channel");

ipcRenderer.on(IPC_CHANNEL.APP_CLOSE, (event, args) => {
    ipcRenderer.send(IPC_CHANNEL.APP_CLOSE);
});