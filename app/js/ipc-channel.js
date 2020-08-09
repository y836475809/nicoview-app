
const IPC_CHANNEL =  Object.freeze({
    PLAY_VIDEO: "ipc-play-video",

    SEARCH_TAG: "ipc-search-tag",
    LOAD_MYLIST: "ipc-load-mylist",
    ADD_DOWNLOAD_ITEM: "ipc-add-download-item",
    ADD_PLAY_HISTORY: "ipc-add-play-history",
    ADD_BOOKMARK: "ipc-add-bookmark",
    ADD_STACK_ITEMS: "ipc-add-stack-items",

    SHOW_PLAYER: "ipc-show-player",
    READY_PLAYER: "ipc-ready-player",
    SET_COOKIE: "ipc-set-cookie",
    IMPORT_NNDD_DB: "ipc-import-nndd-db",

    DELETE_LIBRARY_ITEMS: "ipc-delete-library-items",

    APP_CLOSE: "ipc-app-close",

    LOG_LEVEL: "ipc-log-level",

    RELOAD_CSS: "ipc-reload-css",
    MAIN_CSS_LOADED: "ipc-main-css-loaded",

    GET_APP_CACHE: "ipc-get-app-cache",
    CLEAR_APP_CACHE: "ipc-clear-app-cache",

    MAIN_HTML_LOADED: "ipc-main-html-loaded",

    SHOW_MESSAGE: "ipc-show-messgae",

});

module.exports = {
    IPC_CHANNEL
};