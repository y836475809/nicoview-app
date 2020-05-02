const { ipcRenderer, ipcMain } = require("electron");
const EventEmitter = require("events");

const channel_map = {
    library: "ipc-library-request",
    bookmark: "ipc-bookmark-request",
    history: "ipc-history-request",
    downloaditem: "ipc-downloaditem-request",
    config: "ipc-config-request",
};

class IPCClient {
    static async request(name, method, args) {
        const channel = channel_map[name];
        if (channel===undefined) {
            throw new Error(`IPCClient request: ${name} is not find`);
        }   
        return await ipcRenderer.invoke(channel, {method, args});
    }
}

class IPCServer extends EventEmitter {
    constructor(name){
        super();
        this.name = name;
    }

    handle(){  
        this.channel = channel_map[this.name];
        if (this.channel===undefined) {
            throw new Error(`IPCServer, ${this.name} is not find`);
        }   

        ipcMain.removeHandler(this.channel);
        ipcMain.handle(this.channel, async (event, _args) => {
            const { method, args } = _args;
            const func = this[method];
            if(func.constructor.method === "AsyncFunction"){
                return await this[method](args);
            }else{
                return this[method](args);
            }
        });
    }
}

module.exports = {
    IPCClient,
    IPCServer,
};
