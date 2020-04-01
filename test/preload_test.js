const electron = require("electron");
const path = require("path");
const fs = require("fs");
const EventEmitter = require("events");
const Sortable = require("sortablejs");

const root_dir = path.resolve(__dirname, "..");
const { getPathFromRoot } = require(`${root_dir}/app/util`);
const IPC_CHANNEL = require(`${root_dir}/app/js/ipc-channel`);
const DataIpc = require(`${root_dir}/app/js/data-ipc`);
const NicoMock = require(`${root_dir}/test/mock_server/nico-mock`);
const NicoHttpServer = require(`${root_dir}/test/mock_server/http-server`);
const Niconico = require(`${root_dir}/app/js/niconico`);
const NicoPlay = require(`${root_dir}/app/js/nico-play`);
const CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
const CommentFilter = require(`${root_dir}/app/js/comment-filter`);
const TestComments = require(`${root_dir}/test/test-comments`);
const NicoDataParser = require(`${root_dir}/app/js/nico_data_parser`);
const ImportLibrary = require(`${root_dir}/app/js/import-library`);

process.once("loaded", () => {
    global.process = process;
    global.electron = electron;
    global.path = path;
    global.fs = fs;
    global.module = module;
    global.EventEmitter = EventEmitter;
    global.IPC_CHANNEL = IPC_CHANNEL;
    global.DataIpc = DataIpc;
    global.getPathFromRoot = getPathFromRoot;
    global.NicoMock = NicoMock;
    global.NicoHttpServer = NicoHttpServer;
    global.Niconico = Niconico;
    global.NicoPlay = NicoPlay;
    global.CommentTimeLine = CommentTimeLine;
    global.CommentFilter = CommentFilter;
    global.TestComments = TestComments;
    global.NicoDataParser = NicoDataParser;
    global.ImportLibrary = ImportLibrary;
});

window.addEventListener("load", () => {
    try {
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
        const SyncCommentScroll = require(`${root_dir}/app/js/sync-comment-scroll`);
        
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
        global.SyncCommentScroll = SyncCommentScroll;
    } catch (error) {
        console.error(error);
        throw error;
    }
});