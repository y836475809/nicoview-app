
const IPC_CHANNEL =  Object.freeze({   
    PLAY_BY_VIDEO_ID: "ipc-play-by-video-id",
    GET_VIDEO_ITEM: "ipc-get-videoitem-data",
    GET_VIDEO_ITEM_REPLY: "ipc-get-videoitem-reply",

    SEARCH_TAG: "ipc-search-tag",
    LOAD_MYLIST: "ipc-load-mylist",
    ADD_DOWNLOAD_ITEM: "ipc-add-download-item",
    ADD_PLAY_HISTORY: "ipc-add-play-history",
    ADD_BOOKMARK: "ipc-add-bookmark",

    UPDATE_DATA: "ipc-update-data",
    RETURN_UPDATE_DATA: "ipc-return-update-data",
    CANCEL_UPDATE_DATA: "ipc-cancel-update-data",

    SHOW_PLAYER: "ipc-show-player",
    READY_PLAYER: "ipc-ready-player",
    SET_COOKIE: "ipc-set-cookie",
    SET_PLAYER_PATH: "ipc-set-player-path",

    APP_CLOSE: "ipc-app-close",
});

module.exports = {
    IPC_CHANNEL
};