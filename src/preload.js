const { contextBridge, ipcRenderer } = require('electron');

/** @type {IpcChannels} */
const ppp = {
    'library:getItems': async (event) => {
        return [];
    }
};
