const root_dir = "../..";

process.once("loaded", () => {
    global.EventEmitter = require("events");
    global.logger = require(`${root_dir}/app/js/logger`);
    global.myapi = require(`${root_dir}/app/js/my-api`);
    global.ModalDialog = require(`${root_dir}/app/js/modal-dialog`);
    global.CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
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
    global.Sortable = require("sortablejs");
    global.GridTable = require(`${root_dir}/app/js/gridtable`);
    global.TimeFormat = require(`${root_dir}/app/js/time-format`);
    global.NicoSearch = require(`${root_dir}/app/js/nico-search`);
    global.NicoVideoData = require(`${root_dir}/app/js/nico-data-file`);
    global.NicoURL = require(`${root_dir}/app/js/nico-url`);
    global.NicoMylist = require(`${root_dir}/app/js/nico-mylist`);
    global.NicoUpdate = require(`${root_dir}/app/js/nico-update`);
    global.CacheStore = require(`${root_dir}/app/js/cache-store`);
    global.VideoConverter = require(`${root_dir}/app/js/video-converter`);
    global.NicoDownloader = require(`${root_dir}/app/js/nico-downloader`);
    global.GridTableDownloadItem = require(`${root_dir}/app/js/gridtable-downloaditem`);
    global.ScheduledTask = require(`${root_dir}/app/js/scheduled-task`);
    global.ImportFile = require(`${root_dir}/app/js/import-file`);
    global.ImportNNDDSetting = require(`${root_dir}/app/js/import-nndd-setting`);
    global.NicoDataConverter = require(`${root_dir}/app/js/nico-data-converter`);
    global.Command = require(`${root_dir}/app/js/command`);
    global.MouseGesture = require(`${root_dir}/app/js/mouse-gesture`);
    global.ModalDialogUtil = require(`${root_dir}/app/js/modal-dialog-util`);
});