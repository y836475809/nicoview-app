import { ipcMain} from 'electron';
import { Store } from "@lib/store.js";

/**
 * 
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export function registerBookMarkHandlers(config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);

    myIpcMain.handle('bookmark:getItems', async (event) => {
        const name = 'bookmark';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });
    myIpcMain.handle('bookmark:saveItems', async (event, items) => {
        const name = 'bookmark';
        store.setItems(name, items);
        await store.save(name);
    });
    myIpcMain.handle('bookmark:addItem', async (event, item) => {
        sendMain('bookmark:additem', item);
    }); 
}

/**
 * 
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export function registerStackHandlers(config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);

    myIpcMain.handle('stack:getItems', async (event) => {
        const name = 'stack';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });
    myIpcMain.handle('stack:saveItems', async (event, items) => {
        const name = 'stack';
        store.setItems(name, items);
        await store.save(name);
    });
    myIpcMain.handle('stack:addItem', async (event, item) => {
        const name = 'stack';
        const items = store.getItems(name);
        items.unshift(item);
        store.setItems(name, items);
        sendMain('stack:additem', item);
    });

    myIpcMain.handle('nicoSearch:getItems', async (event) => {
        const name = 'nico-search';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });
    myIpcMain.handle('nicoSearch:saveItems', async (event, items) => {
        const name = 'nico-search';
        store.setItems(name, items);
        await store.save(name);
    });

    myIpcMain.handle('ngList:getItems', async (event) => {
        const name = 'nglist';
        if(!store.has(name)){
            await store.load(name);
        }
        return store.getItems(name);
    });
    myIpcMain.handle('ngList:saveItems', async (event, items) => {
        const name = 'nglist';
        store.setItems(name, items);
        await store.save(name);
    });

}