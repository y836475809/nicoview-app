const ipc = require("electron").ipcRenderer;

class Command {
    static play(item, online) {
        ipc.send("app:play-video", {
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
            return {
                title: item.title,
                id: item.id,
                time: 0
            };
        });
        obs.trigger("bookmark-page:add-items", bk_items);
    }

    static addDownloadItems(obs, items) {
        obs.trigger("download-page:add-download-items", items);
    }

    static deleteDownloadItems(obs, items) {
        const video_ids = items.map(value => {
            return value.id;
        });
        obs.trigger("download-page:delete-download-items", video_ids);
    }
}

module.exports = {
    Command
};