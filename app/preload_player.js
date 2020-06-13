const root_dir = "..";

process.once("loaded", () => {
    global.process = process;
    global.electron = require("electron");
    global.path = require("path");
    global.EventEmitter = require("events");
    global.IPC_CHANNEL = require(`${root_dir}/app/js/ipc-channel`);
    global.logger = require(`${root_dir}/app/js/logger`);
});

window.addEventListener( "error", async e => {
    const { message, filename, lineno, colno } = e;
    const msg = `${message}\n${filename}:${lineno}`;
    global.logger.error(msg);
    
    try {
        await global.RemoteDailog.showMessageBox("error", msg);
    } catch (error) {
        alert(msg);
    }
} );

window.addEventListener( "unhandledrejection", async e => {
    global.logger.error(e.reason);
   
    try {
        await global.RemoteDailog.showMessageBox("error", e.reason.message);
    } catch (error) {
        alert(e.reason.message);
    }
} );

window.addEventListener("load", () => {
    window.$ = window.jQuery = require("jquery");
    require("slickgrid/plugins/slick.autotooltips");
    require("slickgrid/plugins/slick.resizer");
    global.GridTable = require(`${root_dir}/app/js/gridtable`);
    global.IPC = require(`${root_dir}/app/js/ipc-client-server`);
    global.RemoteDailog = require(`${root_dir}/app/js/remote-dialogs`);
    global.TimeFormat = require(`${root_dir}/app/js/time-format`);
    global.Niconico = require(`${root_dir}/app/js/niconico`); //TODO
    global.NicoPlay = require(`${root_dir}/app/js/nico-play`);
    global.NicoVideoData = require(`${root_dir}/app/js/nico-data-file`);
    global.CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
    global.CommentFilter = require(`${root_dir}/app/js/comment-filter`);
    global.BookMark = require(`${root_dir}/app/js/bookmark`);
    global.SyncCommentScroll = require(`${root_dir}/app/js/sync-comment-scroll`);
    global.ToastWrapper = require(`${root_dir}/app/js/toast-wrapper`);
});