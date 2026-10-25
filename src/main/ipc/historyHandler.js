import { ipcMain } from 'electron';
import { Store } from "@lib/store.js";
import { History } from "@lib/history.js";

/**
 * @param {import('@lib/config.js').Config} config 
 * @param {MySend} sendMain 
 */
export async function registerHistoryHandlers(config, sendMain){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    const dataDir = config.get().data_dir;
    if(!dataDir){
        throw new Error(`dataDir is null`);
    }
    const store = new Store(dataDir);
    
    const history = new History();
    const history_max = 50;
    await store.load("history");
    const items = store.getItems("history");
    history.setup(history_max);  
    history.setData(items);
    myIpcMain.handle('history:getItems', async (event) => {
        return history.getData();
    });
    myIpcMain.handle('history:saveItems', async (event, items) => {
        const name = 'history';
        store.setItems(name, items);
        await store.save(name);
    });
    myIpcMain.handle('history:addItem', async (event, item) => {
        const name = 'history';
        history.add(item);
        const items = history.getData();
        store.setItems(name, items);
        await store.save("history");
        sendMain('history:addItem', item);
    });
}