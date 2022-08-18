const path = require("path");
const EventEmitter = require("events");
const { LibraryDB } = require("./db");

class Library extends EventEmitter {
    constructor(){
        super();
    }

    /** @returns {string} */
    get dataDir(){
        return this._data_dir;
    }

    /**
     * 
     * @param {string} data_dir 動画保存先ディレクトリ
     */
    setup(data_dir){
        this.library_db = null;
        this._data_dir = data_dir;
    }

    /**
     * ライブラリから動画idのデータを返す
     * @param {string} video_id 動画id
     * @returns {LibraryItem|null}
     */
    getItem(video_id){
        if(!this.library_db){
            return null;
        }

        return this.library_db.find(video_id);
    }

    /**
     * ライブラリから全データを返す
     * @returns {LibraryItem[]}
     */
    getItems(){
        if(!this.library_db){
            return [];
        }

        return this.library_db.findAll();
    }

    /**
     * ライブラリに動画idのデータがあるかを判定する
     * @param {string} video_id 動画id
     * @returns {boolean} true:動画idのデータがある
     */
    has(video_id){
        if(!this.library_db){
            return false;
        }

        return this.library_db.exist(video_id);
    }

    /**
     * ライブラリの動画idのデータにpropsを反映させる
     * @param {string} video_id 動画id
     * @param {{}} props 
     * @returns {Promise<void>}
     */
    async update(video_id, props){
        if(!this.library_db){
            return;
        }

        await this.library_db.update(video_id, props);
        this.emit("update-item", {video_id, props});
    }

    /**
     * ライブラリをファイルに保存する
     * @param {boolean} force true:データ変更がなくても書き込みを実行する
     * @returns {Promise<void>}
     */
    async save(force=true){
        if(!this.library_db){
            return;
        }

        await this.library_db.save(force);
    }

    /**
     * ライブラリにディレクトリと動画データを設定する
     * @param {{id:string,dirpath:string}[]} path_data_list 
     * @param {LibraryItem[]} video_data_list 
     */
    setData(path_data_list, video_data_list){
        this.library_db = new LibraryDB(
            {filename : path.join(this._data_dir, "library.json")});
        this.library_db.setPathData(path_data_list);
        this.library_db.setVideoData(video_data_list);

        this.emit("init");
    }
    async load(){
        this.library_db = new LibraryDB(
            {filename : path.join(this._data_dir, "library.json")});
        await this.library_db.load();
        this.emit("init");
    }

    /**
     * ライブラリにダウンロードした動画情報を追加
     * @param {DownloadedItem} download_item ダウンロード情報
     * @returns {Promise<void>}
     */
    async addDownloadedItem(download_item){
        if(!this.library_db){
            return;
        }
        /** @type {LibraryItem} */
        const video_item = Object.assign({}, download_item);
        video_item.common_filename = download_item.title;
        video_item.creation_date = new Date().getTime();
        video_item.last_play_date = -1;
        video_item.modification_date = -1;
        video_item.play_count = 0;
        await this.library_db.insert(video_item.dirpath, video_item);
        this.emit("add-item", {video_item});
    }
    
    /**
     * ライブラリに動画情報追加
     * @param {LibraryItem} item 動画情報
     * @returns {Promise<void>}
     */
    async addItem(item){
        if(!this.library_db){
            return;
        }

        await this.library_db.insert(item.dirpath, item);
        this.emit("add-item", { video_item : item });
    }
    
    /**
     * ライブラリにデータ追加
     * @param {string} video_id 動画id
     * @returns {Promise<void>}
     */
    async delete(video_id){
        if(!this.library_db){
            return;
        }
        
        await this.library_db.delete(video_id);
        this.emit("delete-item", { video_id });
    }
}

module.exports = {
    Library
};
