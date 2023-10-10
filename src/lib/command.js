const ipc = require("electron").ipcRenderer;
const { BrowserWindow, ipcMain } = require("electron");

/**
 * メインプロセスで実行されてるかどうかを判定する
 * @returns {boolean} true:メインプロセスで実行
 */
const isMainProcess = () => {
    return process.type == "browser";
};

/**
 * 
 * @param {string} channel 
 * @param {any} args 
 */
const send = (channel, args) => {
    const win = BrowserWindow.getAllWindows().find(bw=>{
        const url = bw.webContents.getURL();
        return url.includes("main");
    });
    win.webContents.send(channel, args);
};

class Command {
    /**
     * 動画再生
     * @param {{video_id:string, time?:number}} item 
     * @param {boolean} online true:オンライン再生を優先
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
     * 「後で見る」に追加
     * @param {MyObservable} obs 
     * @param {{video_id:string, title:string, thumb_img:string}[]} items 
     */
    static addStackItems(obs, items) {
        const stack_items = items.map(item => {
            return {
                video_id: item.video_id,
                title: item.title, 
                thumb_img:item.thumb_img
            };
        });

        if(isMainProcess()){
            send("app:add-stack-items", {items:stack_items});
        }else{
            obs.trigger("play-stack:add-items", {items:stack_items});
        }
    }

    /**
     * ブックマークに追加
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
            obs.trigger("bookmark:add-items", bk_items);
        } 
    }

    /**
     * 動画をダウンロード登録
     * @param {MyObservable} obs 
     * @param {{video_id:string, title:string, thumb_img:string}[]} items 
     */
    static addDownloadItems(obs, items) {
        if(isMainProcess()){
            send("app:add-download-items", items);
        }else{
            obs.trigger("download:add-download-items", items);
        } 
    }

    /**
     * 動画をダウンロード登録から削除
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
            obs.trigger("download:delete-download-items", video_ids);
        }
    }

    /**
     * 保存済みマイリストを読み込む
     * @param {string} mylist_id 読み込むマイリストid
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