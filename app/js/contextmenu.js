const { ipcMain, Menu, clipboard } = require("electron");
const { toTimeString } = require("./time-format"); 
const { getWatchURL } = require("./nico-url"); 

const getMenuEnable = (menu_id, data) => {
    const { title, thumbnailURL } = data;

    if(menu_id == "show-open-video-form"){
        return true;
    }
    if(menu_id == "copy-url"){
        return true;
    }
    if(menu_id == "reload"){
        return true;
    }

    if(!title || !thumbnailURL) {
        return false;
    }

    return true;
};

const setupPlayerCM1 = (window) => {
    ipcMain.handle("app:show-player-contextmeu", async (event, args) => {
        const { play_data } = args;
        const { video_id, title, thumbnailURL, online } = play_data;
        return await new Promise((resolve, reject) => {
            const menu_items = [
                { 
                    id: "add-bookmark",
                    label: "ブックマーク",
                },
                { 
                    id: "add-bookmark-time",
                    label: "ブックマーク(時間)", 
                },
                { 
                    id: "add-stack-time",
                    label: "後で見る", 
                },
                { type: "separator" },
                { 
                    id: "add-download",
                    label: "ダウンロードに追加", 
                },   
                { type: "separator" },
                { 
                    id: "copy-url",
                    label: "urlをコピー", click() {
                        const url = getWatchURL(video_id);
                        clipboard.writeText(url);
                        resolve(null);
                    }
                },
                { type: "separator" },
                { 
                    id: "show-open-video-form",
                    label: "動画ID/URLを指定して再生",
                },               
                { type: "separator" },
                { 
                    id: "reload",
                    label: "再読み込み", click() {
                        ipcMain.emit("app:play-video", null, {
                            video_id: video_id,
                            time: 0,
                            online: online
                        });
                        resolve(null);
                    }
                },
                { type: "separator" },
                {
                    id: "change-movie-size",
                    label: "動画のサイズに変更", 
                },
                { type: "separator" },
                {
                    label: "ヘルプ",
                    submenu: [
                        { role: "reload" },
                        { role: "forcereload" },
                        { role: "toggledevtools" },
                    ]
                } 
            ];
    
            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    const id = menu_item.id;
                    if(!menu_item.click){  
                        console.log("menu_item.click id=", id);         
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                    menu_item.enabled = getMenuEnable(id, play_data);
                }
            });

            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const setupPlayerCM2 = (window, store, history, config) => {
    ipcMain.handle("app:show-player-contextmeu2", async (event, args) => {
        return await new Promise((resolve, reject) => {
            const createMenuItems = (items) => {
                return items.map(item=>{
                    const { id, title, time } = item;
                    const getTitle = () => {
                        if(time){
                            return `[${toTimeString(time)}] ${title}`;
                        }else{
                            return title;
                        } 
                    };
                    return { 
                        label: getTitle(), click() {
                            resolve({
                                video_id: id,
                                time: time?time:0,
                                online: false
                            });
                        }
                    };
                });
            };

            const history_num = config.get("player.contextmenu.history_num", 5);
            const stack_num = config.get("player.contextmenu.stack_num", 5);
            const history_items = history.getData("history").slice(1, history_num+1);
            const stack_items = store.getItems("stack").slice(0, stack_num);
            
            const menu_items = createMenuItems(history_items);
            if(stack_items.length > 0){
                menu_items.push({ type: "separator" });
                Array.prototype.push.apply(menu_items, createMenuItems(stack_items));
            }
            const context_menu =  Menu.buildFromTemplate(menu_items.concat());
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};


module.exports = { 
    setupPlayerCM1,
    setupPlayerCM2,
};