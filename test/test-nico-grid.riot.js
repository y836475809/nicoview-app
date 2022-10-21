const { MyObservable } = require("../app/js/my-observable");
const { tagsFormatter } = require("./nico-grid-formatter");
const { NicoGridStateRestor } = require("./nico-grid-state-restor");
const myapi = require("../app/js/my-api");
const fs = require("fs");
const path = require("path");

module.exports = {
    obs: null,
    /** @type {NicoGridOptions} */
    options: null,
    onBeforeMount() {
        this.row_height = 60;
        this.obs = new MyObservable();

        const ft_info = (id, value, data) => {
            const video_id = data["video_id"];
            return `id: ${video_id}`;
        };
        const columns = [
            {id: "thumb_img", name: "サムネイル", width:150},
            {id: "title",     name: "名前",       width:100},
            {id: "command",   name: "操作",       width:120},
            {id: "info",      name: "情報",       width:160, ft:ft_info},
            {id: "pub_date",  name: "投稿日",     width:200},
            {id: "play_time", name: "時間",       width:150},
            {id: "tags",      name: "コメント",   width:150, sortable:false, ft:tagsFormatter.bind(this, " ")},
            {id: "state",     name: "状態",   width:150},
        ];
        
        this.state_fp = path.join(__dirname, "tmp", "nico-grid-state.json");
        let state = null;
        try {
            fs.accessSync(this.state_fp);
            state = JSON.parse(fs.readFileSync(this.state_fp, "utf-8"));    
        } catch (error) {
            // 
        }
        const state_restor = new NicoGridStateRestor(state);
        this.columns = state_restor.getColumns(state, columns);
        const sort_param = state_restor.getSortParam(state);

        this.options = {
            header_height: 30,
            row_height: 135,
            sort_param: sort_param,
            filter_target_ids: [
                "title", "tags", "video_id"
            ],
            img_cache_capacity:20,
            view_margin_num: 5
        };
    },
    async onMounted() {  
        this.obs.on("cmd",(args) => {
            const { cmd_id, data } = args;
            console.log("cmd_id=", cmd_id, ", data=", data);
        });
        this.obs.on("db-cliecked",(args) => {
            const { data } = args;
            console.log("db-cliecked data=", data);
        });
        this.obs.on("show-contexmenu", async (args) => {
            const menu_id = await myapi.ipc.popupContextMenu("library", {items:[]});
            if(!menu_id){
                return;
            }
        });
        this.obs.on("state-changed", async (args) => {
            const { state } = args;
            this.state = state;
            console.log("state-changed state=", this.state);
        });
        const mk_data = (name) => {
            const src_db = {
                tags: "タグ, コメント",
                video_id: "sm",
                thumb_img: "サムネイル",
                title: "名前",
                command: "操作",
                info: "情報",
                pub_date: "投稿日",
                play_time: "時間",  
            };
            const date1 = new Date("2000/1/1 12:00:00").getTime();
            const date2 = new Date("2020/1/1 12:00:00").getTime();
            const clone_data = {};
            Object.assign(clone_data, src_db);
            Object.keys(src_db).forEach(key => {
                const val = clone_data[key];
                clone_data[key] = `${val}${name}`; 
                if(key == "thumb_img"){
                    const url = "https://nicovideo.cdn.nimg.jp/thumbnails";
                    clone_data[key] = `${url}/${name}/${name}.1234`;
                }  
                if(key == "tags"){
                    clone_data[key] = ["tag1", "tag2"].join(" ");
                }
                if(key == "pub_date"){
                    clone_data[key] = Math.floor(Math.random() * (date2 - date1 + 1) + date1);
                }
                if(key == "play_time"){
                    clone_data[key] = Math.floor(Math.random() * 2000);
                }
            });
            return clone_data;
        };
        const mk_data_list = (size) => {
            const data_list = [];
            for(let i=0; i<size; i++){  
                const clone_data = mk_data(i);
                data_list.push(clone_data);
            }
            return data_list;
        };

        const btn1 = document.getElementById("gt-btn1");
        btn1.onclick = async () => {
            const data_list = mk_data_list(50);
            await this.obs.triggerReturn("set-data", {
                key_id: "video_id",
                items:data_list
            });
        };
        const btn2 = document.getElementById("gt-btn2");
        btn2.onclick = async () => {
            const data_list = mk_data_list(10000);
            await this.obs.triggerReturn("set-data", {
                key_id: "video_id",
                items:data_list
            });
        };
        const btn3 = document.getElementById("gt-btn3");
        btn3.onclick = () => {
            this.obs.trigger("update-item", {
                id: "sm5",
                props:{
                    thumb_img:"update thumb_img",
                    title:"update title",
                }
            });
        };
        let asc = true;
        const btn4 = document.getElementById("gt-btn4");
        btn4.onclick = () => {
            this.obs.trigger("sort-data", {
                sort_param: {
                    id: "title",
                    asc: asc
                }
            });
            asc = !asc;
        };
        const btn5 = document.getElementById("gt-btn5");
        btn5.onclick = async () => {
            /** @type {[]} */
            const sel_data_list = await this.obs.triggerReturn("get-selected-data-list");
            const ids = sel_data_list.map(data=>{
                return data["video_id"];
            });
            this.obs.trigger("delete-items", {
                ids: ids
            });
        };

        let new_data_i = 10000000;
        const add_btn = document.getElementById("gt-add-btn");
        add_btn.onclick = () => {
            const new_data = mk_data(new_data_i);
            this.obs.trigger("add-items", {
                items:[new_data]
            });
            new_data_i++;
        };
        const scroll_video_id_txt = document.getElementById("gt-scroll-video-id-txt");
        scroll_video_id_txt.onkeydown = async (e) => {
            if (e.code.toLowerCase()!="enter"){
                return;
            }
            const video_id = e.target.value;
            const index = await this.obs.triggerReturn("get-index-by-id", {
                id: "video_id",
                value: video_id 
            });
            const view_top_ch = document.getElementById("gt-scroll-view-top");
            this.obs.trigger("scroll-to-index", {
                index,
                position:view_top_ch.checked?"top":"bottom"
            });
        };

        const file1 = document.getElementById("gt-file1");
        file1.onclick = (e) => {
            e.target.value = "";
        };
        file1.onchange = async (e) => {
            /** @type {HTMLInputElement} */
            const file_elm = e.target;
            const files = file_elm.files;
            const fp = files[0].path;
            const text = fs.readFileSync(fp, "utf-8");
            const library_data = JSON.parse(text);
            const data_dir = library_data.path;
            const video_data_list = library_data.video;
            video_data_list.forEach(data => {
                const filename = data.common_filename;
                const video_id = data.video_id;
                const img_size = data.thumbnail_size == "L"?".L":"";
                const img_name = `${filename} - [${video_id}][ThumbImg]${img_size}.jpeg`;
                data.thumb_img = `${data_dir}/${img_name}`;
            });
            await this.obs.triggerReturn("set-data", {
                key_id: "video_id",
                items: video_data_list
            });
        };

        const txt1 = document.getElementById("gt-txt1");
        txt1.onkeydown = (e) => {
            if (e.code.toLowerCase()!="enter"){
                return;
            }
            const title_ch = document.getElementById("gt-title");
            const info_ch = document.getElementById("gt-info");
            const tags_ch = document.getElementById("gt-tags");
            const ids = [];
            if(title_ch.checked){
                ids.push("title");
            }
            if(info_ch.checked){
                ids.push("info");
            }
            if(tags_ch.checked){
                ids.push("tags");
            }
            const text = e.target.value;
            this.obs.trigger("filter", {
                ids: ids,
                text: text
            });
        };

        const get_data_len_btn = document.getElementById("gt-data-len");
        get_data_len_btn.onclick = async () => {
            const data_len = await this.obs.triggerReturn("get-data-length");
            console.log("data_len=", data_len);
        };

        let state_count = 0;
        const inc_count_btn = document.getElementById("gt-inc-count");
        inc_count_btn.onclick = async () => {
            this.obs.trigger("update-item", {
                id: "sm1",
                props:{
                    state: `state:${state_count}`
                }
            });
            state_count++;
        };

        const sel_index_txt = document.getElementById("gt-sel-by-index-txt");
        sel_index_txt.onkeydown = (e) => {
            if (e.code.toLowerCase()!="enter"){
                return;
            }
            const index = Number(e.target.value);
            this.obs.trigger("set-selected-by-index", {
                index
            });
        };

        const get_save_state_btn = document.getElementById("gt-save-state");
        get_save_state_btn.onclick = () => {
            const json = JSON.stringify(this.state, null, "  ");
            fs.writeFileSync(this.state_fp, json, "utf-8");
        };
    }
};