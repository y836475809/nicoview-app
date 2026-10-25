import { session, dialog, app, BrowserWindow, ipcMain, protocol } from "electron";
import fs from "fs";
import path from "path";
import * as NicoLogin from "@lib/nico-login.js";
import { Config } from "@lib/config.js";
import { Library } from "@lib/library.js";
import { importNNDDDB } from "@lib/import-nndd-db.js";
import { logger } from "@lib/logger.js";
import { 
    UserIconCache,
    setLogLevel,
    selectFolder } from "@lib/util.js";
import { registerLibraryHandlers } from "@main/ipc/libraryHandler.js";
import { registerDialogHandlers } from "@main/ipc/dialogHandler.js";
import { registerBookMarkHandlers, registerStackHandlers } from "@main/ipc/handler.js";
import { registerDownloadHandlers } from "@main/ipc/downloadHandler.js";
import { registerHistoryHandlers } from "@main/ipc/historyHandler.js";
import { registerMyListHandlers } from "@main/ipc/myListHandler.js";
import { registerPlayerHandlers } from "@main/ipc/playerHandler.js";
import { createMainWindow, getWindow, getWindowState } from "@main/window.js";

setupDev();

protocol.registerSchemesAsPrivileged([{ 
    scheme: 'my-app', 
    privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        stream: true,
        corsEnabled: true
    } 
}]);

const userAgent = `${app.name}/${app.getVersion()}`;

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const config = new Config();
const library = new Library();
const user_icon_cache = new UserIconCache();

let isQuitting = false;

process.on("uncaughtException", (error) => {
    // logger.error("uncaught exception:", error);
    dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
        type: "error",
        buttons: ["OK"],
        message: `致命的エラー: ${error.message}\n終了します`
    });

    isQuitting = true;
    app.quit();
});

process.on('unhandledRejection', (reason, p) => {
    logger.error("unhandled rejection:", p, "reason:", reason);
    dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
        type: "error",
        buttons: ["OK"],
        message: `エラー: ${reason}`
    });
});

const setupConfig = async () => {
    try {
        config.configPath = path.join(app.getPath("userData"), 'config-vite.json');
        await config.load();
    } catch (error) {
        const ret = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: "error",
            buttons: ["OK", "Cancel"],
            message: `設定読み込み失敗、初期設定で続けますか?: ${error.message}`
        });
        if(ret===0){ 
            //OK
            config.setDefault();
        }else{ 
            //Cancel
            return false;
        }
    }
    
    try {
        const appConfig = config.get();
        if(!appConfig.data_dir || !fs.existsSync(appConfig.data_dir)){
            const settingDataDir = selectFolder('', `DB,ブックマーク,履歴等を保存するフォルダの選択`);
            if (!settingDataDir) {
                throw new Error(`フォルダが選択されていない`);
            }
            config.set('data_dir', settingDataDir);
        }
        if(!appConfig.download.dir || !fs.existsSync(appConfig.download.dir)){
            const downloadDir = selectFolder('', `動画を保存するフォルダの選択`);
            if (!downloadDir) {
                throw new Error(`フォルダが選択されていない`);
            }
            appConfig.download.dir = downloadDir;
            config.set('download', appConfig.download);
        }
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
        const mainWin = getWindow('main');
        if(mainWin){
            const appConfig = config.get();
            appConfig.main.window.state = getWindowState(mainWin);
            config.set('main', appConfig.main);
            await config.save();
        }
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

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", async ()=>{
    if(!await setupConfig()){
        isQuitting = true;
        app.quit(); 
        return;
    }

    const log_level = config.get().log.level;
    setLogLevel(log_level);

    session.defaultSession.setUserAgent(userAgent);

    /** @type {MySend} */
    const sendMain = (channel, ...args) => {
        const win = getWindow('main');
        win?.webContents.send(channel, ...args);
    };

    /** @type {MySend} */
    const sendPlayer = (channel, ...args) => {
        const win = getWindow('player');
        win?.webContents.send(channel, ...args);
    };

    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    // library
    const data_dir = config.get().data_dir;
    library.setup(data_dir);
    await library.load();
    registerLibraryHandlers(library, config, sendMain);

    registerDownloadHandlers(config, sendMain);

    registerHistoryHandlers(config, sendMain);

    registerMyListHandlers(config, sendMain);

    registerBookMarkHandlers(config, sendMain);

    registerStackHandlers(config, sendMain);

    registerDialogHandlers();

    registerPlayerHandlers(config, sendPlayer)

    // const app_msg_list = [
    //     { name:"search-tag", focus:true },
    //     { name:"search-library", focus:true },
    //     { name:"load-mylist", focus:true },
    //     { name:"add-bookmarks", focus:false },
    //     { name:"add-download-item", focus:false },
    //     { name:"add-stack-items", focus:false },
    // ];
    // app_msg_list.forEach(msg=>{
    //     const { name, focus } = msg;
    //     ipcMain.on(`app:${name}`, (event, args) => {
    //         if(focus){
    //             main_win.focus();
    //         }
    //         main_win.webContents.send(`app:${name}`, args);
    //     });
    // });

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
    
    myIpcMain.handle('config:get', async (event) => {
        return config.get();
    });
    myIpcMain.handle('config:set', async (event, key, value) => {
        config.set(key, value);
    });

    user_icon_cache.setup(
        path.join(config.get().data_dir, "user_icon"),
        config.get().user_icon_cache);
    
    protocol.handle('my-app', async (request) => {
        const url = request.url.replace('my-app://', 'https://');
        const mySesstion = session.fromPartition(NicoLogin.LOGIN_SESSTION_NAME);
        const headers = request.headers;
        headers.append('User-Agent', userAgent);
        const body = request.body ? JSON.stringify(await request.json()) : null;
        return await mySesstion.fetch(url, {
            headers: headers,
            method: request.method,
            signal: request.signal,
            body: body
        });
    });

    const mainWin = createMainWindow(config);
    mainWin.on("close", async (e) => {
        if(isQuitting){
            return;
        }
        e.preventDefault();
        if(await quit()){
            if(mainWin){
                mainWin.webContents.closeDevTools();
            }         
            isQuitting = true;
            app.quit(); 
        }
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
     const win = getWindow('main');
    if (win === null) {
        createMainWindow(config);
    }
});

function setupDev(){
    console.log('process.argv=', process.argv);
    // const isDev = !!process.env.VITE_DEV_SERVER_URL;
    if(process.argv.find((arg) => arg === '--dev')){
        app.setName("nicoview-app-dev");
        const userDataDir = path.join(path.dirname(__dirname), '../__dev__/userData');
        console.log('userDataDir=', userDataDir);
        app.setPath("userData", userDataDir);
    }
    if(process.argv.find((arg) => arg === '--mock_server')){
        const port = 8098;
        const rules = [
            'nvapi.nicovideo.jp',
            'www.nicovideo.jp',
            'delivery.domand.nicovideo.jp',
            'asset.domand.nicovideo.jp',
            'public.nvcomment.nicovideo.jp',
            'nicovideo.cdn.nimg.jp',
            'secure-dcdn.cdn.nimg.jp',
            'snapshot.search.nicovideo.jp',
            'nv-comment.nicovideo.jp'
        ].map((host) => {
            return `MAP ${host} localhost:${port}`;
        }).join(',');
        app.commandLine.appendSwitch('host-resolver-rules', rules);
        app.commandLine.appendSwitch('ignore-certificate-errors');
    }
}
