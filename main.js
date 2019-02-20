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

const SettingStore = require("./app/js/setting-store");
const Library = require("./app/js/library");
const HistoryStore = require("./app/js/history_store");
const DBConverter = require("./app/js/db-converter");

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;
let setting_store = null;
let library = null;
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
    setting_store = new SettingStore();
    const setting = setting_store.get();
    
    library = new Library(path.join(setting.system_dir, "library.db"));

    history_store = new HistoryStore(path.join(setting.system_dir, "history.json"), 50);
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

ipcMain.on("get-library-items", async (event, arg) => {
    try {
        event.sender.send("get-library-items-reply", await library.getLibraryData());
    } catch (error) {
        console.log("get-library-items error=", error);
        event.sender.send("get-library-items-reply", []);
    }
});

ipcMain.on("get-library-items-from-file", async (event, arg) => {
    const data_path = arg;
    try {
        library = new Library(data_path);
        event.sender.send("get-library-items-reply", await library.getLibraryData());      
    } catch (error) {
        console.log("get-library-items-from-file error=", error);
        event.sender.send("get-library-items-reply", []);      
    }
});

ipcMain.on("get-library-data", async (event, arg) => {
    const video_id = arg;
    try {
        event.returnValue = await library.getPlayData(video_id);
    } catch (error) {
        console.log("get-library-data error=", error);
        event.returnValue = {};
    }
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

const importDB = (db_file_path)=>{
    const setting = setting_store.get();
    const system_dir = setting.system_dir;
    try {
        fs.statSync(system_dir);
    } catch (error) {
        if (error.code === "ENOENT") {
            fs.mkdirSync(system_dir);
        }
    }

    const db_converter = new DBConverter();
    db_converter.init(db_file_path);
    db_converter.read();
    const dir_list = db_converter.get_dirpath();
    const video_list = db_converter.get_video();

    library = new Library(path.join(system_dir, "library.db"));
    library.setData(dir_list, video_list);  
};

ipcMain.on("import-db", (event, arg) => {
    const db_file_path = arg;
    try {
        importDB(db_file_path);
        event.returnValue = null;
    } catch (error) {
        event.returnValue = error;
    }
});


