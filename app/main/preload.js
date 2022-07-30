
process.once("loaded", () => {
    global.logger = require("../../app/js/logger");
    global.myapi = require("../../app/js/my-api");

    if(process.env["test_nicoappview"] ?? false){
        global.logger.logger.debug("test_nicoappview");
        
        global.TestComments = require("../../test/test-comments");
        global.TestTag = require("../../test/test-tag");
    }
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
    const params = new URLSearchParams(window.location.search);
    if(params.get("window") == "main"){
        global.RiotJS = {
            Listview      : require("../pages/common/listview.riot.js"),
            ModalDialog   : require("../pages/common/modal-dialog.riot.js"),
            SettingPage   : require("../pages/setting-page/setting-page.riot.js"),
            HistoryPage   : require("../pages/history-page/history-page.riot.js"),
            DownloadPage  : require("../pages/download-page/download-page.riot.js"),
            SettingDlSch  : require("../pages/download-page/setting-download-schedule.riot.js"),
            MyListSidebar : require("../pages/mylist-page/mylist-sidebar.riot.js"),
            MyListContent : require("../pages/mylist-page/mylist-content.riot.js"),
            SearchSidebar : require("../pages/search-page/search-sidebar.riot.js"),
            PagingNation  : require("../pages/search-page/pagination.riot.js"),
            SearchContent : require("../pages/search-page/search-content.riot.js"),
            LibraryContent: require("../pages/library-page/library-content.riot.js"),
            LibrarySidebar: require("../pages/library-page/library-sidebar.riot.js"),
            BookmarkPage  : require("../pages/main-page/bookmark-page.riot.js"),
            PlayStackPage : require("../pages/main-page/play-stack-page.riot.js"),
            MainPage      : require("../pages/main-page/main-page.riot.js")
        };
    }
    if(params.get("window") == "player"){
        global.RiotJS = {
            Listview                : require("../pages/common/listview.riot.js"),
            ModalDialog             : require("../pages/common/modal-dialog.riot.js"),
            OpenVideoForm           : require("../pages/player-page/open-video-form.riot.js"),
            PlayerInfoPage          : require("../pages/player-page/player-info-page.riot.js"),
            PlayerMainPage          : require("../pages/player-page/player-main-page.riot.js"),
            PlayerPage              : require("../pages/player-page/player-page.riot.js"),
            PlayerSeek              : require("../pages/player-page/player-seek.riot.js"),
            PlayerTags              : require("../pages/player-page/player-tags.riot.js"),
            PlayerUser              : require("../pages/player-page/player-user.riot.js"),
            PlayerVideo             : require("../pages/player-page/player-video.riot.js"),
            PlayerVolume            : require("../pages/player-page/player-volume.riot.js"),
            PlayerControls          : require("../pages/player-page/player-controls.riot.js"),
            PlayerSettingDialog     : require("../pages/player-page/player-setting-dialog.riot.js"),
            SettingDisplayComment   : require("../pages/player-page/setting-display-comment.riot.js"),
            SettingNGComment        : require("../pages/player-page/setting-ng-comment.riot.js"),
            SettingPlayerContextMenu: require("../pages/player-page/setting-player-contextmenu.riot.js"),
        };
    }
});