const { session, dialog, app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const { Config } = require("./app/js/config");
const { Library } = require("./app/js/library");
const { History } = require("./app/js/history");
const { importNNDDDB } = require("./app/js/import-nndd-db");
const { getNicoDataFilePaths } = require("./app/js/nico-data-file");
const { logger } = require("./app/js/logger");
const { StartupConfig } = require("./app/start-up-config");
const { CSSLoader } = require("./app/js/css-loader");
const { Store } = require("./app/js/store");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const config = new Config();
const library = new Library();
const history = new History();
const css_loader = new CSSLoader();
const store = new Store();

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
    const data_dir = await config.get("data_dir","");
    const file_path = path.join(data_dir, `${name}.json`);
    try {
        await fsPromises.stat(file_path);
    } catch (error) {
        return default_value;
    }

    try {
        const data = await fsPromises.readFile(file_path, "utf-8");
        return JSON.parse(data);
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
    const data_dir = await config.get("data_dir", "");
    const file_path = path.join(data_dir, `${name}.json`);
    try {
        const json = JSON.stringify(items, null, "  ");
        await fsPromises.writeFile(file_path, json, "utf-8");
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
    if(!win){
        return;
    }
    
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
    const state = config.get("main.window.state", { width: 1000, height: 600 });
    state.title = `${app.name} ${app.getVersion()}`;
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
                        main_win.webContents.send("app:open-video-form");
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
        main_win.webContents.send("app:on-load-content");

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

        if(config.get("check_window_close", true)){
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
            config.set("main.window.state", getWindowState(main_win));
            await config.save();
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
            await library.save(false);
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
        config.setup(config_path);
        await config.load();
    } catch (error) {
        const ret = await dialog.showMessageBox({
            type: "error",
            buttons: ["OK", "Cancel"],
            message: `設定読み込み失敗、初期設定で続けますか?: ${error.message}`
        });
        if(ret===0){ //OK
            config.clear();
        }else{ //Cancel
            do_app_quit = true;
            app.quit();
            return;
        }
    }
    try {
        await config.configFolder("data_dir", "DB,ブックマーク,履歴等");
        await config.configFolder("download.dir", "動画");
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

    const log_level = config.get("log.level", "info");
    setLogLevel(log_level);

    await loadCSS(config.get("css_path", ""));

    const user_agent = process.env["user_agent"];
    session.defaultSession.setUserAgent(user_agent);

    ipcMain.on("app:show-message", (event, args) => {
        const { type, title, message } = args;
        dialog.showMessageBoxSync({
            type: type,
            title: title,
            buttons: ["OK"],
            message: message
        });
    });
    
    ipcMain.on("app:play-video", async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        const {video_id, online, time} = args;
        const video_item = library.getItem(video_id);
        player_win.webContents.send("app:play-video", {
            video_id,
            online,
            time,
            video_item,
        });
    });

    ipcMain.handle("app:set-cookie", async (event, args) => {
        const cookies = args;
        try {
            for (let index = 0; index < cookies.length; index++) {
                const cookie = cookies[index];
                await session.defaultSession.cookies.set(cookie);
            }
            return "ok";
        } catch (error) {
            return "error";
        }
    });

    const app_msg_list = [
        { name:"search-tag", focus:true },
        { name:"load-mylist", focus:true },
        { name:"add-bookmark", focus:false },
        { name:"add-download-item", focus:false },
        { name:"add-stack-items", focus:false },
    ];
    app_msg_list.forEach(msg=>{
        const { name, focus } = msg;
        ipcMain.on(`app:${name}`, (event, args) => {
            if(focus){
                main_win.focus();
            }
            main_win.webContents.send(`app:${name}`, args);
        });
    });

    const hname = [
        "bookmark",
        "library-search",
        "mylist",
        "nico-search",
        "download",
        "nglist",
    ];
    hname.forEach(name=>{
        ipcMain.handle(`${name}:getItems`, async (event, args) => {
            if(!store.has(name)){
                store.setItems(name, await loadJson(name, []));
            }
            return store.getItems(name);
        });  
        ipcMain.handle(`${name}:updateItems`, async (event, args) => {
            const { items } = args;
            store.setItems(name, items);
            await saveJson(name, items);
            if(name=="download"){
                main_win.webContents.send("download:on-update-item");
            }
        });  
    });

    // download
    ipcMain.handle("download:getIncompleteIDs", async (event, args) => {
        const name = "download";
        if(!store.has(name)){
            store.setItems(name, await loadJson(name, []));
        }
        const items = store.getItems(name);
        if(!items){
            return [];
        }
        const ids = [];
        items.forEach(item => {
            if(item.state != 2){
                ids.push(item.id);
            } 
        });
        return ids;
    });

    // history
    const history_max = 50;
    const items = await loadJson("history", []);
    history.setup(history_max);  
    history.setData(items);
    ipcMain.handle("history:getItems", (event, args) => {
        return history.getData("history");
    });
    ipcMain.handle("history:updateItems", async (event, args) => {
        const { items } = args;
        history.setData(items);
        await saveJson("history", items);
    });
    ipcMain.on("history:addItem", async (event, args) => {
        const { item } = args;
        history.add(item);

        const items = history.getData();
        await saveJson("history", items);

        main_win.webContents.send("history:on-update-item", args);

        const video_id = item.id;
        const video_item = library.getItem(video_id);
        if(video_item===null){
            return;
        }
        const props = { 
            last_play_date : new Date().getTime(),
            play_count : video_item.play_count + 1
        };
        library.update(video_id, props);
    }); 

    // stack
    ipcMain.handle("stack:getItems", async (event, args) => {
        return store.getItems("stack");
    });  
    ipcMain.handle("stack:updateItems", (event, args) => {
        const { items } = args;
        store.setItems("stack", items);
    }); 

    // library
    const data_dir = config.get("data_dir", "");
    library.setup(data_dir);
    ipcMain.handle("library:addItem", async (event, args) => {
        const { item } = args;
        await library.addItem(item);
    });
    ipcMain.handle("library:addDownloadItem", async (event, args) => {
        const { download_item } = args;
        await library.addDownloadedItem(download_item);
    });
    ipcMain.handle("library:load", async (event, args) => {
        await library.load();
    });
    ipcMain.handle("library:has", (event, args) => {
        const { video_id } = args;
        return library.has(video_id);
    });
    ipcMain.handle("library:updateItemProps", async (event, args) => {
        const { video_id, props } = args;
        await library.update(video_id, props);
    });
    ipcMain.handle("library:getItem", (event, args) => {
        const { video_id } = args;
        return library.getItem(video_id);
    });
    ipcMain.handle("library:deleteItem", async (event, args) => {
        const { video_id } = args;

        const video_item = library.getItem(video_id);
        if(video_item===null){
            return {
                success:false,
                error:new Error(`${video_id}が存在しません`)
            };
        }

        try {
            await library.delete(video_id);
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
    ipcMain.handle("library:import-nndd-db", async (event, args) => {
        const { db_file_path } = args;
        const data_dir = library.dataDir;

        if(data_dir == ""){
            return {
                result : false,
                error : new Error("データを保存するフォルダが設定されていない")
            };
        }

        try {
            const { path_data_list, video_data_list } = await importNNDDDB(db_file_path);
            library.setData(
                path_data_list, 
                video_data_list
            ); 
            await library.save();
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
    library.on("libraryInitialized", ()=>{  
        main_win.webContents.send("library:on-init", {
            items:library.getItems()
        });
    });
    library.on("libraryItemUpdated", (args)=>{  
        main_win.webContents.send("library:on-update-item", args);
    });
    library.on("libraryItemAdded", (args)=>{  
        main_win.webContents.send("library:on-add-item", args);
    });
    library.on("libraryItemDeleted", (args)=>{  
        main_win.webContents.send("library:on-delete-item", args);
    });

    // config
    ipcMain.handle("config:get", (event, args) => {
        const { key, value } = args;
        return config.get(key, value);
    });
    ipcMain.handle("config:set", (event, args) => {
        const { key, value } = args;
        config.set(key, value);
    });

    // setting
    ipcMain.handle("setting:change-log-level", (event, args) => {
        const { level } = args;
        setLogLevel(level);
        main_win.webContents.send("setting:on-change-log-level", args);
        if(player_win !== null){
            player_win.webContents.send("setting:on-change-log-level", args);
        }
    });
    ipcMain.handle("setting:get-app-cache", async (event, args) => {     
        return await session.defaultSession.getCacheSize();
    });
    ipcMain.handle("setting:clear-app-cache", async (event, args) => {     
        await session.defaultSession.clearCache();
    });
    ipcMain.handle("setting:reload-css", async (event, args) => {
        const { file_path } = args;
        await loadCSS(file_path);

        applyCSS(main_win);
        main_win.webContents.send("setting:on-reload-css");

        applyCSS(player_win);
    });

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
        const state = config.get("player.window.state", { width: 800, height: 600 });
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
            player_win.webContents.send("app:on-load-content");

            player_win.webContents.on("context-menu", (e, props) => {
                popupInputContextMenu(player_win, props);
            });
        });

        if (state.maximized) {
            player_win.maximize();
        }

        ipcMain.once("app:on-ready-player", (event, args) => {
            if(is_debug){
                player_win.webContents.openDevTools();
            }
            player_win.on("close", (e) => {
                config.set("player.window.state", getWindowState(player_win));
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