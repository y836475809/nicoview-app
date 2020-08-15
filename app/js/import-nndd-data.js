const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const ipc = require("electron").ipcRenderer;

const import_items = {
    "librarydb": { title: "データベース", filename:"library.db"},
    "history": { title: "履歴", filename:"history.xml" },
    "mylist": { title: "マイリスト",  filename:"myLists.xml" },
    "nglist": { title: "NGリスト",  filename:"ngList.xml" },
    "searchitems": { title: "検索項目", filename:"searchItems.xml" },
};

class ImportNNDDData {
    constructor(nndd_system_dir, data_dir){
        this.nndd_system_dir = nndd_system_dir;
        this.data_dir = data_dir;
    }

    static getItems(){
        const items = [];
        const keys = Object.keys(import_items);
        keys.forEach(key => {
            items.push({
                name: key,
                title: import_items[key].title
            });
        });
        return items;
    }

    async call(name){
        const { filename } = import_items[name];
        await this[name](filename);
    }

    async librarydb(filename){
        const db_file_path = path.join(this.nndd_system_dir, filename);
        const ret = await ipc.invoke("library:import-nndd-db", { db_file_path });
        if(!ret.result){
            throw ret.error;
        }
    }

    async history(filename){
        const xml = await this._readNNDDFile(filename);
        const items = this._getHistory(xml);
        await ipc.invoke("history:updateItems", { items });
    }

    async mylist(filename){
        const xml = await this._readNNDDFile(filename);
        const items = this._getMyList(xml);
        await ipc.invoke("mylist:updateItems", { items });

        const dest_mylist_dir = path.join(this.data_dir, "mylist");
        try {
            await fs.promises.stat(dest_mylist_dir);
        } catch(err) {
            await fs.promises.mkdir(dest_mylist_dir);
        }  

        const mylist_ids = items.map(item => {
            return item.mylist_id;
        });
        const file_items = this._getMyListCopyFiles(mylist_ids, dest_mylist_dir);
        for (let index = 0; index < file_items.length; index++) {
            const { src, dest } = file_items[index];
            await fs.promises.copyFile(src, dest);
        }
    }

    async searchitems(filename){
        const xml = await this._readNNDDFile(filename);
        const items = this._getSearchItems(xml);
        await ipc.invoke("nico-search:updateItems", { items });
    }

    async nglist(filename){
        const xml = await this._readNNDDFile(filename);
        const items = this._getNGList(xml);
        await ipc.invoke("nglist:updateItems", { items });
    }
    
    async _readNNDDFile(filename){
        const file_path = path.join(this.nndd_system_dir, filename);
        return await fs.promises.readFile(file_path, "utf-8");
    }

    _getHistory(xml){
        const data = [];
        const $ = cheerio.load(xml);
        $("historyItem").each((i, el) => {
            const item = $(el);
            const title = decodeURIComponent(item.attr("videoname"));
            const m = title.match(/\s-\s\[(.+)\](?:.*)$/);
            data.push({
                thumb_img: decodeURIComponent(item.attr("thumburl")),
                id: m[1],
                title: title,
                time: 0,
                play_date: parseInt(item.attr("playdate")),
                url: decodeURIComponent(item.attr("url"))
            });
        });

        return data;
    }

    /**
     * 
     * @param {string} xml 
     * @returns {Array}
     */
    _getMyList(xml){
        const data = [];
        const $ = cheerio.load(xml);
        $("myList").each((i, el) => {
            const item = $(el);
            const mylist_id = decodeURIComponent(item.attr("url"));
            const name = decodeURIComponent(item.attr("name"));
            const m = name.match(/\[([^[\]]+)\]$/);
            const creator = m[1];
            const title = name.slice(0, -1 * (creator.length + 2)).trim();
            data.push({
                title: title,
                mylist_id: mylist_id,
                creator: creator,
            });
        });

        return data;
    }

    /**
     * 
     * @param {Array} mylist_ids 
     */
    _getMyListCopyFiles(mylist_ids, dest_mylist_dir){
        const src_mylist_dir = path.join(this.nndd_system_dir, "myList");
        const src_userlist_dir = path.join(this.nndd_system_dir, "user");

        const files = [];
        for (let index = 0; index < mylist_ids.length; index++) {
            const mylist_id = mylist_ids[index];
            const ary = mylist_id.split("/");
            const kind = ary[0];
            const id = ary[1];

            const dest = path.join(dest_mylist_dir, 
                `${kind.toLowerCase()}-${id}.xml`);
            let src = "";
            if(kind.toLowerCase() =="mylist"){
                src = path.join(src_mylist_dir, `${id}.xml`);
            }
            if(kind.toLowerCase() =="user"){
                src = path.join(src_userlist_dir, `${id}.xml`);
            }
            files.push({
                src,
                dest
            });
        }

        return files;
    }

    _getSearchItems(xml){
        // sortType="0" 投稿が新しい
        // sortType="1" 投稿が古い
        // sortType="2" 再生がおおい
        // sortType="3" 再生が少ない
        // sortType="4" コメントが多い
        // sortType="5" コメントが少ない
        // sortType="6" コメントが新しい
        // sortType="7" コメントが古い
        // sortType="8" マイリストが多い
        // sortType="9" マイリストが少ない
        // sortType="10" 再生時間が長い
        // sortType="11" 再生時間が短い

        const sort_type_map = new Map();
        sort_type_map.set(0, { sort_name:"startTime", sort_order:"-" });
        sort_type_map.set(1, { sort_name:"startTime", sort_order:"+" });
        sort_type_map.set(2, { sort_name:"viewCounter", sort_order:"-" });
        sort_type_map.set(3, { sort_name:"viewCounter", sort_order:"+" });
        sort_type_map.set(4, { sort_name:"commentCounter", sort_order:"-" });
        sort_type_map.set(5, { sort_name:"commentCounter", sort_order:"+" });
    
        const search_type_map = new Map();
        search_type_map.set(0, "keyword");
        search_type_map.set(1, "tag");
    
        const data = [];
        const $ = cheerio.load(xml);
        $("searchItem").each((i, el) => {
            const item = $(el);
            const name = decodeURIComponent(item.attr("name"));
            const word = decodeURIComponent(item.attr("searchword"));
            const sort_type = parseInt(item.attr("sorttype"));
            const search_type = parseInt(item.attr("searchtype"));
    
            let sort = sort_type_map.get(0);
            if(sort_type_map.has(sort_type)){
                sort = sort_type_map.get(sort_type);
            }
    
            let search_target = search_type_map.get(0);
            if(search_type_map.has(search_type)){
                search_target = search_type_map.get(search_type);
            }
    
            data.push({
                cond: {
                    query: word,
                    search_target: search_target,
                    sort_name: sort.sort_name,
                    sort_order: sort.sort_order,
                },
                title: name
            });
        });

        return data;
    }

    _getNGList(xml){
        const ng_texts = [];
        const ng_user_ids = [];
        const $ = cheerio.load(xml);
        $("item").each((i, el) => {
            const item = $(el);
            const kind = item.attr("kind");
            const text = decodeURIComponent(item.text());
            if(kind == "ID"){
                ng_user_ids.push(text);
            }else if(kind == "単語"){
                ng_texts.push(text);
            }
        });

        return { ng_texts, ng_user_ids };
    }
}

module.exports = {
    ImportNNDDData
};