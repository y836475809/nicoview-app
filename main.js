const electron = require("electron");
const session = electron.session;
// アプリケーションを操作するモジュール
const { app } = electron;
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron;

const { ipcMain } = electron;
const fs = require("fs");
const path = require("path");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const Preference = require("./app/js/preference");
const LibraryStore = require("./app/js/library_store");
const HistoryStore = require("./app/js/history_store");
// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;
const pref = new Preference();
let library_store = null;
let history_store = null;

function createWindow() {
    global.sharedObj = {
        base_dir: __dirname
    };

    let html = "html/index.html";
    if (process.argv.length > 2) {
        html = process.argv[2];
        is_debug_mode = true;
    }

    // ブラウザウィンドウの作成
    win = new BrowserWindow({ width: 1000, height: 600 });

    // アプリケーションのindex.htmlの読み込み
    win.loadURL(`file://${__dirname}/${html}`);

    if(is_debug_mode){
        // DevToolsを開く
        win.webContents.openDevTools();
    }

    // ウィンドウが閉じられた時に発行される
    win.on("closed", () => {
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
        if (player_win !== null) {
            player_win.close();
        }
        win = null;
    });
}

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", ()=>{
    pref.load();

    library_store = new LibraryStore(pref.getValue("library_file"));
    library_store.load();

    history_store = new HistoryStore(pref.getValue("history_file"), 50);
    history_store.load(); 

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
    if (win === null) {
        createWindow();
    }
});

let creatPlayerWindow = (data) => {
    if (player_win === null) {
        const player_path = `file://${__dirname}/html/player.html`;
        player_win = new BrowserWindow({ width: 800, height: 600 });
        if(is_debug_mode){
            player_win.webContents.openDevTools();
        }
        player_win.loadURL(player_path);

        player_win.on("close", (e) => {
            player_win = null;
        });

        player_win.webContents.on("did-finish-load", () => {
            if (data !== null) {
                player_win.webContents.send("request-send-video-data", data);

                const title = data.viweinfo.thumb_info.title;
                player_win.setTitle(title);
            }
        });
    }else{
        if (data !== null) {
            player_win.webContents.send("request-send-video-data", data);

            const title = data.viweinfo.thumb_info.title;
            player_win.setTitle(title);
        }      
    }
};

app.on("login", function(event, webContents, request, authInfo, callback) {
    event.preventDefault();

    try {
        const f = path.join(app.getPath("userData"), "p.json");
        const p = JSON.parse(fs.readFileSync(f));
        callback(p.name, p.pass);      
    } catch (error) {
        callback(null, null);
    }

});

ipcMain.on("request-show-player", (event, arg) => {
    creatPlayerWindow(arg);
    player_win.show();
});

ipcMain.on("getPreferences", (event, arg) => {
    const key = arg;
    event.returnValue = pref.getValue(key);
});

ipcMain.on("setPreferences", (event, arg) => {
    const key = arg.key;
    const value = arg.value;
    pref.update(key, value);
    pref.save();
});

ipcMain.on("get-library-items", (event, arg) => {
    event.sender.send("get-library-items-reply", library_store.getItems());
});

ipcMain.on("get-library-items-from-file", (event, arg) => {
    library_store = new LibraryStore(arg);
    library_store.load();
    event.sender.send("get-library-items-reply", library_store.getItems());
});

ipcMain.on("get-library-data", (event, arg) => {
    const video_id = arg;
    event.returnValue = library_store.getPlayData(video_id);
});


ipcMain.on("get-history-items", (event, arg) => {
    event.sender.send("get-history-items-reply", history_store.getItems());
});

ipcMain.on("add-history-items", (event, arg) => {
    history_store.add(arg);
    event.sender.send("get-history-items-reply", history_store.getItems());
});

ipcMain.on("set-nicohistory", async (event, arg) => {
    const cookies = arg;
    const ps = cookies.map(cookie=>{
        return new Promise((resolve, reject) => {
            session.defaultSession.cookies.set(cookie, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    });
    try {
        await Promise.all(ps);
        event.returnValue = "ok";
    } catch (error) {
        event.returnValue = "error";
    }
});