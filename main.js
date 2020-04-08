const { session, dialog, app, BrowserWindow, ipcMain, shell } = require("electron");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { IPC_CHANNEL } = require("./app/js/ipc-channel");
const { ConfigIpcMain } = require("./app/js/config");
const { LibraryIpcMain } = require("./app/js/library");
const { BookMarkIpcMain } = require("./app/js/bookmark");
const { HistoryIpcMain } = require("./app/js/history");
const { DownloadItemIpcMain } = require("./app/js/download-item");
const { importNNDDDB } = require("./app/js/import-nndd-db");
const { getNicoDataFilePaths } = require("./app/js/nico-data-file");
const JsonStore = require("./app/js/json-store");
const { CmdLineParser } = require("./app/js/main-util");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const config_ipc_main = new ConfigIpcMain();
const library_ipc_main = new LibraryIpcMain();
const bookmark_ipc_main = new BookMarkIpcMain();
const history_ipc_main = new HistoryIpcMain();
const downloaditem_ipc_main = new DownloadItemIpcMain();
const cmdline_parser = new CmdLineParser(process.argv);

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let main_win = null;
let player_win = null;
let do_app_quit = false;

const is_debug_mode = process.env.NODE_ENV == "DEBUG";
const main_html_path = `${__dirname}/${cmdline_parser.get("--main", "app/html/index.html")}`;
const player_html_path = `${__dirname}/${cmdline_parser.get("--player", "app/html/player.html")}`;
const preload_main_path = `${__dirname}/app/preload_main.js`;
const preload_player_path = `${__dirname}/app/preload_player.js`;
const config_fiiename = cmdline_parser.get("--config", "config.json");

const loadJson = async (name, default_value) => {
    const data_dir = await config_ipc_main.get({ key:"data_dir", value:"" });
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
        await dialog.showMessageBox({
            type: "error",
            buttons: ["OK"],
            message: `${file_path}の読み込みに失敗\n${error.message}`
        });
        return default_value;
    }
};

