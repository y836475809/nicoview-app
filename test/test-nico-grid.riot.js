const { MyObservable } = require("../app/js/my-observable");
const { buttonFormatter } = require("./nico-grid-formatter");

module.exports = {
    obs: null,
    onBeforeMount() {
        this.row_height = 60;
        this.obs = new MyObservable();

        const ft = (cell_data) => {
            return `<a href="">${cell_data.data}</a>`;
        };
        const cmd_opt = ["play", "stack", "bookmark", "download"];
        this.columns = [
            {id: "thumb_img", name: "サムネイル", width:150, ft:ft},
            {id: "title",     name: "名前",       width:150, ft:ft},
            {id: "command",   name: "操作",       width:150, ft:buttonFormatter.bind(this, cmd_opt)},
            {id: "info",      name: "情報",       width:150, ft:ft},
            {id: "pub_date",  name: "投稿日",     width:150, ft:ft},
            {id: "play_time", name: "時間",       width:150, ft:ft},
            {id: "tags",      name: "タグ, コメント", width:150, ft:ft},
        ];
        this.header_height = 30;
        this.row_height = 60;
        this.sort = {
            key: "title",
            asc: false
        };
    },
    async onMounted() {  
        this.obs.on("cmd",(args) => {
            const { cmd_id, data } = args;
            console.log("cmd_id=", cmd_id, ", data=", data);
        });

        const mk_data = (size) => {
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
            const data_list = [];
            for(let i=0; i<size; i++){  
                const clone_data = {};
                Object.assign(clone_data, src_db);
                Object.keys(src_db).forEach(key => {
                    const val = clone_data[key];
                    clone_data[key] = `${val}${i}`; 
                });
                clone_data["video_id"] = `${clone_data["video_id"]}${i}`;
                data_list.push(clone_data);
            }
            return data_list;
        };

        const btn1 = document.getElementById("gt-btn1");
        btn1.onclick = async () => {
            const data_list = mk_data(50);
            await this.obs.triggerReturn("set-data", {
                key_id: "video_id",
                items:data_list
            });
        };
        const btn2 = document.getElementById("gt-btn2");
        btn2.onclick = async () => {
            const data_list = mk_data(10000);
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
                key: "title",
                asc: asc
            });
            asc = !asc;
        };
        const btn5 = document.getElementById("gt-btn5");
        btn5.onclick = async () => {
            /** @type {[]} */
            const sel_data_list = await this.obs.triggerReturn("get-selected-data-list")
            const ids = sel_data_list.map(data=>{
                return data["video_id"];
            });
            this.obs.trigger("delete-items", {
                ids: ids
            });
        };
    }
};