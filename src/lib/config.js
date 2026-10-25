
import fs from 'fs';
const fsPromises = fs.promises;

/**
 * 設定
 */
export class Config {
    constructor(){
        /** @type {string|null} */
        this._configPath = null;
        /** @type {AppConfig} */
        this._jsonData = this._getDefault();
    }

    /**
     * @param {string|null} value 
     */
    set configPath(value){
        this._configPath = value;
    }

    get configPath(){
        return this._configPath;
    }

    setDefault(){
        this._jsonData = this._getDefault();
    }

    /**
     * 
     * @returns {AppConfig}
     */
    get() {
        return JSON.parse(JSON.stringify(this._jsonData));;
    }

    /**
     * keyにvalueを設定する
     * @template {keyof AppConfig} K
     * @param {K} key 
     * @param {AppConfig[K]} value 
     */
    set(key, value) {
        this._jsonData[key] = value;
    }

    async load() {
        if(!fs.existsSync(this._configPath)){
            this.setDefault();
            return;
        }
        const data = await fsPromises.readFile(this._configPath, "utf-8");
        const jsonData = JSON.parse(data);
        const defaultJsonData = this._getDefault();
        for(const [key, value] of Object.entries(defaultJsonData)){
            if(!Object.hasOwn(jsonData, key)){
                jsonData[key] = value;
            }
        }
        this._jsonData = jsonData;
    }

    async save() {
        const json = JSON.stringify(this._jsonData, null, "  ");
        await fsPromises.writeFile(this._configPath, json, "utf-8");
    }

    /**
     * @returns {AppConfig}
     */
    _getDefault(){
        return {
            data_dir: null,
            log: {
                level: 'debug'
            },
            open_devtools: false,
            mouse_gesture: {
                search_page_back_page: 'left',
                search_page_forward_page: 'right',
                all_page_show_player: 'up',
            },
            user_icon_cache: true,
            ffmpeg_path: null,
            use_mouse_gesture: true,
            main: {
                window: {
                    state: {
                        x: 0,
                        y: 0,
                        width: 800,
                        height: 600,
                        maximized: false,
                    },
                },
            },
            player: {
                infoview_width: 300,
                sync_comment: true,
                volume: 0.2,
                window: {
                    state: {
                        x: 0,
                        y: 0,
                        width: 800,
                        height: 600,
                        maximized: false,
                    },
                },
                infoview_show: true,
                contextmenu: {
                    history_num: 10,
                    stack_num: 5,
                },
            },
            download: {
                dir: null,
                schedule: {
                    date: {
                        hour: 5,
                        minute: 0,
                    },
                    enable: false,
                },
                wait_time: 10,
            },
            search: {
                condition: {
                    search_target: {
                        target: 'tag'
                    },
                    sort: {
                        name: 'startTime',
                        order: '-'
                    },
                    api: 'snapshot'
                },
            },
            comment: {
                auto_sync_checked: true,
                auto_sync_interval: 30,
                auto_sync_threshold: 0.05,
                fps: 10,
                duration_sec: 4,
                do_limit: true
            },
            nndd: {
                librarydb: false,
                history: false,
                mylist: false,
                nglist: false,
                searchitems: false,
                system_path: null
            },
            nico_grid_library: {
                columns: []
            },
            player_comment_nico_grid: {
                columns: []
            },
            player_ng_comment_nico_grid: {
                columns: []
            },
            download_nico_grid: {
                columns: []
            },
            mylist_nico_grid: {
                columns: []
            },
            library_nico_grid: {
                columns: [],
                sort_param: {
                    id: 'creation_date',
                    asc: false,
                    enable: true
                },
            },
            history_nico_grid: {
                columns: []
            },
            search_nico_grid: {
                columns: []
            },
        };
    }
}
