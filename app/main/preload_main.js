const root_dir = "../..";

process.once("loaded", () => {
    global.EventEmitter = require("events");
    global.logger = require(`${root_dir}/app/js/logger`);
    global.myapi = require(`${root_dir}/app/js/my-api`);
    global.CommentTimeLine = require(`${root_dir}/app/js/comment-timeline`);
    global.MyObservable = require(`${root_dir}/app/js/my-observable`);
});

window.addEventListener( "error", async e => {
    const { message, filename, lineno, colno } = e; // eslint-disable-line no-unused-vars
    const msg = `${message}\n${filename}:${lineno}`;
    global.logger.logger.error(msg);
    alert(msg);
} );

window.addEventListener( "unhandledrejection", async e => {
    global.logger.logger.error(e.reason);
    alert(e.reason.message);
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
    global.ModalDialog = require(`${root_dir}/app/js/modal-dialog`);
    global.ModalDialogUtil = require(`${root_dir}/app/js/modal-dialog-util`);

    global.RiotJS = {
        Listview : require("../pages/common/listview.riot.js"),
        ModalDialog : require("../pages/common/modal-dialog.riot.js"),
        SettingPage : require("../pages/setting-page/setting-page.riot.js"),
        HistoryPage : require("../pages/history-page/history-page.riot.js"),
        DownloadPage : require("../pages/download-page/download-page.riot.js"),
        SettingDlSch : require("../pages/download-page/setting-download-schedule.riot.js"),
        MyListSidebar : require("../pages/mylist-page/mylist-sidebar.riot.js"),
        MyListContent : require("../pages/mylist-page/mylist-content.riot.js"),
        SearchSidebar : require("../pages/search-page/search-sidebar.riot.js"),
        PagingNation : require("../pages/search-page/pagination.riot.js"),
        SearchContent : require("../pages/search-page/search-content.riot.js"),
        LibraryContent : require("../pages/library-page/library-content.riot.js"),
        LibrarySidebar : require("../pages/library-page/library-sidebar.riot.js"),
        BookmarkPage : require("../pages/main-page/bookmark-page.riot.js"),
        PlayStackPage : require("../pages/main-page/play-stack-page.riot.js"),
        MainPage : require("../pages/main-page/main-page.riot.js")
    };
});