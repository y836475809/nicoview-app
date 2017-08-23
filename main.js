const electron = require('electron')
// アプリケーションを操作するモジュール
const { app } = electron
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron

// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win

function createWindow() {
    console.log(process.argv)
    
    // ブラウザウィンドウの作成
    win = new BrowserWindow({ width: 1000, height: 600 })

    // アプリケーションのindex.htmlの読み込み
    win.loadURL(`file://${__dirname}/index.html`)

    // DevToolsを開く
    win.webContents.openDevTools()

    // ウィンドウが閉じられた時に発行される
    win.on('closed', () => {
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
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