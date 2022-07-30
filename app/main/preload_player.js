const root_dir = "../..";

process.once("loaded", () => {
    global.EventEmitter = require("events");
    global.logger = require(`${root_dir}/app/js/logger`);
    global.myapi = require(`${root_dir}/app/js/my-api`);
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
    global.ModalDialog = require(`${root_dir}/app/js/modal-dialog`);

    global.RiotJS = {
        Listview    : require("../pages/common/listview.riot.js"),
        ModalDialog : require("../pages/common/modal-dialog.riot.js"),
        OpenVideoForm : require("../pages/player-page/open-video-form.riot.js"),
        PlayerInfoPage : require("../pages/player-page/player-info-page.riot.js"),
        PlayerMainPage : require("../pages/player-page/player-main-page.riot.js"),
        PlayerPage : require("../pages/player-page/player-page.riot.js"),
        PlayerSeek : require("../pages/player-page/player-seek.riot.js"),
        PlayerTags : require("../pages/player-page/player-tags.riot.js"),
        PlayerUser : require("../pages/player-page/player-user.riot.js"),
        PlayerVideo : require("../pages/player-page/player-video.riot.js"),
        PlayerVolume : require("../pages/player-page/player-volume.riot.js"),
        PlayerControls : require("../pages/player-page/player-controls.riot.js"),
        PlayerSettingDialog : require("../pages/player-page/player-setting-dialog.riot.js"),
        SettingDisplayComment : require("../pages/player-page/setting-display-comment.riot.js"),
        SettingNGComment : require("../pages/player-page/setting-ng-comment.riot.js"),
        SettingPlayerContextMenu: require("../pages/player-page/setting-player-contextmenu.riot.js"),
    };
});