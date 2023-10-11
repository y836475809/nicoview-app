
const setupPreload = () => {
    const { logger } = require("./logger");

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

    /**
     * 
     * @param {string[]} module_names 
     * @param {string} dir_name 
     */
    const loadRiot = (module_names, dir_name) => {
        module_names.forEach(name => {
            const fname = `${name}.riot.js`;
            global.NicoRiot[fname] = require(`../renderer/${dir_name}/${fname}`);
        });
    };

    window.addEventListener("load", () => {
        global.NicoRiot = {};

        loadRiot([
            "listview", 
            "modal-dialog"
        ], "common");

        const params = new URLSearchParams(window.location.search);
        if(params.get("window") == "main"){
            loadRiot([
                "main",
                "bookmark",
                "play-stack",
                "library-content",
                "library-sidebar",
                "pagination",
                "search-sidebar",
                "search-content",
                "mylist-sidebar",
                "mylist-content",
                "download-list",
                "download-schedule",
                "history",
                "setting",
            ], "main");
        }
        if(params.get("window") == "player"){
            loadRiot([
                "open-video-form",
                "player-info",
                "player-main",
                "player",
                "player-seek",
                "player-tags",
                "player-user",
                "player-video",
                "player-volume",
                "player-controls",
                "player-setting-dialog",
                "setting-display-comment",
                "setting-ng-comment",
                "setting-player-contextmenu",
            ], "player");
        }
    });
};

module.exports = {
    setupPreload,
};
