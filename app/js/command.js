const ipc = require("electron").ipcRenderer;
const { BrowserWindow, ipcMain } = require("electron");

const isMainProcess = () => {
    return process.type == "browser";
};

/**
 * 
 * @param {string} channel 
 * @param {*} args 
 */
const send = (channel, args) => {
    const win = BrowserWindow.getAllWindows().find(bw=>{
        return bw._tag == "main";
    });
    win.webContents.send(channel, args);
};

class Command {
    /**
     * 
     * @param {{id:string, time:number}} item 
     * @param {boolean} online 
     */
    static play(item, online) {
        const video_item = {
            video_id : item.video_id,
            time : item.time?item.time:0,
            online: online
        };

        if(isMainProcess()){
            ipcMain.emit("app:play-video", null, video_item);
        }else{
            ipc.send("app:play-video", video_item);
        }  
    }

    /**
     * 
     * @param {MyObservable} obs 
     * @param {{id:string, title:string, thumb_img:string}[]} items 
     */
    static addStackItems(obs, items) {
        const stack_items = items.map(item => {
            return {
                id: item.id,
                title: item.title, 
                thumb_img:item.thumb_img
            };
        });

        if(isMainProcess()){
            send("app:add-stack-items", {items:stack_items});
        }else{
            obs.trigger("play-stack-page:add-items", {items:stack_items});
        }
    }

    /**
     * 
     * @param {MyObservable} obs 
     * @param {{video_id:string, title:string}[]} items 
     */
    static addBookmarkItems(obs, items) {
        const bk_items = items.map(item => {
            return {
                title: item.title,
                video_id: item.video_id,
                time: 0
            };
        });

        if(isMainProcess()){
            send("app:add-bookmarks", bk_items);
        }else{
            obs.trigger("bookmark-page:add-items", bk_items);
        } 
    }

    /**
     * 
     * @param {MyObservable} obs 
     * @param {{video_id:string, title:string, thumb_img:string}[]} items 
     */
    static addDownloadItems(obs, items) {
        if(isMainProcess()){
            send("app:add-download-items", items);
        }else{
            obs.trigger("download-page:add-download-items", items);
        } 
    }

    /**
     * 
     * @param {MyObservable} obs 
     * @param {{video_id:string}[]} items 
     */
    static deleteDownloadItems(obs, items) {
        const video_ids = items.map(value => {
            return value.video_id;
        });

        if(isMainProcess()){
            send("app:delete-download-items", video_ids);
        }else{
            obs.trigger("download-page:delete-download-items", video_ids);
        }
    }

    /**
     * 
     * @param {string} mylist_id 
     */
    static loadMylist(mylist_id) {
        if(isMainProcess()){
            send("app:load-mylist", mylist_id);
        }
    }
}

module.exports = {
    Command
};