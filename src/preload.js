const { logger } = require("../src/lib/logger");

process.once("loaded", () => {
    if(process.env["test_nicoappview"] ?? false){
        logger.debug("test_nicoappview");
        global.TestComments = require("../test/test-comments");
        global.TestTag = require("../test/test-tag");
    }
});

window.addEventListener( "error", async e => {
    const { message, filename, lineno, colno } = e; // eslint-disable-line no-unused-vars
    const msg = `${message}\n${filename}:${lineno}`;
    logger.error(msg);
    alert(msg);
} );

window.addEventListener( "unhandledrejection", async e => {
    logger.error(e.reason);
    alert(e.reason.message);
} );

window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    if(params.get("window") == "main"){
        global.RiotJS = {
            Listview      : require("./renderer/common/listview.riot.js"),
            ModalDialog   : require("./renderer/common/modal-dialog.riot.js"),
            SettingPage   : require("./renderer/main/setting.riot.js"),
            HistoryPage   : require("./renderer/main/history.riot.js"),
            DownloadPage  : require("./renderer/main/download-list.riot.js"),
            DownloadSch   : require("./renderer/main/download-schedule.riot.js"),
            MyListSidebar : require("./renderer/main/mylist-sidebar.riot.js"),
            MyListContent : require("./renderer/main/mylist-content.riot.js"),
            SearchSidebar : require("./renderer/main/search-sidebar.riot.js"),
            PagingNation  : require("./renderer/main/pagination.riot.js"),
            SearchContent : require("./renderer/main/search-content.riot.js"),
            LibraryContent: require("./renderer/main/library-content.riot.js"),
            LibrarySidebar: require("./renderer/main/library-sidebar.riot.js"),
            BookmarkPage  : require("./renderer/main/bookmark.riot.js"),
            PlayStackPage : require("./renderer/main/play-stack.riot.js"),
            MainPage      : require("./renderer/main/main.riot.js")
        };
    }
    if(params.get("window") == "player"){
        global.RiotJS = {
            Listview                : require("./renderer/common/listview.riot.js"),
            ModalDialog             : require("./renderer/common/modal-dialog.riot.js"),
            OpenVideoForm           : require("./renderer/player/open-video-form.riot.js"),
            PlayerInfoPage          : require("./renderer/player/player-info.riot.js"),
            PlayerMainPage          : require("./renderer/player/player-main.riot.js"),
            PlayerPage              : require("./renderer/player/player.riot.js"),
            PlayerSeek              : require("./renderer/player/player-seek.riot.js"),
            PlayerTags              : require("./renderer/player/player-tags.riot.js"),
            PlayerUser              : require("./renderer/player/player-user.riot.js"),
            PlayerVideo             : require("./renderer/player/player-video.riot.js"),
            PlayerVolume            : require("./renderer/player/player-volume.riot.js"),
            PlayerControls          : require("./renderer/player/player-controls.riot.js"),
            PlayerSettingDialog     : require("./renderer/player/player-setting-dialog.riot.js"),
            SettingDisplayComment   : require("./renderer/player/setting-display-comment.riot.js"),
            SettingNGComment        : require("./renderer/player/setting-ng-comment.riot.js"),
            SettingPlayerContextMenu: require("./renderer/player/setting-player-contextmenu.riot.js"),
        };
    }
});