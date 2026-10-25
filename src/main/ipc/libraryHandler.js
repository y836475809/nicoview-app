import { ipcMain, clipboard, shell } from 'electron';
import fs from "fs";
import { getNicoDataFilePaths } from "@lib/nico-data-file.js";
import { ConvertMP4 } from "@lib/video-converter.js";
import { NicoVideoData, getPlayDataFromLibrary } from "@lib/nico-data-file.js";
import { Store } from "@lib/store.js";
import { popupContextMenu } from "@main/util.js";

/**
 * 
 * @param {import('@lib/library.js').Library} library 
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export function registerLibraryHandlers(library, config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);

    myIpcMain.handle('library:getItems', async (event) => {
        const items = library.getItems();
        return items.map(item=>{
            const video_data = new NicoVideoData(item);
            item.thumb_img = video_data.getThumbImgPath();
            return item;
        });
    });

    myIpcMain.handle('library:getItem', async (event, vieoId) => {
        return library.getItem(vieoId);
    });

    myIpcMain.handle('library:addItem', async (event, item) => {
        await library.addItem(item);
        sendMain('library:addItem', item);
    });

    myIpcMain.handle('library:deleteItem', async (event, videoId) => {
        const item = library.getItem(videoId);
        if(!item){
            return new Error(`${videoId}が存在しません`);
        }

        /** @type {string[]} */
        const paths = getNicoDataFilePaths(item);

        /** @type {string[]} */
        const exist_paths = [];
        for (let index = 0; index < paths.length; index++) {
            const file_path = paths[index];
            try {
                await fs.promises.stat(file_path);
                exist_paths.push(file_path);
            } catch (error) {
                // pass
            }
        }

        for (let index = 0; index < exist_paths.length; index++) {
            const file_path = exist_paths[index];
            try {
                await shell.trashItem(file_path);
            } catch (error) {
                return new Error(`${file_path}のゴミ箱への移動に失敗`);
            }
        }

        try {
            await library.delete(videoId);
        } catch (error) {
            return new Error(`error: library.delete ${videoId}`);
        }
        sendMain('library:deleteItem', item);
        return null;
    });

    myIpcMain.handle('library:exists', async (event, videoId) => {
        return library.has(videoId);
    });

    myIpcMain.handle('library:getPlayData', async (event, videoId) => {
        const item = library.getItem(videoId);
        if(!item){
            return null;
        }
        return getPlayDataFromLibrary(item);
    });

    myIpcMain.handle('library:getSearchItems', async (event) => {
        const name = 'library-search';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });

    myIpcMain.handle('library:updateSearchItems', async (event, items) => {
        const name = 'library-search';
        store.setItems(name, items);
        await store.save(name);
    });

    myIpcMain.handle('library:filter', async (event, query) => {
        sendMain('library:filter', query);
    });

    myIpcMain.handle('library:convertToMp4', async (event, videoId) => {
        const item = library.getItem(videoId);
        if(!item){
            return new Error(`${videoId}が存在しない`);
        }
        const videoData = new NicoVideoData(item);
        const ffmpegPath = config.get().ffmpeg_path;
        if(!ffmpegPath){
            return new Error(`ffmpegのパスが設定されていない`);
        }
        if(fs.existsSync(ffmpegPath)){
            return new Error(`${ffmpegPath}が存在しない`);
        }
        const cnv_mp4 = new ConvertMP4();
        const err = await cnv_mp4.convert(ffmpegPath, videoData.getVideoPath());
        return err;
    });

    myIpcMain.handle('library:showContextMenu', async (event, videoId) => {
        const cmd = await popupContextMenu(event.sender, [
            {
                label: 'オンライン再生',
                command: 'playOnline'
            },
            {
                label: 'separator',
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
