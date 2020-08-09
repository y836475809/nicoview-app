const { session, dialog, app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const { IPC_CHANNEL } = require("./app/js/ipc-channel");
const { ConfigIPCServer } = require("./app/js/ipc-config");
const { LibraryIPCServer } = require("./app/js/ipc-library");
const { BookMarkIPCServer } = require("./app/js/ipc-bookmark");
const { HistoryIPCServer } = require("./app/js/ipc-history");
const { DownloadItemIPCServer } = require("./app/js/ipc-download-item");
const { StoreVideoItemsIPCServer } = require("./app/js/ipc-store-video-items");
const { importNNDDDB } = require("./app/js/import-nndd-db");
const { getNicoDataFilePaths } = require("./app/js/nico-data-file");
const { JsonStore } = require("./app/js/json-store");
const { logger } = require("./app/js/logger");
const { StartupConfig } = require("./app/start-up-config");
const { CSSLoader } = require("./app/js/css-loader");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const config_ipc_server = new ConfigIPCServer();
const library_ipc_server = new LibraryIPCServer();
const bookmark_ipc_server = new BookMarkIPCServer();
const history_ipc_server = new HistoryIPCServer();
const downloaditem_ipc_server = new DownloadItemIPCServer();
const store_video_items_ipc_server = new StoreVideoItemsIPCServer();
const css_loader = new CSSLoader();

const startup_config = new StartupConfig(__dirname, process.argv);
startup_config.load();

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let main_win = null;
let player_win = null;
let do_app_quit = false;

const main_html_path = startup_config.main_html_path;
const player_html_path = startup_config.player_html_path;
const preload_main_path = startup_config.preload_main_path;
const preload_player_path = startup_config.preload_player_path;
const config_fiiename = startup_config.config_fiiename;

const is_debug = startup_config.debug;
if(is_debug===true){
    process.env.NODE_ENV = "DEBUG";

    if(startup_config.use_mock_server){
        const port = startup_config.mock_server_port;
        process.env["mock_server_port"] = port;
        process.env["mock_server_wait_msec"] = startup_config.mock_server_wait_msec;

        app.commandLine.appendSwitch("host-rules", `MAP * localhost:${port}`);
        app.commandLine.appendSwitch("proxy-server", `https://localhost:${port}`);
        app.commandLine.appendSwitch("ignore-certificate-errors", "true");
        app.commandLine.appendSwitch("allow-insecure-localhost", "true");
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        process.env["proxy_server"] = app.commandLine.getSwitchValue("proxy-server");

        console.log(`use local proxy, mock_server_port is ${port}`);
    }
}

process.env["user_agent"] = `${app.name}/${app.getVersion()}`;

process.on("uncaughtException", (error) => {
    logger.error("uncaught exception:", error);

    dialog.showMessageBoxSync({
        type: "error",
        buttons: ["OK"],
        message: `致命的エラー: ${error.message}\n終了します`
    });

    do_app_quit = true;
    app.quit();
});

process.on('unhandledRejection', (reason, p) => {
    logger.error("unhandled rejection:", p, "reason:", reason);
    dialog.showMessageBoxSync({
        type: "error",
        buttons: ["OK"],
        message: `エラー: ${reason.message}`
    });
});

const loadJson = async (name, default_value) => {
    const data_dir = await config_ipc_server.get({ key:"data_dir", value:"" });
    const file_path = path.join(data_dir, `${name}.json`);
    try {
        await fsPromises.stat(file_path);
    } catch (error) {
        return default_value;
    }

    try {
        const json_store = new JsonStore(file_path);
        return json_store.load();
    } catch (error) {
        logger.error(`loadJson ${name}`, error);

        await dialog.showMessageBox({
            type: "error",
            buttons: ["OK"],
            message: `${file_path}の読み込みに失敗\n${error.message}`
        });
        return default_value;
    }
};

const saveJson = async (name, items) => {
    const data_dir = await config_ipc_server.get({ key: "data_dir", value:"" });
    const file_path = path.join(data_dir, `${name}.json`);
    try {
        const json_store = new JsonStore(file_path);
        json_store.save(items);
    } catch (error) {
        logger.error(`saveJson ${name}`, error);

        await dialog.showMessageBox({
            type: "error",
            buttons: ["OK"],
            message: `${file_path}の保存に失敗\n${error.message}`
        });
    }

};

const getWindowState = (w) => {
    const bounds = w.getBounds(); 
    return {
        x: bounds.x, 
        y: bounds.y,  
        width: bounds.width,  
        height: bounds.height, 
        maximized: w.isMaximized()
    };
};

const setLogLevel = (level) => {
    process.env.LOG_LEVEL = level;
    logger.setLevel(level);
};

const loadCSS = async (file_path) => {
    if(!file_path){
        return;
    }
    try {
        await css_loader.load(file_path);
    } catch (error) {
        logger.error(error);
        await dialog.showMessageBox({
            type: "error",
            buttons: ["OK"],
            title: `${path.basename(file_path)}の読み込みに失敗`,
            message: error.message
        });
    }
};

const applyCSS = (win) => {
    try {
        const css = css_loader.CSS;
        if(!css){
            return;
        }
        win.webContents.insertCSS(css);
    } catch (error) {
        logger.error(error);
        dialog.showMessageBoxSync({
            type: "error",
            buttons: ["OK"],
            message: `CSSの適用に失敗: ${error.message}`
        });
    }
};

const popupInputContextMenu = (bwin, props) => {
    const { inputFieldType, editFlags } = props;
    if (inputFieldType === "plainText") {
        const input_context_menu = Menu.buildFromTemplate([
            {
                id: "canCut",
                label: "切り取り",
                role: "cut",
            }, {
                id: "canCopy",
                label: "コピー",
                role: "copy",
            }, {
                id: "canPaste",
                label: "貼り付け",
                role: "paste",
            }, {
                type: "separator",
            }, {
                id: "canSelectAll",
                label: "すべて選択",
                role: "selectall",
            },
        ]);
        input_context_menu.items.forEach(item => {
            item.enabled = editFlags[item.id];
        });
        input_context_menu.popup(bwin);
    }
};

function createWindow() {
    // ブラウザウィンドウの作成
    const state = config_ipc_server.get({ key: "main.window.state", value:{ width: 1000, height: 600 } });
    state.webPreferences =  {
        nodeIntegration: false,
        contextIsolation: false,
        preload: preload_main_path,
        spellcheck: false
    };
    main_win = new BrowserWindow(state);
    if (state.maximized) {
        main_win.maximize();
    }

    const main_menu = () => {
        const menu_templete = [
            { label: "ファイル",
                submenu: [
                    { label: "動画IDを指定して再生", click: () => {
                        main_win.webContents.send("open-video-form");
                    }}
                ]
            }, 
            { label: "ログ",
                submenu: [
                    { label: "ログファイルを開く", click() {
                        shell.openExternal(logger.getPath());
                    }},
                    { label: "ログの場所を開く", click() {
                        shell.showItemInFolder(logger.getPath());
                    }}
                ]
            },                
            { label: "ヘルプ",  
                submenu: [
                    { role: "reload" },
                    { role: "forcereload" },
                    { role: "toggledevtools" },
                ]
            },
        ];
        return Menu.buildFromTemplate(menu_templete);
    };
    main_win.setMenu(main_menu());

    main_win.webContents.on("did-finish-load", async () => { 
        applyCSS(main_win);
        main_win.webContents.send(IPC_CHANNEL.MAIN_HTML_LOADED);

        main_win.webContents.on("context-menu", (e, props) => {
            popupInputContextMenu(main_win, props);
        });
    });

    // アプリケーションのindex.htmlの読み込み
    main_win.loadURL(main_html_path);

    if(is_debug){
        // DevToolsを開く
        main_win.webContents.openDevTools();
    }

    main_win.on("close", async (e) => {        
        if(do_app_quit){
            return;
        }

        if(config_ipc_server.get({ key: "check_window_close", value:true})){
            const ret = dialog.showMessageBoxSync({
                type: "info", 
                buttons: ["OK", "Cancel"],
                message:"終了しますか?"
            });
            if(ret!=0){
                // cancel, 終了しない
                e.preventDefault();
                return;
            }
        }

        try {
            config_ipc_server.set({ key:"main.window.state", value:getWindowState(main_win) });
            await config_ipc_server.save();
        } catch (error) {
            const ret = dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `設定の保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret!=0){
                // cancel, 終了しない
                e.preventDefault();
                return;
            }
        }
        
        try {
            await library_ipc_server.save(false);
        } catch (error) {
            const ret = dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `データベースの保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret!=0){
                // cancel, 終了しない
                e.preventDefault();
                return;
            }
        }

        // devtools閉じて終了
        if(main_win){
            main_win.webContents.closeDevTools();
        }
    });

    // ウィンドウが閉じられた時に発行される
    main_win.on("closed", async () => {
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
        if (player_win !== null) {
            player_win.close();
        }
        main_win = null;
    });
}

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", async ()=>{
    try {
        const config_path = path.join(app.getPath("userData"), config_fiiename);
        config_ipc_server.handle();
        config_ipc_server.setup(config_path);
        await config_ipc_server.load();
    } catch (error) {
        const ret = await dialog.showMessageBox({
            type: "error",
            buttons: ["OK", "Cancel"],
            message: `設定読み込み失敗、初期設定で続けますか?: ${error.message}`
        });
        if(ret===0){ //OK
            config_ipc_server.clear();
        }else{ //Cancel
            do_app_quit = true;
            app.quit();
            return;
        }
    }
    try {
        await config_ipc_server.configFolder("data_dir", "DB,ブックマーク,履歴等");
        await config_ipc_server.configFolder("download.dir", "動画");
    } catch (error) {
        await dialog.showMessageBox({
            type: "error",
            buttons: ["OK"],
            message: `設定失敗、終了します: ${error.message}`
        });

        do_app_quit = true;
        app.quit();
        return;
    }

    const log_level = config_ipc_server.get({ key: "log.level", value:"info"});
    setLogLevel(log_level);

    ipcMain.on(IPC_CHANNEL.SHOW_MESSAGE, (event, args) => {
        const { type, title, message } = args;
        dialog.showMessageBoxSync({
            type: type,
            title: title,
            buttons: ["OK"],
            message: message
        });
    });

    ipcMain.on(IPC_CHANNEL.PLAY_VIDEO, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        const {video_id, online, time} = args;
        const video_item = library_ipc_server.getItem({video_id});
        player_win.webContents.send(IPC_CHANNEL.PLAY_VIDEO, {
            video_id,
            online,
            time,
            video_item,
        });
    });

    ipcMain.on(IPC_CHANNEL.ADD_PLAY_HISTORY, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_PLAY_HISTORY, args);

        const { history_item } = args;
        const video_id = history_item.id;
        const video_item = library_ipc_server.getItem({video_id});
        if(video_item===null){
            return;
        }
       
        const props = { 
            last_play_date : new Date().getTime(),
            play_count : video_item.play_count + 1
        };
        library_ipc_server.update({video_id, props});
    });

    ipcMain.on(IPC_CHANNEL.SEARCH_TAG, (event, args) => {
        main_win.focus();
        main_win.webContents.send(IPC_CHANNEL.SEARCH_TAG, args);
    });

    ipcMain.on(IPC_CHANNEL.LOAD_MYLIST, (event, args) => {
        main_win.focus();
        main_win.webContents.send(IPC_CHANNEL.LOAD_MYLIST, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_BOOKMARK, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_BOOKMARK, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_STACK_ITEMS, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_STACK_ITEMS, args);
    });

    ipcMain.handle(IPC_CHANNEL.SET_COOKIE, async (event, args) => {
        const cookies = args;
        try {
            cookies.forEach(async cookie=>{
                await session.defaultSession.cookies.set(cookie);
            });
            return "ok";
        } catch (error) {
            return "error";
        }
    });

    ipcMain.handle(IPC_CHANNEL.IMPORT_NNDD_DB, async (event, args) => {
        const { db_file_path } = args;
        const data_dir = config_ipc_server.get({ key:"data_dir", value:"" });

        if(data_dir == ""){
            return {
                result : false,
                error : new Error("データを保存するフォルダが設定されていない")
            };
        }

        try {
            const { path_data_list, video_data_list } = await importNNDDDB(db_file_path);
            library_ipc_server.setData({
                data_dir, 
                path_data_list, 
                video_data_list
            }); 
            await library_ipc_server.save();
        } catch (error) {
            return {
                result : false,
                error : error
            };   
        }

        return {
            result : true,
            error : null
        };
    });

    ipcMain.handle(IPC_CHANNEL.DELETE_LIBRARY_ITEMS, async (event, args) => {
        const { video_id } = args;

        const video_item = library_ipc_server.getItem({video_id});
        if(video_item===null){
            return {
                success:false,
                error:new Error(`${video_id}が存在しません`)
            };
        }

        try {
            await library_ipc_server.delete({ video_id });
        } catch (error) {
            return {
                success:false,
                error:error
            };
        }

        /**
         * @type {Array}
         */
        const paths = getNicoDataFilePaths(video_item);

        const exist_paths = [];
        for (let index = 0; index < paths.length; index++) {
            const file_path = paths[index];
            try {
                await fsPromises.stat(file_path);
                exist_paths.push(file_path);
            } catch (error) {}
        }

        for (let index = 0; index < exist_paths.length; index++) {
            const file_path = exist_paths[index];
            const result = shell.moveItemToTrash(file_path);
            if(!result){
                return {
                    success:false,
                    error:new Error(`${file_path}のゴミ箱への移動に失敗`)
                };
            }
        }
        return {
            success:true,
            error:null
        };
    });

    ipcMain.handle(IPC_CHANNEL.LOG_LEVEL, (event, args) => {
        const { level } = args;
        setLogLevel(level);
        main_win.webContents.send(IPC_CHANNEL.LOG_LEVEL, args);
        if(player_win !== null){
            player_win.webContents.send(IPC_CHANNEL.LOG_LEVEL, args);
        }
    });

    ipcMain.handle(IPC_CHANNEL.RELOAD_CSS, async (event, args) => {
        const { file_path } = args;
        await loadCSS(file_path);

        applyCSS(main_win);
        main_win.webContents.send(IPC_CHANNEL.MAIN_CSS_LOADED);

        applyCSS(player_win);
    });

    ipcMain.handle(IPC_CHANNEL.GET_APP_CACHE, async (event, args) => {     
        return await session.defaultSession.getCacheSize();
    });

    ipcMain.handle(IPC_CHANNEL.CLEAR_APP_CACHE, async (event, args) => {     
        await session.defaultSession.clearCache();
    });

    store_video_items_ipc_server.setup();

    library_ipc_server.on("libraryInitialized", ()=>{  
        main_win.webContents.send("libraryInitialized", {
            items:library_ipc_server.getItems()
        });
    });
    library_ipc_server.on("libraryItemUpdated", (args)=>{  
        main_win.webContents.send("libraryItemUpdated", args);
    });
    library_ipc_server.on("libraryItemAdded", (args)=>{  
        main_win.webContents.send("libraryItemAdded", args);
    });
    library_ipc_server.on("libraryItemDeleted", (args)=>{  
        main_win.webContents.send("libraryItemDeleted", args);
    });
        
    bookmark_ipc_server.setup(async (args)=>{
        const { name } = args;
        return await loadJson(name, []);
    });  
    bookmark_ipc_server.on("bookmarkItemUpdated", async (args)=>{  
        const { name, items } = args;
        await saveJson(name, items);    
    });

    const history_max = 50;
    const items = await loadJson("history", []);
    history_ipc_server.setup(history_max);  
    history_ipc_server.setData({ items });
    store_video_items_ipc_server.setData({
        key:"history", 
        items:items.map(item=>{
            return {
                video_id: item.id,
                title: item.title
            };
        })
    });

    history_ipc_server.on("historyItemUpdated", async (args)=>{  
        const items = history_ipc_server.getData();
        await saveJson("history", items);
        
        store_video_items_ipc_server.setData({
            key:"history", 
            items:items.map(item=>{
                return {
                    video_id: item.id,
                    title: item.title
                };
            })
        });
    });

    downloaditem_ipc_server.handle();
    downloaditem_ipc_server.setData({items:await loadJson("download", [])});
    downloaditem_ipc_server.on("updated", async (args)=>{  
        main_win.webContents.send("downloadItemUpdated");

        const { items }  = args;
        await saveJson("download", items);
    });

    await loadCSS(config_ipc_server.get({ key: "css_path", value:"" }));

    const user_agent = process.env["user_agent"];
    session.defaultSession.setUserAgent(user_agent);

    createWindow();
});

