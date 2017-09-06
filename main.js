const electron = require('electron')
// アプリケーションを操作するモジュール
const { app } = electron
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron

const { ipcMain } = electron

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win
let player_win = null
let force_quit = false;

function createWindow() {
    console.log(process.argv)

    let html = "html/index.html"
    if (process.argv.length > 2) {
        html = process.argv[2]
    }

    // ブラウザウィンドウの作成
    win = new BrowserWindow({ width: 1000, height: 600 })

    // アプリケーションのindex.htmlの読み込み
    win.loadURL(`file://${__dirname}/${html}`)

    // DevToolsを開く
    win.webContents.openDevTools()

    // ウィンドウが閉じられた時に発行される
    win.on('closed', () => {
        force_quit = true
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
        if (player_win !== null) {
            player_win.close()
        }
        win = null
    })
}

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on('ready', createWindow)

// すべてのウィンドウが閉じられた時にアプリケーションを終了する。
app.on('window-all-closed', () => {
    // macOSでは、Cmd + Q(終了)をユーザーが実行するまではウィンドウが全て閉じられても終了しないでおく。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // macOS では、ドックをクリックされた時にウィンドウがなければ新しく作成する。
    if (win === null) {
        createWindow()
    }
})

let creatPlayerWindow = (callback) => {
    const player_path = `file://${__dirname}/html/player.html`
    player_win = new BrowserWindow({ width: 800, height: 600 })
    player_win.loadURL(player_path)
    player_win.on('close', (e) => {
        if (!force_quit) {
            e.preventDefault()
            player_win.hide()
        }
    })

    player_win.webContents.on('did-finish-load', () => {
        // player_win.show()
        console.log("callback=", callback)
        if(callback!==null){
            callback()
        }
    })
}

let showPlayerWindow = (callback) => {
    if (player_win === null) {
        creatPlayerWindow(callback)
    }
    // player_win.show()
}

ipcMain.on('request-show-player', (event, arg) => {
    console.log("request-show-player")
    if (arg === null) {
        console.log("request-show-player arg === null")
        showPlayerWindow(null)
    }else{
        console.log("request-show-player arg !== null")
        showPlayerWindow(()=>{
            console.log("showPlayerWindow callbak")
            player_win.webContents.send('request-send-video-data', arg)
        })

    }
})