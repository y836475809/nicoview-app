const { session, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const { ipcMain } = require("electron");
const { IPC_CHANNEL } = require("./js/ipc-channel");
const { WindowStateStore } = require("./js/window-state-store");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;
let do_app_quit = false;

let player_html_path = `file://${__dirname}/html/player.html`;

const window_store = new WindowStateStore(app.getPath("userData"));

function createWindow() {
    global.sharedObj = {
        base_dir: __dirname
    };

    let main_html_path = `file://${__dirname}/html/index.html`;
    if (process.argv.length > 2) {
        const filename = process.argv[2];
        main_html_path = `file://${path.resolve(__dirname, "..")}/test/${filename}`;
        is_debug_mode = true;
    }

    // ブラウザウィンドウの作成
    const state = window_store.getState("main", { width: 1000, height: 600 });
    state.webPreferences =  {
        nodeIntegration: true
    };
    win = new BrowserWindow(state);
    if (state.maximized) {
        win.maximize();
    }
    // アプリケーションのindex.htmlの読み込み
    win.loadURL(main_html_path);

    if(is_debug_mode){
        // DevToolsを開く
        win.webContents.openDevTools();
    }

    win.on("close", (e) => {
        if(do_app_quit){
            window_store.setState("main", win);
        }else{
            e.preventDefault();
            win.webContents.send(IPC_CHANNEL.APP_CLOSE);
        }
    });

    // ウィンドウが閉じられた時に発行される
    win.on("closed", async () => {
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
        if (player_win !== null) {
            player_win.close();
        }
        win = null;

        try {
            window_store.save();
        } catch (error) {
            console.log(error);
            await dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                message: `ウインドウ状態の保存失敗: ${error.message}`
            });
        }
    });
}

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", ()=>{
    window_store.load();

    createWindow();

    ipcMain.handle(IPC_CHANNEL.PLAY_BY_VIDEO_ID, async (event, args) => {
        await createPlayerWindow();
        player_win.show();

        player_win.webContents.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, args);
        return true;
    });

    ipcMain.handle(IPC_CHANNEL.GET_VIDEO_ITEM, async (event, args) => {
        const video_id = args;
        const video_item = await new Promise( resolve => {
            ipcMain.once(IPC_CHANNEL.GET_VIDEO_ITEM_REPLY, (event, data) => {
                // console.log('ipcRequest', data)
                resolve(data);
            });
            win.webContents.send(IPC_CHANNEL.GET_VIDEO_ITEM, video_id);
        });
        return video_item;
    });

    ipcMain.handle(IPC_CHANNEL.UPDATE_DATA, async (event, args) => {
        const video_item = await new Promise( resolve => {
            ipcMain.once(IPC_CHANNEL.RETURN_UPDATE_DATA, (event, data) => {
                // console.log('ipcRequest', data)
                resolve(data);
            });
            win.webContents.send(IPC_CHANNEL.UPDATE_DATA, args);
        });
        return video_item;
    });

    ipcMain.on(IPC_CHANNEL.CANCEL_UPDATE_DATA, (event, args) => {
        win.webContents.send(IPC_CHANNEL.CANCEL_UPDATE_DATA, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_PLAY_HISTORY, (event, args) => {
        win.webContents.send(IPC_CHANNEL.ADD_PLAY_HISTORY, args);
    });

    ipcMain.on(IPC_CHANNEL.SEARCH_TAG, (event, args) => {
        win.webContents.send(IPC_CHANNEL.SEARCH_TAG, args);
    });

    ipcMain.on(IPC_CHANNEL.LOAD_MYLIST, (event, args) => {
        win.webContents.send(IPC_CHANNEL.LOAD_MYLIST, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_BOOKMARK, (event, args) => {
        win.webContents.send(IPC_CHANNEL.ADD_BOOKMARK, args);
    });

    ipcMain.on(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, (event, args) => {
        win.webContents.send(IPC_CHANNEL.ADD_DOWNLOAD_ITEM, args);
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

    ipcMain.on(IPC_CHANNEL.SET_PLAYER_PATH, (event, args) => {
        player_html_path = args;
    });

    ipcMain.on(IPC_CHANNEL.APP_CLOSE, (event, args) => {
        do_app_quit = true;
        app.quit();
    });
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
    if (win === null) {
        createWindow();
    }
});

const createPlayerWindow = () => {
    return new Promise((resolve, reject) => {
        if(player_win !== null){
            resolve();
            return;
        }
        const state = window_store.getState("player", { width: 800, height: 600 });
        state.webPreferences =  {
            nodeIntegration: true
        };
        player_win = new BrowserWindow(state);
        if (state.maximized) {
            player_win.maximize();
        }

        player_win.webContents.on("did-finish-load", () => {
            if(is_debug_mode){
                player_win.webContents.openDevTools();
            }
            player_win.on("close", (e) => {
                window_store.setState("player", player_win);
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