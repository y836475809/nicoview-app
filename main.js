const electron = require("electron");
// アプリケーションを操作するモジュール
const { app } = electron;
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron;

const { ipcMain } = electron;

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const DB = require("./app/js/db");
const Preference = require("./app/js/preference");
const serializer = require("./app/js/serializer");

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;
const pref = new Preference();
const db = new DB();
let library_items = new Array();
let history_items = new Array();

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

const loadHistory = (file_path) => {    
    try {
        history_items = serializer.load(file_path);
        history_items.sort((a, b) => {
            return a.play_date < b.play_date;
        });    
    } catch (error) {
        console.error(error);
    }
};

const addHistoryItem = (new_item) => {
    const index = history_items.findIndex(item => item.id === new_item.id);
    if(index === -1){
        if(history_items.length >= 50){
            history_items.pop();
        }
        history_items.unshift({
            image: new_item.image,
            id: new_item.id,
            name: new_item.name,
            play_date: Date.now(), 
            play_time: 0,
            url: new_item.url                
        }); 
    }else{
        let item = history_items[index];
        item.play_date = Date.now();
        if(new_item.url != item.url){
            item.image = new_item.image;
            item.url = new_item.url;
        }
        history_items.sort((a, b) => {
            return a.play_date < b.play_date;
        });
    }
};

const loadLibraryItems = (file_path) =>{
    db.load(file_path);

    const video = db.video_info;
    library_items = new Array();
    video.forEach((value, key) => {
        library_items.push({
            image: db.getThumbPath(key),
            id: key,
            name: value["video_name"],
            creation_date: value["creation_date"],
            pub_date: value["pub_date"],
            play_count: value["play_count"],
            time: value["time"],
            tags: value["tags"]?value["tags"].join(" "):""
        });
    });
};

const getLibraryData = (video_id) => {
    const video_file_path = db.getVideoPath(video_id);
    const video_type = db.getVideoType(video_id);
    const commnets = db.findComments(video_id);
    let thumb_info = db.findThumbInfo(video_id);
    const thumb_url = db.getThumbPath(video_id);
    thumb_info.thumbnail_url = thumb_url;

    return {
        video_data: {
            src: video_file_path,
            type: video_type,
            commnets: commnets
        },
        viweinfo: {
            thumb_info:thumb_info,
            commnets: commnets
        }
    };
};

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", ()=>{
    pref.load();

    loadLibraryItems(pref.getValue("library_file"));
    loadHistory(pref.getValue("history_file"));

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
    event.sender.send("get-library-items-reply", library_items);
});

ipcMain.on("get-library-items-from-file", (event, arg) => {
    loadLibraryItems(arg);
    event.sender.send("get-library-items-reply", library_items);
});

ipcMain.on("get-library-data", (event, arg) => {
    const video_id = arg;
    event.returnValue = getLibraryData(video_id);
});


ipcMain.on("get-history-items", (event, arg) => {
    event.sender.send("get-history-items-reply", history_items);
});

ipcMain.on("add-history-items", (event, arg) => {
    addHistoryItem(arg);
    const file_path = pref.getValue("history_file");
    serializer.save(file_path, history_items, (error)=>{
        if(error){
            console.error(error);
        }
    });
    event.sender.send("get-history-items-reply", history_items);
});