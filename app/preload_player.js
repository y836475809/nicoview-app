const electron = require("electron");
const path = require("path");
const EventEmitter = require("events");
const Sortable = require("sortablejs");

const root_dir = path.resolve(__dirname, "..");

const IPC_CHANNEL = require(`${root_dir}/app/js/ipc-channel`);
const logger = require(`${root_dir}/app/js/logger`);

process.once("loaded", () => {
    global.process = process;
    global.electron = electron;
    global.path = path;
    global.module = module;
    global.EventEmitter = EventEmitter;
    global.IPC_CHANNEL = IPC_CHANNEL;
    global.logger = logger;

    if (process.env.NODE_ENV == "DEBUG") {
        global.NicoMock = require(`${root_dir}/test/mock_server/nico-mock`);
    }
});

window.addEventListener( "error", async e => {
    const { message, filename, lineno, colno } = e;
    const msg = `${message}\n${filename}:${lineno}`;
    logger.error(msg);
    
    try {
        await global.RemoteDailog.showMessageBox("error", msg);
    } catch (error) {
        alert(msg);
    }
} );

window.addEventListener( "unhandledrejection", async e => {
    logger.error(e.reason);
   
    try {
        await global.RemoteDailog.showMessageBox("error", e.reason.message);
    } catch (error) {
        alert(e.reason.message);
    }
} );

window.addEventListener("load", () => {
    window.$ = window.jQuery = require("jquery");
    require("slickgrid/plugins/slick.autotooltips");
    const GridTable = require(`${root_dir}/app/js/gridtable`);
    const DataIpc = require(`${root_dir}/app/js/data-ipc`);
    const RemoteDailog = require(`${root_dir}/app/js/remote-dialogs`);
    const TimeFormat = require(`${root_dir}/app/js/time-format`);
    const Niconico = require(`${root_dir}/app/js/niconico`);
    const NicoPlay = require(`${root_dir}/app/js/nico-play`);
    const NicoVideoData = require(`${root_dir}/app/js/nico-data-file`);
    const CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
    const CommentFilter = require(`${root_dir}/app/js/comment-filter`);
    const BookMark = require(`${root_dir}/app/js/bookmark`);
    const SyncCommentScroll = require(`${root_dir}/app/js/sync-comment-scroll`);

    global.Sortable = Sortable;
    global.GridTable = GridTable;
    global.DataIpc = DataIpc;
    global.RemoteDailog = RemoteDailog;
    global.TimeFormat = TimeFormat;
    global.Niconico = Niconico;
    global.NicoPlay = NicoPlay;
    global.NicoVideoData = NicoVideoData;
    global.CommentTimeLine = CommentTimeLine;
    global.CommentFilter = CommentFilter;
    global.BookMark = BookMark;
    global.SyncCommentScroll = SyncCommentScroll;
});