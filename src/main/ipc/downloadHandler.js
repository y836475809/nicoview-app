import { ipcMain, app, clipboard } from 'electron';
import { Store } from "@lib/store.js";
import { NicoDownloader } from "@lib/nico-downloader.js";
import { popupContextMenu } from "@main/util.js";

const storeName = 'download';

/**
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export function registerDownloadHandlers(config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);

    // download
    myIpcMain.handle('download:addItem', async (event, item) => {
        sendMain('download:addItem', item);
        sendMain('download:addMark', item.video_id, 'reg');

        if(!store.has(storeName)){
            await store.load(storeName);
        }
        store.addItem(storeName, item);
        await store.save(storeName);
    });
    myIpcMain.handle('download:getItems', async (event) => {
        if(!store.has(storeName)){
            await store.load(storeName);
        }
        return store.getItems(storeName);
    });
    myIpcMain.handle('download:saveItems', async (event, items) => {
        store.setItems(storeName, items);
        await store.save(storeName);
    });
    myIpcMain.handle('download:getMarkedIds', async (event) => {
        if(!store.has(storeName)){
            await store.load(storeName);
        }
        const items = store.getItems(storeName);
        if(!items){
            return [];
        }
        /** @type string[] */
        const ids = [];
        items.forEach(item => {
            if(item.state != 2){
                ids.push(item.video_id);
            } 
        });
        return ids;
    });

    myIpcMain.handle('download:deleteMark', async (event, vieoId) => {
        sendMain('download:deleteMark', vieoId, 'reg');
        store.deleteItem(storeName, (item) => {
            return item.video_id != vieoId;
        });
        await store.save(storeName);
    });

    /** @type {NicoDownloader|null} */
    let nicoDownloader = null;
    /** @type {DownloadResult} */
    const DResult = {
        complete: 'complete',
        skip: 'skip',
        cancel: 'cancel',
        error: 'error'
    };
    myIpcMain.handle('download:cancelDownload', async (event) => {
        if(nicoDownloader){
            nicoDownloader.cancel();
        }
    });
    myIpcMain.handle('download:startDownload', async (event, videoId) => {
        const State = {
            wait: 0,
            downloading: 1,
            complete: 2,
            error: 3
        };
        const downloadDir = config.get().download.dir;
        const tmpDir = app.getPath("temp");
        const ffmpegPath = config.get().ffmpeg_path;
        nicoDownloader = new NicoDownloader(videoId, downloadDir, tmpDir, ffmpegPath);
        const result = await nicoDownloader.download((message) => {
            sendMain('download:DownloadProgress', videoId, State.downloading, message);
        });
        let resultMsg = result.reason;
        /** @type {string} */
        let resultState = DResult.complete;
        if(result.type == DResult.complete){
            resultMsg = '完了';
            resultState = DResult.complete;
        }
        if(result.type == "cancel"){
            resultMsg = result.reason;
            resultState = DResult.error;
        }
        if(result.type == "skip"){
            resultMsg = result.reason;
            resultState = DResult.skip;
        }
        if(result.type == "error"){
            resultMsg = result.reason.message;
            resultState = DResult.error;
        }
        sendMain('download:DownloadResult', videoId, resultState, resultMsg);
    });

    myIpcMain.handle('download:showContextMenu', async (event, videoId) => {
        const cmd = await popupContextMenu(event.sender, [
            {
                label: '削除',
                command: 'delete'
            },
            {
                label: 'URLをコピー',
                command: 'copyUrl'
            },
        ]);
        if(cmd === 'copyUrl'){
            await clipboard.writeText(videoId);
            return null;
        }
        return cmd;
    }); 
}
