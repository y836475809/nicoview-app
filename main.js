const electron = require("electron");
// アプリケーションを操作するモジュール
const { app } = electron;
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron;

const { ipcMain } = electron;

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;

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
app.on("ready", createWindow);

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

ipcMain.on("request-show-player", (event, arg) => {
    creatPlayerWindow(arg);
    player_win.show();
});

ipcMain.on("set-session-to-main", (event, arg) => {
    const session = arg;
    win.webContents.session.cookies.set(session, (error) => {
        if (error) {
            console.log(error);
            event.returnValue = "error";
        }else{
            event.returnValue = "ok";
        }
    });
});