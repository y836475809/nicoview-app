
const setupMain = (main_html_path, player_html_path, preload_path, css_dir, config_filename) => {
    const { session, dialog, app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
    const fs = require("fs");
    const fsPromises = fs.promises;
    const path = require("path");

    process.env["user_agent"] = `${app.name}/${app.getVersion()}`;

    const { Config } = require("./config");
    const { Library } = require("./library");
    const { History } = require("./history");
    const { importNNDDDB } = require("./import-nndd-db");
    const { getNicoDataFilePaths } = require("./nico-data-file");
    const { logger } = require("./logger");
    const { Store } = require("./store");
    const { selectFileDialog, selectFolderDialog, showMessageBox } = require("./dialog");
    const { setupContextmenu } = require("./contextmenu");

    const { 
        JsonStore, UserCSS, UserIconCache,
        getWindowState,
        setLogLevel,
        popupInputContextMenu,
        selectFolder } = require("./util");

    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

    const config = new Config();
    const library = new Library();
    const history = new History();
    const store = new Store();
    const user_css = new UserCSS();
    const json_store = new JsonStore(async ()=>{
        return await config.get("data_dir", "");
    });
    const user_icon_cache = new UserIconCache();

    // ウィンドウオブジェクトをグローバル参照をしておくこと。
    // しないと、ガベージコレクタにより自動的に閉じられてしまう。
    /** @type {BrowserWindow} */
    let main_win = null;
    let main_win_menu = null;

    /** @type {BrowserWindow} */
    let player_win = null;
    let do_app_quit = false;

    process.on("uncaughtException", (error) => {
        logger.error("uncaught exception:", error);

        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: "error",
            buttons: ["OK"],
            message: `致命的エラー: ${error.message}\n終了します`
        });

        do_app_quit = true;
        app.quit();
    });

    process.on('unhandledRejection', (reason, p) => {
        logger.error("unhandled rejection:", p, "reason:", reason);
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: "error",
            buttons: ["OK"],
            message: `エラー: ${reason.message}`
        });
    });

    const setupConfig = async () => {
        try {
            const config_path = path.join(app.getPath("userData"), config_filename);
            config.setup(config_path);
            await config.load();
        } catch (error) {
            const ret = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `設定読み込み失敗、初期設定で続けますか?: ${error.message}`
            });
            if(ret===0){ 
                //OK
                config.clear();
            }else{ 
                //Cancel
                return false;
            }
        }
        
        try {
            [
                { key:"data_dir", title:"DB,ブックマーク,履歴等" }, 
                { key:"download.dir", title:"動画" }
            ].forEach(param => {
                const { key, title } = param;
                const cfg_dir = config.get(key, undefined);
                const select_dir = selectFolder(cfg_dir, `${title}を保存するフォルダの選択`);
                if (!select_dir) {
                    throw new Error(`${title}を保存するフォルダが選択されていない`);
                }
                config.set(key, select_dir);
            });
        } catch (error) {
            dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: "error",
                buttons: ["OK"],
                message: `設定失敗、終了します: ${error.message}`
            });
            return false;
        }  

        return true;
    };

    const quit = async () => {
        const close_ret = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: "info", 
            buttons: ["OK", "Cancel"],
            message:"終了しますか?"
        });
        if(close_ret!=0){
            // cancel, 終了しない
            return false;
        }

        try {
            config.set("main.window.state", getWindowState(main_win));
            await config.save();
        } catch (error) {
            const ret = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `設定の保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret!=0){
                // cancel, 終了しない
                return false;
            }
        }
        
        try {
            await library.save(false);
        } catch (error) {
            const ret = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `データベースの保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret!=0){
                // cancel, 終了しない
                return false;
            }
        }

        return true;
    };

    const changeLogLevel = (args) => {
        const { level } = args;
        config.set("log.level", level);
        setLogLevel(level);
        main_win.webContents.send("setting:on-change-log-level", args);
        if(player_win !== null){
            player_win.webContents.send("setting:on-change-log-level", args);
        }
    };

    const createMainWindow = () => {
        // ブラウザウィンドウの作成
        const state = config.get("main.window.state", { width: 1000, height: 600 });
        state.title = `${app.name} ${app.getVersion()}`;
        state.webPreferences =  {
            backgroundThrottling: false,
            nodeIntegration: false,
            contextIsolation: false,
            preload: preload_path,
            spellcheck: false,
            sandbox: false
        };
        main_win = new BrowserWindow(state);
        if (state.maximized) {
            main_win.maximize();
        }

        const main_menu = () => {
            const menu_templete = [
                { label: "ログ",
                    submenu: [
                        { label: "ログファイルを開く", click() {
                            shell.openExternal(logger.getPath());
                        }},
                        { label: "ログの場所を開く", click() {
                            shell.showItemInFolder(logger.getPath());
                        }},
                        { type: "separator" },
                        { id: "log-level", label: "debugレベルで取得", type: "checkbox", checked: false, click(e) {
                            const level = e.checked?"debug":"info";
                            changeLogLevel({level});
                        }}
                    ]
                },
                { label: "ヘルプ",  
                    submenu: [
                        { role: "reload" },
                        { role: "forcereload" },
                        { role: "toggledevtools" },
                        { type: "separator" },
                        { id: "open-devtools", label: "起動時にdevtoolsを開く", type: "checkbox", checked: false, click(e) {
                            config.set("open_devtools", e.checked);
                        }},
                        { label: "設定ファイルの場所を開く", async click() {
                            await shell.showItemInFolder(config.config_path);
                        }}
                    ]
                },
            ];
            return Menu.buildFromTemplate(menu_templete);
        };
        
        main_win_menu = main_menu();
        main_win.setMenu(main_win_menu);

        [
            ["log-level", config.get("log.level", "info")=="debug"], 
            ["open-devtools", config.get("open_devtools", false)]
        ].forEach(item => {
            const menu_id = item[0];
            const checked = item[1];
            const menu_item = main_win_menu.getMenuItemById(menu_id);
            menu_item.checked = checked;
        });

        main_win.webContents.once("dom-ready", async () => { 
            user_css.apply(main_win);
        });

        main_win.webContents.on("context-menu", (e, props) => {
            popupInputContextMenu(main_win, props);
        });

        // アプリケーションのindex.htmlの読み込み
        main_win.loadURL(`${main_html_path}?window=main`);

        if(config.get("open_devtools", false)){
            // DevToolsを開く
            main_win.webContents.openDevTools();
        }

        main_win.on("close", async (e) => {        
            if(do_app_quit){
                if(main_win){
                    main_win.webContents.closeDevTools();
                }
                return;
            }

            e.preventDefault();
            if(await quit()){
                // devtools閉じて終了
                if(main_win){
                    main_win.webContents.closeDevTools();
                }         
                do_app_quit = true;
                app.quit(); 
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
    };

    const createPlayerWindow = () => {
        return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
            if(player_win !== null){
                resolve();
                return;
            }
            const state = config.get("player.window.state", { width: 800, height: 600 });
            state.webPreferences =  {
                backgroundThrottling: false,
                nodeIntegration: false,
                contextIsolation: false,
                preload: preload_path,
                spellcheck: false,
                sandbox: false
            };
            player_win = new BrowserWindow(state);
            player_win.removeMenu();
            
            player_win.webContents.once("dom-ready", async () => { 
                user_css.apply(player_win);
            });
            
            player_win.webContents.on("context-menu", (e, props) => {
                popupInputContextMenu(player_win, props);
            });

            if (state.maximized) {
                player_win.maximize();
            }

            ipcMain.once("app:player-ready", (event, args) => { // eslint-disable-line no-unused-vars
                if(config.get("open_devtools", false)){
                    player_win.webContents.openDevTools();
                }
                player_win.on("close", (e) => { // eslint-disable-line no-unused-vars
                    config.set("player.window.state", getWindowState(player_win));
                    player_win = null;
                });

                resolve();
            });

            player_win.loadURL(`${player_html_path}?window=player`);

            player_win.on("close", e => { // eslint-disable-line no-unused-vars
                if(player_win){
                    player_win.webContents.closeDevTools();
                }
            });
        });  
    };

    // このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
    // 幾つかのAPIはこのイベントの後でしか使えない。
    app.on("ready", async ()=>{
        if(!await setupConfig()){
            do_app_quit = true;
            app.quit(); 
            return;
        }

        const log_level = config.get("log.level", "info");
        setLogLevel(log_level);

        const user_css_path = app.isPackaged?
            path.join(process.resourcesPath, "user.css") // リリース時はリソースフォルダのuser.cssを使用
            :path.join(css_dir, "user.css"); // 開発、デバッグ時はcss/user.cssを使用
        await user_css.load(user_css_path);

        const user_agent = process.env["user_agent"];
        session.defaultSession.setUserAgent(user_agent);

        // dialog
        ipcMain.handle("app:show-message-box", async (event, args) => {
            const { type, title, message, okcancel} = args;
            const bw = BrowserWindow.fromId(event.sender.id);
            return showMessageBox(bw, type, title, message, okcancel);
        });
        ipcMain.handle("app:show-select-folder-dialog", async (event, args) => { // eslint-disable-line no-unused-vars
            const bw = BrowserWindow.fromId(event.sender.id);
            return selectFolderDialog(bw);
        });
        ipcMain.handle("app:show-select-file-dialog", async (event, args) => {
            const { name, exts, multi_select } = args;
            const bw = BrowserWindow.fromId(event.sender.id);
            return selectFileDialog(bw, name, exts, multi_select);
        });
        
        ipcMain.on("app:show-player", async (event, args) => { // eslint-disable-line no-unused-vars
            if(player_win){
                player_win.show();
            }
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

        const app_msg_list = [
            { name:"search-tag", focus:true },
            { name:"load-mylist", focus:true },
            { name:"add-bookmarks", focus:false },
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

        [
            "bookmark",
            "library-search",
            "mylist",
            "nico-search",
            "download",
            "nglist",
            "stack",
        ].forEach(name=>{
            ipcMain.handle(`${name}:getItems`, async (event, args) => { // eslint-disable-line no-unused-vars
                if(!store.has(name)){
                    store.setItems(name, await json_store.load(name, []));
                }
                return store.getItems(name);
            });  
            ipcMain.handle(`${name}:updateItems`, async (event, args) => {
                const { items } = args;
                store.setItems(name, items);
                await json_store.save(name, items);
                if(name=="download"){
                    main_win.webContents.send("download:on-update-item");
                }
            });  
        });

        // download
        ipcMain.handle("download:getIncompleteIDs", async (event, args) => { // eslint-disable-line no-unused-vars
            const name = "download";
            if(!store.has(name)){
                store.setItems(name, await json_store.load(name, []));
            }
            const items = store.getItems(name);
            if(!items){
                return [];
            }
            const ids = [];
            items.forEach(item => {
                if(item.state != 2){
                    ids.push(item.video_id);
                } 
            });
            return ids;
        });

        // history
        const history_max = 50;
        const items = await json_store.load("history", []);
        history.setup(history_max);  
        history.setData(items);
        ipcMain.handle("history:getItems", (event, args) => { // eslint-disable-line no-unused-vars
            return history.getData();
        });
        ipcMain.handle("history:updateItems", async (event, args) => {
            const { items } = args;
            history.setData(items);
            await json_store.save("history", items);
        });
        ipcMain.on("history:addItem", async (event, args) => {
            const { item } = args;
            history.add(item);

            const items = history.getData();
            await json_store.save("history", items);

            main_win.webContents.send("history:on-update-item", args);

            const video_id = item.video_id;
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
        ipcMain.handle("library:load", async (event, args) => { // eslint-disable-line no-unused-vars
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

            /**
            * @type {string[]}
            */
            const paths = getNicoDataFilePaths(video_item);

            const exist_paths = [];
            for (let index = 0; index < paths.length; index++) {
                const file_path = paths[index];
                try {
                    await fsPromises.stat(file_path);
                    exist_paths.push(file_path);
                } catch (error) {
                    // pass
                }
            }

            for (let index = 0; index < exist_paths.length; index++) {
                const file_path = exist_paths[index];
                try {
                    await shell.trashItem(file_path);
                } catch (error) {
                    return {
                        success:false,
                        error:new Error(`${file_path}のゴミ箱への移動に失敗`)
                    };
                }
            }

            try {
                await library.delete(video_id);
            } catch (error) {
                return {
                    success:false,
                    error:error
                };
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
        library.on("init", ()=>{  
            main_win.webContents.send("library:on-init", {
                items:library.getItems()
            });
        });
        library.on("update-item", (args)=>{  
            main_win.webContents.send("library:on-update-item", args);
        });
        library.on("add-item", (args)=>{  
            main_win.webContents.send("library:on-add-item", args);
        });
        library.on("delete-item", (args)=>{  
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

        user_icon_cache.setup(
            path.join(config.get("data_dir", ""), "user_icon"),
            config.get("user_icon_cache", false));
        
        createMainWindow();
        
        setupContextmenu(main_win, player_win, config, history, store);
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
            createMainWindow();
        }
    });
};

module.exports = {
    setupMain,
};