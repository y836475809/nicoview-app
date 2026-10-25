import { ipcMain, clipboard } from 'electron';
import { createPlayerWindow, getWindow, getWindowState } from '@main/window.js';
import { popupContextMenu } from "@main/util.js";

/**
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendPlayer 
 */
export function registerPlayerHandlers(config, sendPlayer){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    myIpcMain.handle('player:play', async (event, videoId, online) => {
        let bw = getWindow('player');
        if(!bw){
            bw = await createPlayerWindow(config);
        }
        bw?.on("close", e => {
            const palyerConfig = config.get().player;
            palyerConfig.window.state = getWindowState(bw);
            config.set('player', palyerConfig);
        });
        bw.show();
        sendPlayer('player:play', videoId, online);
    });

    myIpcMain.handle('player:showContextMenu', async (event, videoId) => {
        const cmd = await popupContextMenu(event.sender, [
            {
                label: '後で見る',
                command: 'stack'
            },
            {
                label: 'ブックマーク',
                command: 'bookMark'
            },
            {
                label: 'ブックマーク(時間)',
                command: 'bookMarkTime'
            },
            {
                label: 'ダウンロードに追加',
                command: 'download'
            },
                            {
                label: '再読み込み',
                command: 'reload'
            },
            {
                label: 'separator',
            },
            {
                label: 'URLをコピー',
                command: 'copyUrl'
            },
            {
                label: 'toggledevtools',
            },
        ]);
        if(cmd === 'copyUrl'){
            await clipboard.writeText(videoId);
            return null;
        }
        return cmd;
    });
}
