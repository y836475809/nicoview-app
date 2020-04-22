const root_dir = "..";

process.once("loaded", () => {
    global.process = process;
    global.electron = require("electron");
    global.path = require("path");
    // global.module = module;
    global.EventEmitter = require("events");
    global.IPC_CHANNEL = require(`${root_dir}/app/js/ipc-channel`);
    global.logger = require(`${root_dir}/app/js/logger`);

    if (process.env.NODE_ENV == "DEBUG") {
        global.NicoMock = require(`${root_dir}/test/mock_server/nico-mock`);
    }
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
    // global.Sortable = require("sortablejs");
    global.GridTable = require(`${root_dir}/app/js/gridtable`);
    global.DataIpc = require(`${root_dir}/app/js/data-ipc`);
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