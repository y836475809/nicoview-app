import { ipcMain, BrowserWindow, dialog } from 'electron';
    
export function registerDialogHandlers(){
    /** @type {MyIpcMain} */
    const myIpcMain = ipcMain;

    myIpcMain.handle('showMsgBox', async (event, buttons, message)=>{
        const bw = BrowserWindow.fromId(event.sender.id);
        if(!bw){
            return false;
        }
        const ret = await dialog.showMessageBox(bw, {
            type: 'info', 
            buttons: buttons==='okCancel'?["OK","Cancel"]:["OK"],
            message: message,
        });
        return ret.response === 0;
    });

    myIpcMain.handle('showErrorMsgBox', async (event, message)=>{
        const bw = BrowserWindow.fromId(event.sender.id);
        if(!bw){
            return;
        }
        await dialog.showMessageBox(bw, {
            type: 'error', 
            buttons: ["OK"],
            message: message,
        });
    });

    myIpcMain.handle('showSelectFolderDialog', async (event)=>{
        const bw = BrowserWindow.fromId(event.sender.id);
        if(!bw){
            throw new Error(`not found window`);
        }
        const result = await dialog.showOpenDialog(bw, {
            properties: ["openDirectory"],
            title: "フォルダを選択",
            defaultPath: "."
        });
        if(result.canceled){
            return null;
        }
        return result.filePaths[0];
    });

    myIpcMain.handle('showSelectFileDialog', async (event)=>{
        const bw = BrowserWindow.fromId(event.sender.id);
        if(!bw){
            throw new Error(`not found window`);
        }
        const result = await dialog.showOpenDialog(bw, {
            properties: ["openFile"],
            title: "ファイルを選択",
            defaultPath: ".",
            filters: [{name: "All", extensions: ["*"]}]
        });
        if(result.canceled){
            return null;
        }
        return result.filePaths[0];
    });
}
