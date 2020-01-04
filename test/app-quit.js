const { IPCMain, IPCRenderMonitor } = require("../app/js/ipc-monitor");
const ipc_monitor = new IPCRenderMonitor();
ipc_monitor.listen();
const ipc_main = new IPCMain();

ipc_monitor.on(ipc_monitor.IPCMsg.APP_CLOSE, (event, args) => {
    ipc_main.send(ipc_main.IPCMsg.APP_CLOSE);
});