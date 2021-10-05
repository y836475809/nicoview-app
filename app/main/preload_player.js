const root_dir = "../..";

process.once("loaded", () => {
    global.EventEmitter = require("events");
    global.logger = require(`${root_dir}/app/js/logger`);
    global.myapi = require(`${root_dir}/app/js/my-api`);
    global.ModalDialog = require(`${root_dir}/app/js/modal-dialog`);
    global.MyObservable = require(`${root_dir}/app/js/my-observable`);
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

window.addEventListener("load", () => {
    global.GridTable = require(`${root_dir}/app/js/gridtable`);
    global.TimeFormat = require(`${root_dir}/app/js/time-format`);
    global.Niconico = require(`${root_dir}/app/js/niconico`); //TODO
    global.NicoPlay = require(`${root_dir}/app/js/nico-play`);
    global.NicoUpdate = require(`${root_dir}/app/js/nico-update`);
    global.NicoVideoData = require(`${root_dir}/app/js/nico-data-file`);
    global.NicoURL = require(`${root_dir}/app/js/nico-url`);
    global.CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
    global.CommentFilter = require(`${root_dir}/app/js/comment-filter`);
    global.SyncCommentScroll = require(`${root_dir}/app/js/sync-comment-scroll`);
    global.Command = require(`${root_dir}/app/js/command`);
    global.ImgCacheStore = require(`${root_dir}/app/js/img-cache-store`);
});