// すべてのウィンドウが閉じられた時にアプリケーションを終了する。
app.on("window-all-closed", () => {
    // macOSでは、Cmd + Q(終了)をユーザーが実行するまではウィンドウが全て閉じられても終了しないでおく。
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // macOS では、ドックをクリックされた時にウィンドウがなければ新しく作成する。
    if (main_win === null) {
        createWindow();
    }
});

const createPlayerWindow = () => {
    return new Promise((resolve, reject) => {
        if(player_win !== null){
            resolve();
            return;
        }
        const state = config_ipc_server.get({ key:"player.window.state", value:{ width: 800, height: 600 } });
        state.webPreferences =  {
            nodeIntegration: false,
            contextIsolation: false,
            preload: preload_player_path,
            spellcheck: false
        };
        player_win = new BrowserWindow(state);
        player_win.removeMenu();
        player_win.webContents.on("did-finish-load", async () => {
            applyCSS(player_win);
            player_win.webContents.send(IPC_CHANNEL.MAIN_HTML_LOADED);

            player_win.webContents.on("context-menu", (e, props) => {
                popupInputContextMenu(player_win, props);
            });
        });

        if (state.maximized) {
            player_win.maximize();
        }

        ipcMain.once(IPC_CHANNEL.READY_PLAYER, (event, args) => {
            if(is_debug){
                player_win.webContents.openDevTools();
            }
            player_win.on("close", (e) => {
                config_ipc_server.set({ key:"player.window.state", value:getWindowState(player_win) });
                player_win = null;
            });

            resolve();
        });

        player_win.loadURL(player_html_path);

        player_win.on("close", e => {
            if(player_win){
                player_win.webContents.closeDevTools();
            }
        });
    });  
};