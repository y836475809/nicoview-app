const { IPCClient } = require("../app/js/ipc-client-server");

const setupLibrary = (func) => {
    IPCClient.action("config", "get", { key:"data_dir", value:"" }).then((data_dir)=>{
        IPCClient.action("library", "load", {data_dir}).then(()=>{
            func();
        });
    });
};

module.exports = {
    setupLibrary
};