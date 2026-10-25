import { contextBridge, ipcRenderer } from  'electron';

/** @type {api['invoke']} */
const invokeIpc = (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
};

/** @type {api['on']} */
const onIpc = (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => {
        func(...args);
    });
};

contextBridge.exposeInMainWorld('electronAPI', {
    invoke: invokeIpc,
    on: onIpc
});
