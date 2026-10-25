import { ipcMain } from 'electron';
import path from "path";
import { Store } from "@lib/store.js";
import { NicoMylist, NicoMylistStore, NicoMylistImageCache } 
    from "@lib/nico-mylist.js";

/**
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export function registerMyListHandlers(config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);

    myIpcMain.handle('mylist:getItems', async (event) => {
        const name = 'mylist';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });
    myIpcMain.handle('mylist:saveItems', async (event, items) => {
        const name = 'mylist';
        store.setItems(name, items);
        await store.save(name);
    });

    let nico_mylist = new NicoMylist();
    const mylistDir = path.join(dataDir, 'mylist');
    const nico_mylist_store = new NicoMylistStore(mylistDir);
    const nico_mylist_image_cache = new NicoMylistImageCache(mylistDir);    
    myIpcMain.handle('mylist:loadPage', async (event, mylistId) => {
        sendMain('mylist:loadPage', mylistId);
    });
    myIpcMain.handle('mylist:getPage', async (event, mylistId) => {
        return nico_mylist_store.load(mylistId);
    });
    myIpcMain.handle('mylist:deletPage', async (event, mylistId) => {
        nico_mylist_store.delete(mylistId);
        nico_mylist_image_cache.delete(mylistId);
    });
    myIpcMain.handle('mylist:savePage', async (event, mylistId) => {
        if(nico_mylist.mylist?.mylist_id === mylistId){
            nico_mylist_store.save(mylistId, nico_mylist.xml);
        }
    });
    myIpcMain.handle('mylist:saveImageCache', async (event, mylistIds) => {
        nico_mylist_image_cache.setExistLocalIDList(mylistIds);
        nico_mylist_image_cache.save();
    });
    myIpcMain.handle('mylist:getImageHtml', async (event, mylistId, url) => {
        return nico_mylist_image_cache.getImageHtml(mylistId, url);
    });
    myIpcMain.handle('mylist:loadImageCache', async (event, mylistIds, mylistId) => {
        nico_mylist_image_cache.setExistLocalIDList(mylistIds);
        nico_mylist_image_cache.loadCache(mylistId);
    });
    myIpcMain.handle('mylist:setImageIds', async (event, mylistIds) => {
        nico_mylist_image_cache.setExistLocalIDList(mylistIds);
    });
    myIpcMain.handle('mylist:setImage', async (event, mylistId, imageElem) => {
        nico_mylist_image_cache.setImage(mylistId, imageElem);
    });
    myIpcMain.handle('mylist:fetchPage', async (event, mylistId) => {
        nico_mylist = new NicoMylist();
        return await nico_mylist.getMylist(mylistId);
    });
}