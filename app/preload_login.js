
process.once("loaded", () => {
    global.process = process;
    global.electron = require("electron");
});

window.addEventListener( "error", async e => {
    const { message, filename, lineno, colno } = e;
    const msg = `${message}\n${filename}:${lineno}`;
    global.logger.error(msg);

    try {
        await global.RendererDailog.showMessageBox("error", msg);
    } catch (error) {
        alert(msg);
    }
} );

window.addEventListener( "unhandledrejection", async e => {
    global.logger.error(e.reason);
   
    try {
        await global.RendererDailog.showMessageBox("error", e.reason.message);
    } catch (error) {
        alert(e.reason.message);
    }
} );