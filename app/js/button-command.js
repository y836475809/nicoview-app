const { ipcRenderer } = require("electron");
const { IPC_CHANNEL } = require("./ipc-channel");
const { BookMark } = require("./bookmark");

class ButtonCommand {
    static play(item, online) {
        ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
            video_id : item.id,
            time : 0,
            online: online
        });
    }

    static addStackItems(obs, items) {
        const stack_items = items.map(item => {
            return {
                id: item.id,
                title: item.title, 
                thumb_img:item.thumb_img
            };
        });
        obs.trigger("play-stack-page:add-items", {items:stack_items});
    }

    static addBookmarkItems(obs, items) {
        const bk_items = items.map(item => {
            return BookMark.createVideoItem(item.title, item.id);
        });
        obs.trigger("bookmark-page:add-items", bk_items);
    }

    static addDownloadItems(obs, items) {
        obs.trigger("download-page:add-download-items", items);
    }
}

module.exports = {
    ButtonCommand
};