const saveJson = async (name, items) => {
    const data_dir = await config_ipc_main.get({ key: "data_dir", value:"" });
    const file_path = path.join(data_dir, `${name}.json`);
    try {
        const json_store = new JsonStore(file_path);
        json_store.save(items);
    } catch (error) {
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

function createWindow() {

    // ブラウザウィンドウの作成
    const state = config_ipc_main.get({ key: "main.window.state", value:{ width: 1000, height: 600 } });
    state.webPreferences =  {
        nodeIntegration: false,
        contextIsolation: false,
        preload: preload_main_path,
    };
    main_win = new BrowserWindow(state);
    if (state.maximized) {
        main_win.maximize();
    }
    // アプリケーションのindex.htmlの読み込み
    main_win.loadURL(main_html_path);

    if(is_debug_mode){
        // DevToolsを開く
        main_win.webContents.openDevTools();
    }

    main_win.on("close", async (e) => {        
        if(do_app_quit){
            return;
        }

        if(config_ipc_main.get({ key: "check_window_close", value:true})){
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
            config_ipc_main.set({ key:"main.window.state", value:getWindowState(main_win) });
            await config_ipc_main.save();
        } catch (error) {
            const ret = dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `設定の保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret==0){
                // OK, 終了する
                return;
            }
        }
        
        try {
            await library_ipc_main.save(false);
        } catch (error) {
            const ret = dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK", "Cancel"],
                message: `データベースの保存に失敗: ${error.message}\nこのまま終了しますか?`
            });
            if(ret==0){
                // OK, 終了する
                return;
            }
        }

        // 終了しない
        e.preventDefault();
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
        config_ipc_main.handle();
        config_ipc_main.setup(config_path);
        await config_ipc_main.load();
    } catch (error) {
        const ret = await dialog.showMessageBox({
            type: "error",
            buttons: ["OK", "Cancel"],
            message: `設定読み込み失敗、初期設定で続けますか?: ${error.message}`
        });
        if(ret===0){ //OK
            config_ipc_main.clear();
        }else{ //Cancel
            do_app_quit = true;
            app.quit();
            return;
        }
    }
    try {
        await config_ipc_main.configFolder("data_dir", "データ");
        await config_ipc_main.configFolder("download.dir", "動画");
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

    ipcMain.handle(IPC_CHANNEL.PLAY_BY_VIDEO_ID, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, args);
        return true;
    });
    
    ipcMain.on(IPC_CHANNEL.PLAY_BY_VIDEO_DATA, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        const {video_id, time} = args;
        const video_item = library_ipc_main.getItem({video_id});
        player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_DATA, {
            video_id,
            video_item,
            time
        });
    });

    ipcMain.on(IPC_CHANNEL.PLAY_BY_VIDEO_ID, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        const {video_id, time} = args;
        if(library_ipc_main.existItem({video_id})){
            const video_item = library_ipc_main.getItem({video_id});
            player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_DATA, {
                video_id,
                video_item,
                time
            });
        }else{
            player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                video_id:video_id,
                video_item:null,
                time:time
            });
        }
    });

    ipcMain.on(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        const {video_id, time} = args;
        const video_item = library_ipc_main.getItem({video_id});
        player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
            video_id,
            video_item,
            time
        });
    });

    ipcMain.handle(IPC_CHANNEL.UPDATE_DATA, async (event, args) => {
        const video_item = await new Promise( resolve => {
            ipcMain.once(IPC_CHANNEL.RETURN_UPDATE_DATA, (event, data) => {
                // console.log('ipcRequest', data)
                resolve(data);
            });
            main_win.webContents.send(IPC_CHANNEL.UPDATE_DATA, args);
        });
        return video_item;
    });

    ipcMain.on(IPC_CHANNEL.CANCEL_UPDATE_DATA, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.CANCEL_UPDATE_DATA, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_PLAY_HISTORY, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_PLAY_HISTORY, args);

        const { history_item } = args;
        const video_id = history_item.id;
        const video_item = library_ipc_main.getItem({video_id});
        if(video_item===null){
            return;
        }
       
        const props = { 
            last_play_date : new Date().getTime(),
            play_count : video_item.play_count + 1
        };
        library_ipc_main.update({video_id, props});
    });

    ipcMain.on(IPC_CHANNEL.SEARCH_TAG, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.SEARCH_TAG, args);
    });

    ipcMain.on(IPC_CHANNEL.LOAD_MYLIST, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.LOAD_MYLIST, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_BOOKMARK, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_BOOKMARK, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, (event, args) => {
        main_win.webContents.send(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, args);
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
        const data_dir = config_ipc_main.get({ key:"data_dir", value:"" });

        if(data_dir == ""){
            return {
                result : false,
                error : new Error("データを保存するフォルダが設定されていない")
            };
        }

        try {
            const { path_data_list, video_data_list } = await importNNDDDB(db_file_path);
            library_ipc_main.setData({
                data_dir, 
                path_data_list, 
                video_data_list
            }); 
            await library_ipc_main.save();
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

        const video_item = library_ipc_main.getItem({video_id});
        if(video_item===null){
            return {
                success:false,
                error:new Error(`${video_id}が存在しません`)
            };
        }

        try {
            await library_ipc_main.delete({ video_id });
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

    library_ipc_main.on("libraryInitialized", ()=>{  
        main_win.webContents.send("libraryInitialized", {
            items:library_ipc_main.getItems()
        });
    });
    library_ipc_main.on("libraryItemUpdated", (args)=>{  
        main_win.webContents.send("libraryItemUpdated", args);
    });
    library_ipc_main.on("libraryItemAdded", (args)=>{  
        main_win.webContents.send("libraryItemAdded", args);
    });
    library_ipc_main.on("libraryItemDeleted", (args)=>{  
        main_win.webContents.send("libraryItemDeleted", args);
    });
        
    bookmark_ipc_main.setup(async (args)=>{
        const { name } = args;
        return await loadJson(name, []);
    });  
    bookmark_ipc_main.on("bookmarkItemUpdated", async (args)=>{  
        const { name, items } = args;
        await saveJson(name, items);    
    });

    const history_max = 50;
    const items = await loadJson("history", []);
    history_ipc_main.setup(history_max);  
    history_ipc_main.setData({ items });

    history_ipc_main.on("historyItemUpdated", async (args)=>{  
        const items = history_ipc_main.getData();
        await saveJson("history", items);    
    });

    downloaditem_ipc_main.handle();
    downloaditem_ipc_main.setData({items:await loadJson("download", [])});
    downloaditem_ipc_main.on("updated", async (args)=>{  
        main_win.webContents.send("downloadItemUpdated");

        const { items }  = args;
        await saveJson("download", items);
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
        const state = config_ipc_main.get({ key:"player.window.state", value:{ width: 800, height: 600 } });
        state.webPreferences =  {
            nodeIntegration: false,
            contextIsolation: false,
            preload: preload_player_path,
        };
        player_win = new BrowserWindow(state);
        if (state.maximized) {
            player_win.maximize();
        }

        ipcMain.once(IPC_CHANNEL.READY_PLAYER, (event, args) => {
            if(is_debug_mode){
                player_win.webContents.openDevTools();
            }
            player_win.on("close", (e) => {
                config_ipc_main.set({ key:"player.window.state", value:getWindowState(player_win) });
                player_win = null;
            });

            resolve();
        });
        player_win.loadURL(player_html_path);
    });  
};

app.on("login", function(event, webContents, request, authInfo, callback) {
    if(authInfo.isProxy){
        event.preventDefault();
        try {
            const f = path.join(app.getPath("userData"), "proxy.json");
            const p = JSON.parse(fs.readFileSync(f));
            callback(p.name, p.pass);      
        } catch (error) {
            callback(null, null);
        }
    }
});