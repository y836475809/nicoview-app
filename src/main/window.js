import { app, BrowserWindow, ipcMain, shell, Menu } from "electron";
import path from "path";
import * as NicoLogin from "@lib/nico-login.js";

/** @type {BrowserWindow?} */
let mainWin = null;
/** @type {number?} */
let mainId = null;

/** @type {BrowserWindow?} */
let playerWin = null;
/** @type {number?} */
let playerId = null;

/**
 * 
 * @param {import('@lib/config.js').Config} config 
 * @returns {BrowserWindow}
 */
export function createMainWindow(config) {
    const appConfig = config.get();
    const state = appConfig.main.window.state;
    const bw = new BrowserWindow({
        title: `${app.name} ${app.getVersion()}`,
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        webPreferences:{
            backgroundThrottling: false,
            webSecurity: false, // TODO
            nodeIntegration: false, // TODO
            contextIsolation: true, // TODO
            preload: path.join(__dirname, '../preload/preload.mjs'),
            spellcheck: false,
            sandbox: false
        }
    });
    if (state.maximized) {
        bw.maximize();
    }
    mainWin = bw;
    mainId = bw.id;

    const menu =  Menu.buildFromTemplate([
        { label: "ログ",
            submenu: [
                { label: "ログファイルを開く", click() {
                    // shell.openExternal(logger.getPath());
                }},
                { label: "ログの場所を開く", click() {
                    // shell.showItemInFolder(logger.getPath());
                }},
                // { type: "separator" },
                // { id: "log-level", label: "debugレベルで取得", type: "checkbox", checked: false, click(e) {
                //     const level = e.checked?"debug":"info";
                //     changeLogLevel({level});
                // }}
            ]
        },
        { label: "ツール",  
            submenu: [
                { label: "ログイン", click() {
                    NicoLogin.showLoginWindow();
                }},
                { label: "ログアウト", click() {
                    NicoLogin.showLogoutWindow();
                }},
            ]
        },
        { label: "ヘルプ",  
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { id: "open-devtools", label: "起動時にdevtoolsを開く", type: "checkbox", checked: false, click(e) {
                    config.set("open_devtools", e.checked);
                }},
                { label: "設定ファイルの場所を開く", async click() {
                    shell.showItemInFolder(config.configPath);
                }}
            ]
        },
    ]);
    bw.setMenu(menu);

    bw.loadURL('http://localhost:5173/index.html');

    if(config.get().open_devtools){
        bw.webContents.openDevTools();
    }
    
    return bw;
};

/**
 * 
 * @param {import('@lib/config.js').Config} config 
 * @returns {Promise<BrowserWindow>}
 */
export async function createPlayerWindow(config) {
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
        const state = config.get().player.window.state;
        const bw = new BrowserWindow({
            x: state.x,
            y: state.y,
            width: state.width,
            height: state.height,
            webPreferences: {
                backgroundThrottling: false,
                webSecurity: false, // TODO
                nodeIntegration: false, // TODO
                contextIsolation: true, // TODO
                preload: path.join(__dirname, '../preload/preload.mjs'),
                spellcheck: false,
                sandbox: false
            }
        });
        bw.removeMenu();
        if (state.maximized) {
            bw.maximize();
        }
        playerWin = bw;
        playerId = bw.id;

        /** @type {MyIpcMain} */
        const myIpcMain = ipcMain;
        myIpcMain.handleOnce('player:moundted', async (event) => {
            resolve(bw);
        });

        bw.loadURL('http://localhost:5173/player.html'); 
    });  
};

/**
 * 
 * @param {'main'|'player'} name 
 * @returns {BrowserWindow|null}
 */
export function getWindow(name) {
  if (name === 'main' && mainId) {
    return BrowserWindow.fromId(mainId);
  }
  if (name === 'player' && playerId) {
    return BrowserWindow.fromId(playerId);
  }
  return null;
}

/**
 * 
 * @param {BrowserWindow} bw 
 * @returns {WindowState}
 */
export function getWindowState(bw) {
    const bounds = bw.getBounds(); 
    return {
        x: bounds.x, 
        y: bounds.y,  
        width: bounds.width,  
        height: bounds.height, 
        maximized: bw.isMaximized()
    };
};
