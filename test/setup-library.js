const { IPCClient } = require("../app/js/ipc-client-server");

const setupLibrary = (func) => {
    IPCClient.request("config", "get", { key:"data_dir", value:"" }).then((data_dir)=>{
        IPCClient.request("library", "load", {data_dir}).then(()=>{
            func();
        });
    });
};

module.exports = {
    setupLibrary
};