const electron = require("electron");
const path = require("path");
const EventEmitter = require("events");
const Sortable = require("sortablejs");

const root_dir = path.resolve(__dirname, "..");

const { getPathFromRoot } = require(`${root_dir}/app/util`);
const IPC_CHANNEL = require(`${root_dir}/app/js/ipc-channel`);
const DataIpc = require(`${root_dir}/app/js/data-ipc`);
const logger = require(`${root_dir}/app/js/logger`);

process.once("loaded", () => {
    global.process = process;
    global.electron = electron;
    global.path = path;
    global.module = module;
    global.EventEmitter = EventEmitter;

    global.IPC_CHANNEL = IPC_CHANNEL;
    global.DataIpc = DataIpc;
    global.getPathFromRoot = getPathFromRoot;
    global.logger = logger;

    if (process.env.NODE_ENV == "DEBUG") {
        global.NicoMock = require(`${root_dir}/test/mock_server/nico-mock`);
        global.NicoHttpServer = require(`${root_dir}/test/mock_server/http-server`);
        global.CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
        global.TestComments = require(`${root_dir}/test/test-comments`);
        global.SetupLibrary = require(`${root_dir}/test/setup-library`);
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
    const RemoteDailog = require(`${root_dir}/app/js/remote-dialogs`);
    const TimeFormat = require(`${root_dir}/app/js/time-format`);
    const NicoSearch = require(`${root_dir}/app/js/nico-search`);
    const NicoVideoData = require(`${root_dir}/app/js/nico-data-file`);
    const NicoMylist = require(`${root_dir}/app/js/nico-mylist`);
    const NicoUpdate = require(`${root_dir}/app/js/nico-update`);
    const History = require(`${root_dir}/app/js/history`);
    const JsonStore = require(`${root_dir}/app/js/json-store`);
    const BookMark = require(`${root_dir}/app/js/bookmark`);
    const CacheStore = require(`${root_dir}/app/js/cache-store`);
    const VideoConverter = require(`${root_dir}/app/js/video-converter`);
    const NicoDownloader = require(`${root_dir}/app/js/nico-downloader`);
    const GridTableDownloadItem = require(`${root_dir}/app/js/gridtable-downloaditem`);
    const ScheduledTask = require(`${root_dir}/app/js/scheduled-task`);
    const ImportLibrary = require(`${root_dir}/app/js/import-library`);
    const NicoDataConverter = require(`${root_dir}/app/js/nico-data-converter`);

    global.Sortable = Sortable;
    global.GridTable = GridTable;
    global.RemoteDailog = RemoteDailog;
    global.TimeFormat = TimeFormat;
    global.NicoSearch = NicoSearch;
    global.NicoVideoData = NicoVideoData;
    global.NicoMylist = NicoMylist;
    global.NicoUpdate = NicoUpdate;
    global.History = History;
    global.JsonStore = JsonStore;
    global.BookMark = BookMark;
    global.CacheStore = CacheStore;
    global.VideoConverter = VideoConverter;
    global.NicoDownloader = NicoDownloader;
    global.GridTableDownloadItem = GridTableDownloadItem;
    global.ScheduledTask = ScheduledTask;
    global.ImportLibrary = ImportLibrary;
    global.NicoDataConverter = NicoDataConverter;
});